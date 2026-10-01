import { BookOpenCheck, CircleHelp, Flame, RadioTower, Trophy } from 'lucide-react'

import { useContent } from '@/app/contentContext'
import {
  Avatar,
  BadgeTile,
  MasteryBar,
  SectionHeader,
  StatTile,
  WeeklyActivityStrip,
} from '@/components/learning'
import { getBadgeIcon } from '@/components/learning/badgeIconRegistry'
import { Card, ProgressBar } from '@/components/ui'
import { today } from '@/lib/clock'
import { useLearnerStore } from '@/state/learnerStore'
import {
  selectBadgeViews,
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
  const { appConfig } = useContent()
  const learner = useLearnerStore((state) => state.learner)
  const xp = useLearnerStore((state) => state.xp)
  const streak = useLearnerStore((state) => state.streak)
  const weeklyGoal = useLearnerStore((state) => state.weeklyGoal)
  const stats = useLearnerStore((state) => state.stats)
  const mastery = useLearnerStore((state) => state.mastery)
  const badges = useLearnerStore((state) => state.badges)
  const level = selectLevelProgress({ xp }, appConfig.gamification.levels)
  const profileStats = selectProfileStats({ stats })
  const badgeViews = selectBadgeViews({ badges }, appConfig.badges)
  const activity = selectWeeklyActivity(
    { weeklyGoal },
    appConfig.product.weekStartsOn,
    today(),
  )
  const masteryViews = appConfig.concepts
    .map((concept) => ({ ...concept, score: mastery[concept.id]?.score ?? 0 }))
    .sort((a, b) => b.score - a.score)

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
            <p className="text-caption font-semibold uppercase tracking-wide text-brand-200">Current level</p>
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
            <Flame aria-hidden="true" size={19} /> {streak.currentDays} day streak
          </p>
        </div>
      </Card>

      <section aria-label="Learner statistics">
        <SectionHeader title="Your stats" />
        <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-5">
          <StatTile icon={<Trophy aria-hidden="true" size={17} />} label="Courses" value={profileStats.coursesCompleted} />
          <StatTile icon={<BookOpenCheck aria-hidden="true" size={17} />} label="Lessons" value={profileStats.lessonsCompleted} />
          <StatTile icon={<RadioTower aria-hidden="true" size={17} />} label="Challenges" value={profileStats.challengesCompleted} />
          <StatTile icon={<CircleHelp aria-hidden="true" size={17} />} label="Questions" value={profileStats.questionsAnswered} />
          <StatTile label="Accuracy" value={`${profileStats.accuracy}%`} />
        </div>
      </section>

      <section aria-label="Concept mastery">
        <SectionHeader
          description="Mastery reflects demonstrated understanding, separately from XP."
          title="Mastery"
        />
        <Card className="mt-4 grid gap-5 md:grid-cols-2">
          {masteryViews.map((concept) => (
            <MasteryBar key={concept.id} label={concept.title} value={concept.score} />
          ))}
        </Card>
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
                      description={badge.description}
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
        <Card className="mt-4">
          <WeeklyActivityStrip {...activity} />
        </Card>
      </section>
    </div>
  )
}
