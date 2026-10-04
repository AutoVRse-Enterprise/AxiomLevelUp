import {
  BookOpenCheck,
  CircleHelp,
  Flame,
  RadioTower,
  Sparkles,
  Trophy,
  Vibrate,
} from 'lucide-react'
import { useState } from 'react'

import { useContent } from '@/app/contentContext'
import { EmptyState } from '@/components/feedback/EmptyState'
import {
  Avatar,
  BadgeTile,
  MasteryBar,
  SectionHeader,
  StatTile,
  WeeklyActivityStrip,
} from '@/components/learning'
import { getBadgeIcon } from '@/components/learning/badgeIconRegistry'
import { OfflineStorageManager } from '@/components/offline/OfflineStorageManager'
import { Button, Card, ProgressBar } from '@/components/ui'
import { learnerSeedSchema } from '@/content/schema'
import { hapticsSupported } from '@/effects/haptics'
import { today } from '@/lib/clock'
import { useLearnerStore } from '@/state/learnerStore'
import { usePreferencesStore } from '@/state/preferences'
import {
  selectBadgeViews,
  describeCriterion,
  selectDisplayedStreak,
  selectLevelProgress,
  selectProfileStats,
  selectWeeklyActivity,
} from '@/state/selectors'

const categoryLabels = {
  learning: 'Learning achievements',
  performance: 'Performance achievements',
  consistency: 'Consistency achievements',
} as const

