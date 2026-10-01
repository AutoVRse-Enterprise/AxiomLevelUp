import { ArrowRight, Award, BookOpen, Flame, Target, Trophy } from 'lucide-react'
import { Link } from 'react-router'

import { useContent } from '@/app/contentContext'
import {
  BadgeTile,
  MasteryBar,
  SectionHeader,
  StatTile,
  WeeklyActivityStrip,
} from '@/components/learning'
import { getBadgeIcon } from '@/components/learning/badgeIconRegistry'
import { Card, Chip, ProgressBar } from '@/components/ui'
import { useAssetUrl } from '@/content/useAssetUrl'
import { now, today } from '@/lib/clock'
import { useLearnerStore } from '@/state/learnerStore'
import {
  selectBadgeViews,
  selectContinueLearning,
  selectGreetingPeriod,
  selectLeaderboardView,
  selectLevelProgress,
  selectPathwayView,
  selectRevisionRecommendations,
  selectWeeklyActivity,
} from '@/state/selectors'

export function HomePage() {
  const { appConfig, courses, lessonById, courseById } = useContent()
  const learner = useLearnerStore((state) => state.learner)
  const xp = useLearnerStore((state) => state.xp)
  const streak = useLearnerStore((state) => state.streak)
  const weeklyGoal = useLearnerStore((state) => state.weeklyGoal)
  const lessonProgress = useLearnerStore((state) => state.lessonProgress)
  const challenges = useLearnerStore((state) => state.challenges)
  const badges = useLearnerStore((state) => state.badges)
  const mastery = useLearnerStore((state) => state.mastery)
  const stats = useLearnerStore((state) => state.stats)
  const summary = selectContinueLearning({ lessonProgress }, courses, lessonById, courseById)
  const imageUrl = useAssetUrl(summary?.course.imageAssetId)
  const dailyChallenge = appConfig.challenges.find(({ type }) => type === 'daily')
  const dailyProgress = dailyChallenge ? challenges[dailyChallenge.id] : undefined
  const revisions = selectRevisionRecommendations(
    { mastery, lessonProgress },
    appConfig.concepts,
    courses,
    appConfig.product.revision.masteryThreshold,
    appConfig.product.revision.maxRecommendations,
  )
  const activePathway = appConfig.pathways.find(({ active }) => active)
  const pathway = activePathway
    ? selectPathwayView(
        { learner, xp, weeklyGoal, lessonProgress, challenges, badges, mastery, stats },
        activePathway,
        lessonById,
        appConfig.challenges,
      )
    : null
  const recentBadges = selectBadgeViews({ badges }, appConfig.badges)
    .filter(({ unlocked }) => unlocked)
    .slice(0, appConfig.product.home.recentAchievementCount)
  const leaderboard = selectLeaderboardView(
    { learner, xp },
    appConfig.leaderboard.entries,
    appConfig.product.leaderboard.visibleWindow,
  )
  const activity = selectWeeklyActivity(
    { weeklyGoal },
    appConfig.product.weekStartsOn,
    today(),
  )
  const level = selectLevelProgress({ xp }, appConfig.gamification.levels)
  const firstName = learner.name.split(/\s+/)[0] ?? learner.name
  const ctaClass =
    'inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-brand-700 px-4 font-semibold text-white transition-colors hover:bg-brand-800 focus-visible:outline-2'

  return (
    <div className="space-y-8">
      <section
        className="overflow-hidden rounded-xl bg-gradient-to-br from-brand-900 to-brand-700 p-6 text-white shadow-card sm:p-8"
        aria-labelledby="learner-status-heading"
      >
        <p className="text-small font-semibold text-brand-100">
          Good {selectGreetingPeriod(now())}, {firstName}
        </p>
        <h1 id="learner-status-heading" className="mt-2 text-display font-bold">
          Ready for your next discovery?
        </h1>
        <p className="mt-3 text-brand-100">
          Level {level.level}{level.label ? ` · ${level.label}` : ''} · {xp.total.toLocaleString()} XP
        </p>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:max-w-lg">
          <StatTile
            icon={<Flame aria-hidden="true" size={17} />}
            label="Daily streak"
            value={`${streak.currentDays} days`}
          />
          <StatTile
            icon={<Target aria-hidden="true" size={17} />}
            label="Weekly goal"
            value={`${activity.completedCount} / ${activity.targetDays}`}
          />
        </div>
      </section>

      <section aria-labelledby="continue-heading">
        <SectionHeader title="Continue learning" />
        {summary?.nextLesson ? (
          <Card className="mt-4 overflow-hidden p-0 sm:p-0">
            <div className="grid md:grid-cols-[14rem_1fr]">
              {imageUrl ? <img alt="" className="h-full min-h-44 w-full object-cover" src={imageUrl} /> : null}
              <div className="p-5 sm:p-6">
                <Chip tone="brand">{summary.course.category}</Chip>
                <h2 id="continue-heading" className="mt-3 text-title font-bold">{summary.course.title}</h2>
                <p className="mt-2 text-neutral-600">Current lesson: {summary.nextLesson.title}</p>
                <ProgressBar className="mt-5" label="Course progress" value={summary.completion} />
                <div className="mt-5 flex flex-wrap items-center gap-4">
                  <Link
                    className={ctaClass}
                    to={`/learn/courses/${summary.course.id}/lessons/${summary.nextLesson.id}`}
                  >
                    <BookOpen aria-hidden="true" size={18} /> Continue lesson
                  </Link>
                  <span className="text-small text-neutral-600">{summary.remainingMinutes} min remaining</span>
                </div>
              </div>
            </div>
          </Card>
        ) : (
          <Card className="mt-4">
            <h2 id="continue-heading" className="font-bold">You are all caught up</h2>
            <p className="mt-1 text-neutral-600">Explore the catalog to find your next course.</p>
            <Link className="mt-4 inline-flex font-semibold text-brand-700" to="/learn">Browse learning</Link>
          </Card>
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section aria-labelledby="daily-challenge-heading">
          <SectionHeader title="Today's challenge" />
          <Card className="mt-4 h-[calc(100%-2rem)]">
            {dailyChallenge ? (
              <>
                <Target aria-hidden="true" className="text-brand-700" size={28} />
                <h2 id="daily-challenge-heading" className="mt-3 text-heading font-bold">{dailyChallenge.title}</h2>
                <p className="mt-2 text-neutral-600">{dailyChallenge.description}</p>
                <p className="mt-4 text-small font-medium text-neutral-600">
                  {dailyChallenge.itemCount} questions · ~{dailyChallenge.estimatedMinutes} min · +{dailyChallenge.rewardXp} XP
                </p>
                <Link className={`${ctaClass} mt-5`} to={`/challenge/${dailyChallenge.id}/play`}>
                  {dailyProgress?.completed ? 'Review challenge' : 'Start challenge'} <ArrowRight aria-hidden="true" size={17} />
                </Link>
              </>
            ) : <p className="text-neutral-600">No daily challenge is configured.</p>}
          </Card>
        </section>

        <section aria-labelledby="revision-heading">
          <SectionHeader title="Strengthen your knowledge" />
          <Card className="mt-4 h-[calc(100%-2rem)]">
            {revisions.length ? (
              <div className="space-y-5">
                {revisions.map(({ concept, score, course, lesson }) => (
                  <div key={concept.id}>
                    <MasteryBar label={concept.title} value={score} />
                    {course && lesson ? (
                      <Link className="mt-2 inline-flex text-small font-semibold text-brand-700" to={`/learn/courses/${course.id}/lessons/${lesson.id}`}>
                        Practice this topic
                      </Link>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : (
              <>
                <h2 id="revision-heading" className="font-bold">Strong across every topic</h2>
                <p className="mt-1 text-neutral-600">No concepts currently need revision.</p>
              </>
            )}
          </Card>
        </section>
      </div>

      {activePathway && pathway ? (
        <section aria-labelledby="pathway-preview-heading">
          <SectionHeader
            action={<Link className="text-small font-semibold text-brand-700" to={`/learn/pathways/${activePathway.id}`}>View pathway</Link>}
            description={activePathway.description}
            title="Active pathway"
          />
          <Card className="mt-4">
            <h2 id="pathway-preview-heading" className="text-heading font-bold">{activePathway.title}</h2>
            <p className="mt-2 text-neutral-600">
              {pathway.currentNode ? `Next: ${pathway.currentNode.title}` : 'Pathway complete'}
            </p>
            <ProgressBar
              className="mt-4"
              label="Pathway progress"
              max={pathway.nodes.length}
              value={pathway.nodes.filter(({ status }) => status === 'completed').length}
            />
          </Card>
        </section>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <section aria-labelledby="achievements-heading">
          <SectionHeader title="Recent achievements" />
          {recentBadges.length ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {recentBadges.map((badge) => (
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
          ) : (
            <Card className="mt-4">
              <Award aria-hidden="true" className="text-neutral-400" size={28} />
              <h2 id="achievements-heading" className="mt-3 font-bold">Your first achievement awaits</h2>
              <p className="mt-1 text-neutral-600">Complete lessons to start your badge collection.</p>
            </Card>
          )}
        </section>

        <section aria-labelledby="leaderboard-teaser-heading">
          <SectionHeader title="Cohort standing" />
          <Card className="mt-4">
            <Trophy aria-hidden="true" className="text-star" size={28} />
            <h2 id="leaderboard-teaser-heading" className="mt-3 text-title font-bold">
              {leaderboard.rank ? `You're #${leaderboard.rank} this week` : 'Join the weekly cohort'}
            </h2>
            <p className="mt-2 text-neutral-600">
              {leaderboard.rank
                ? leaderboard.movement > 0
                  ? `Up ${leaderboard.movement} positions`
                  : leaderboard.movement < 0
                    ? `Down ${Math.abs(leaderboard.movement)} positions`
                    : 'Holding your position'
                : 'Earn weekly XP to enter the ranking.'}
            </p>
            <Link className="mt-4 inline-flex font-semibold text-brand-700" to="/leaderboard">View leaderboard</Link>
          </Card>
        </section>
      </div>

      <section aria-labelledby="weekly-progress-heading">
        <SectionHeader title="Weekly progress" />
        <Card className="mt-4">
          <h2 id="weekly-progress-heading" className="sr-only">Activity this week</h2>
          <WeeklyActivityStrip {...activity} />
        </Card>
      </section>
    </div>
  )
}