export function ProfilePage() {
  const registry = useContent()
  const { appConfig } = registry
  const learner = useLearnerStore((state) => state.learner)
  const seedProfile = useLearnerStore((state) => state.seedProfile)
  const replaceWithSeed = useLearnerStore((state) => state.replaceWithSeed)
  const [demoStatus, setDemoStatus] = useState('')
  const [loadingProfile, setLoadingProfile] = useState<string | null>(null)
  const xp = useLearnerStore((state) => state.xp)
  const streak = useLearnerStore((state) => state.streak)
  const weeklyGoal = useLearnerStore((state) => state.weeklyGoal)
  const stats = useLearnerStore((state) => state.stats)
  const mastery = useLearnerStore((state) => state.mastery)
  const motion = usePreferencesStore((state) => state.motion)
  const setMotion = usePreferencesStore((state) => state.setMotion)
  const hapticsEnabled = usePreferencesStore((state) => state.hapticsEnabled)
  const setHapticsEnabled = usePreferencesStore((state) => state.setHapticsEnabled)
  const badges = useLearnerStore((state) => state.badges)
  const lessonProgress = useLearnerStore((state) => state.lessonProgress)
  const caseProgress = useLearnerStore((state) => state.caseProgress)
  const caseAttempts = useLearnerStore((state) => state.caseAttempts)
  const gamification = useLearnerStore((state) => state.gamification)
  const level = selectLevelProgress({ xp }, appConfig.gamification.levels)
  const profileStats = selectProfileStats({ stats })
  const badgeViews = selectBadgeViews(
    { badges, lessonProgress, caseProgress, caseAttempts, gamification, streak },
    appConfig.badges,
    registry,
  )
  const currentDate = today()
  const activity = selectWeeklyActivity({ weeklyGoal }, appConfig.product.weekStartsOn, currentDate)
  const currentStreak = selectDisplayedStreak({ streak }, currentDate)
  const masteryViews = appConfig.concepts
    .map((concept) => ({ ...concept, score: mastery[concept.id]?.score ?? 0 }))
    .sort((a, b) => b.score - a.score)
  const demo = appConfig.demo?.enabled ? appConfig.demo : null

  const applyDemoProfile = async (profileId: string) => {
    const profile = demo?.profiles.find(({ id }) => id === profileId)
    if (!profile) return
    setLoadingProfile(profile.id)
    setDemoStatus('')
    try {
      const seedPath = registry.manifest.seeds[profile.seedProfile]
      const response = await fetch(`/content/${seedPath}`)
      if (!response.ok) throw new Error(`Seed request failed with ${response.status}.`)
      replaceWithSeed(learnerSeedSchema.parse(await response.json()))
      setDemoStatus(`${profile.label} loaded.`)
    } catch {
      setDemoStatus('Could not load that demo profile. Try again while online.')
    } finally {
      setLoadingProfile(null)
    }
  }

  return (
    <div className="space-y-9">
      <Card className="overflow-hidden bg-gradient-to-br from-brand-900 to-brand-700 text-white">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <Avatar
            className="size-20 bg-white/15 text-xl text-white ring-2 ring-white/30"
            name={learner.name}
            src={learner.avatar}
          />
          <div className="min-w-0 flex-1">
            <p className="text-small font-semibold text-brand-200">Learner profile</p>
            <h1 className="mt-1 text-display font-bold">{learner.name}</h1>
            <p className="mt-2 text-brand-100">{learner.role}</p>
          </div>
          <div className="rounded-lg bg-white/10 p-4 sm:text-right">
            <p className="text-caption font-semibold uppercase tracking-wide text-brand-200">
              Current level
            </p>
            <p className="mt-1 text-title font-bold">Level {level.level}</p>
            {level.label ? <p className="text-small text-brand-100">{level.label}</p> : null}
          </div>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
          <ProgressBar
            className="[&_span]:text-white [&_[role=progressbar]]:bg-brand-950/40"
            label={
              level.nextLevelXp
                ? `${xp.total.toLocaleString()} XP · ${level.nextLevelXp - xp.total} to next level`
                : `${xp.total.toLocaleString()} XP · Highest level`
            }
            value={level.percentage}
          />
          <p className="flex items-center gap-2 font-semibold text-brand-100">
            <Flame aria-hidden="true" size={19} /> {currentStreak} day streak
          </p>
        </div>
      </Card>

      {demo ? (
        <section aria-label="Demo controls">
          <SectionHeader
            description="Presenter tools replace local progress on this device."
            title="Switch demo profile"
          />
          <Card className="mt-4">
            <div className="grid gap-3 sm:grid-cols-2">
              {demo.profiles.map((profile) => {
                const active = profile.seedProfile === seedProfile
                return (
                  <div className="rounded-lg border border-neutral-200 p-4" key={profile.id}>
                    <p className="font-bold text-neutral-950">{profile.label}</p>
                    <p className="mt-1 text-small text-neutral-600">{profile.description}</p>
                    <Button
                      className="mt-3"
                      disabled={loadingProfile !== null || active}
                      size="sm"
                      variant={active ? 'secondary' : 'primary'}
                      onClick={() => void applyDemoProfile(profile.id)}
                    >
                      {active ? 'Current profile' : `Switch to ${profile.label}`}
                    </Button>
                  </div>
                )
              })}
            </div>
            <Button
              className="mt-4"
              disabled={loadingProfile !== null}
              variant="secondary"
              onClick={() => {
                const activeProfile = demo.profiles.find(
                  ({ seedProfile: profileSeed }) => profileSeed === seedProfile,
                )
                if (activeProfile) void applyDemoProfile(activeProfile.id)
              }}
            >
              Reset demo
            </Button>
            <p aria-live="polite" className="mt-3 text-small text-neutral-600" role="status">
              {demoStatus}
            </p>
          </Card>
        </section>
      ) : null}

      <section aria-label="Learner statistics">
        <SectionHeader title="Your stats" />
        <div className="mt-4 grid grid-cols-[repeat(auto-fit,minmax(min(100%,9rem),1fr))] gap-3 lg:grid-cols-5">
          <StatTile
            icon={<Trophy aria-hidden="true" size={17} />}
            label="Courses"
            value={profileStats.coursesCompleted}
          />
          <StatTile
            icon={<BookOpenCheck aria-hidden="true" size={17} />}
            label="Lessons"
            value={profileStats.lessonsCompleted}
          />
          <StatTile
            icon={<RadioTower aria-hidden="true" size={17} />}
            label="Challenges"
            value={profileStats.challengesCompleted}
          />
          <StatTile
            icon={<CircleHelp aria-hidden="true" size={17} />}
            label="Questions"
            value={profileStats.questionsAnswered}
          />
          <StatTile label="Accuracy" value={`${profileStats.accuracy}%`} />
        </div>
      </section>

      <section aria-label="Concept mastery">
        <SectionHeader
          description="Mastery reflects demonstrated understanding, separately from XP."
          title="Mastery"
        />
        {masteryViews.some(({ score }) => score > 0) ? (
          <Card className="mt-4 grid gap-5 md:grid-cols-2">
            {masteryViews.map((concept) => (
              <MasteryBar key={concept.id} label={concept.title} value={concept.score} />
            ))}
          </Card>
        ) : (
          <div className="mt-4">
            <EmptyState
              message="Complete a scored activity to begin building concept mastery."
              title="No mastery evidence yet"
              titleAs="h3"
            />
          </div>
        )}
      </section>

      <section aria-label="Achievements">
        <SectionHeader title="Achievements" />
        <div className="mt-5 space-y-7">
          {Object.entries(categoryLabels).map(([category, label]) => {
            const items = badgeViews.filter((badge) => badge.category === category)
            if (!items.length) return null
            return (
              <div key={category}>
                <h3 className="font-bold">{label}</h3>
                <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {items.map((badge) => (
                    <BadgeTile
                      description={
                        badge.unlocked
                          ? badge.description
                          : `${describeCriterion(badge.criteria)}.`
                      }
                      icon={getBadgeIcon(badge.icon)}
                      key={badge.id}
                      progress={badge.progress}
                      title={badge.title}
                      unlocked={badge.unlocked}
                      unlockedLabel={
                        badge.unlockedAt
                          ? `Unlocked ${new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(new Date(badge.unlockedAt))}`
                          : undefined
                      }
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <section aria-label="Weekly activity">
        <SectionHeader title="Activity" />
        {activity.completedCount > 0 ? (
          <Card className="mt-4">
            <WeeklyActivityStrip {...activity} />
          </Card>
        ) : (
          <div className="mt-4">
            <EmptyState
              message="Start a lesson or challenge to add your first active day."
              title="Your week is ready"
              titleAs="h3"
            />
          </div>
        )}
      </section>

      <section aria-label="Experience preferences">
        <SectionHeader description="These settings apply only to this device." title="Experience" />
        <Card className="mt-4 grid min-w-0 gap-5 md:grid-cols-2">
          <label className="grid min-w-0 gap-2">
            <span className="flex items-center gap-2 font-bold">
              <Sparkles aria-hidden="true" size={18} /> Motion
            </span>
            <span className="text-small text-neutral-600">
              Follow your device or choose how interface movement behaves.
            </span>
            <select
              className="min-h-11 min-w-0 max-w-full rounded-md border border-neutral-300 bg-white px-3 text-body"
              onChange={(event) => setMotion(event.target.value as 'system' | 'reduced' | 'full')}
              value={motion}
            >
              <option value="system">Use device setting</option>
              <option value="reduced">Reduce motion</option>
              <option value="full">Full motion</option>
            </select>
          </label>

          {hapticsSupported() ? (
            <div className="flex min-h-11 min-w-0 items-start gap-3 rounded-lg border border-neutral-200 p-4">
              <input
                aria-label="Haptic feedback"
                checked={hapticsEnabled}
                className="mt-1 size-5 accent-brand-700"
                id="haptics-enabled"
                onChange={(event) => setHapticsEnabled(event.target.checked)}
                type="checkbox"
              />
              <span className="min-w-0">
                <span className="flex items-center gap-2 font-bold">
                  <Vibrate aria-hidden="true" size={18} /> Haptic feedback
                </span>
                <span className="mt-1 block text-small text-neutral-600">
                  Use subtle vibration for correct answers and milestones.
                </span>
              </span>
            </div>
          ) : (
            <div className="rounded-lg bg-neutral-100 p-4 text-small text-neutral-600">
              Haptic feedback is not supported by this browser.
            </div>
          )}
        </Card>
      </section>

      <section aria-label="Offline downloads">
        <SectionHeader
          description="Manage courses saved to this browser."
          title="Offline downloads"
        />
        <OfflineStorageManager />
      </section>

      <footer
        aria-label={`About ${appConfig.app.name}`}
        className="flex items-center justify-center gap-3 border-t border-neutral-200 pt-6 text-small text-neutral-600"
      >
        <img
          alt="Autovrse logo"
          className="size-8 rounded-sm"
          height="32"
          src="/brand/autovrse-logo.svg"
          width="32"
        />
        <span>{appConfig.app.name}</span>
      </footer>
    </div>
  )
}
