import { z } from 'zod'

import { contentPrimitiveTypes } from '../primitiveTypes'
import { idSchema, primitiveBaseSchema } from './primitiveBase'

export const gameMechanicSchema = z.enum([
  'spatial_look',
  'spatial_explore',
  'spot_finding',
  'clinical_call',
])

const nonEmptyStringSchema = z.string().trim().min(1)
const versionSchema = nonEmptyStringSchema

export const gameClueSchema = z.strictObject({
  id: idSchema,
  title: nonEmptyStringSchema,
  category: idSchema.optional(),
  primitive: primitiveBaseSchema.extend({ type: z.enum(contentPrimitiveTypes) }),
})

export const roundDifficultyOverrideSchema = z.strictObject({
  timeLimitSeconds: z.number().int().positive().optional(),
  freeClues: z.number().int().nonnegative().optional(),
  maxMoves: z.number().int().positive().optional(),
  maxHopsFromEntry: z.number().int().positive().optional(),
  orientationLabels: z.enum(['patient', 'hidden']).optional(),
})

export const roundDocumentSchema = z.strictObject({
  schemaVersion: z.literal('0.1'),
  roundVersion: versionSchema,
  id: idSchema,
  title: nonEmptyStringSchema,
  mechanic: gameMechanicSchema,
  anatomyMapId: idSchema.optional(),
  intro: nonEmptyStringSchema,
  timeLimitSeconds: z.number().int().positive(),
  drop: z
    .strictObject({
      pools: z.record(idSchema, z.array(idSchema).min(1)),
    })
    .optional(),
  explore: primitiveBaseSchema.optional(),
  primitive: primitiveBaseSchema,
  primitiveByOptionSet: z.record(idSchema, primitiveBaseSchema).default({}),
  clues: z.array(gameClueSchema).default([]),
  feedback: z.strictObject({
    correct: nonEmptyStringSchema,
    incorrect: nonEmptyStringSchema,
    answerTemplate: nonEmptyStringSchema,
  }),
  difficulty: z.record(idSchema, roundDifficultyOverrideSchema).default({}),
})

export const gameSlotSchema = z.strictObject({
  id: idSchema,
  pool: z.array(idSchema).min(1),
  pick: z.number().int().positive().default(1),
})

export const gameDocumentSchema = z
  .strictObject({
    schemaVersion: z.literal('0.1'),
    gameVersion: versionSchema,
    id: idSchema,
    title: nonEmptyStringSchema,
    tagline: nonEmptyStringSchema,
    organSystem: idSchema,
    estimatedSeconds: z.number().int().positive(),
    slots: z.array(gameSlotSchema).min(1),
    difficulties: z.array(idSchema).min(1),
    defaultDifficulty: idSchema,
    durationWindowSeconds: z
      .strictObject({
        min: z.number().int().positive(),
        max: z.number().int().positive(),
      })
      .refine(({ min, max }) => min <= max, {
        path: ['max'],
        message: 'Maximum duration must be at least the minimum duration.',
      })
      .optional(),
  })
  .superRefine((game, context) => {
    if (!game.difficulties.includes(game.defaultDifficulty)) {
      context.addIssue({
        code: 'custom',
        path: ['defaultDifficulty'],
        message: 'Default difficulty must be listed in difficulties.',
      })
    }
  })

export const gameDifficultySchema = z.strictObject({
  id: idSchema,
  label: nonEmptyStringSchema,
  timeMultiplier: z.number().positive(),
  maxMoves: z.number().int().positive(),
  freeClues: z.number().int().nonnegative(),
  clueCostPoints: z.number().int().nonnegative(),
  speedBonus: z.boolean(),
  optionSet: idSchema,
})

export const gameScoringSchema = z.strictObject({
  roundMaxPoints: z.number().int().positive(),
  speedBonuses: z.array(
    z.strictObject({
      maxFractionOfLimit: z.number().positive().max(1),
      points: z.number().int().nonnegative(),
      label: nonEmptyStringSchema,
    }),
  ),
  minAccuracyForSpeedBonus: z.number().min(0).max(1),
  correctThreshold: z.number().min(0).max(1),
  proximity: z.strictObject({
    exact: z.number().min(0).max(1),
    byCommonLevel: z.record(idSchema, z.number().min(0).max(1)),
    none: z.number().min(0).max(1),
  }),
})

export const gameMessageRuleSchema = z.strictObject({
  when: z.strictObject({
    minCorrectRatio: z.number().min(0).max(1).optional(),
    maxCorrectRatio: z.number().min(0).max(1).optional(),
    lastRoundCorrect: z.boolean().optional(),
    difficulty: idSchema.optional(),
  }),
  text: nonEmptyStringSchema,
})

export const gameConfigSchema = z.strictObject({
  hub: z.strictObject({
    title: nonEmptyStringSchema,
    tagline: nonEmptyStringSchema,
    startLabel: nonEmptyStringSchema,
    unavailableLabel: nonEmptyStringSchema,
  }),
  difficulties: z.array(gameDifficultySchema).default([]),
  scoring: gameScoringSchema.optional(),
  timing: z
    .strictObject({
      revealAllowanceSeconds: z.number().int().nonnegative(),
      defaultWindowSeconds: z
        .strictObject({
          min: z.number().int().positive(),
          max: z.number().int().positive(),
        })
        .refine(({ min, max }) => min <= max, {
          path: ['max'],
          message: 'Maximum duration must be at least the minimum duration.',
        }),
    })
    .optional(),
  messages: z.array(gameMessageRuleSchema).default([]),
  failurePolicy: z
    .strictObject({
      allowSkip: z.boolean(),
      pauseClockOnFailure: z.boolean(),
    })
    .default({ allowSkip: true, pauseClockOnFailure: true }),
  copy: z
    .strictObject({
      lockIn: nonEmptyStringSchema,
      nextRound: nonEmptyStringSchema,
      correct: nonEmptyStringSchema,
      incorrect: nonEmptyStringSchema,
      seeResult: nonEmptyStringSchema,
      skipToRound: nonEmptyStringSchema,
      loadingRound: nonEmptyStringSchema,
      retryRound: nonEmptyStringSchema,
      roundLoadError: nonEmptyStringSchema,
      roundLoadErrorMessage: nonEmptyStringSchema,
      continue: nonEmptyStringSchema,
      stepProgress: nonEmptyStringSchema,
      previousStep: nonEmptyStringSchema,
      nextStep: nonEmptyStringSchema,
      checkLocation: nonEmptyStringSchema,
      openAnswerDrawer: nonEmptyStringSchema,
      answerDrawerTitle: nonEmptyStringSchema,
      backToScene: nonEmptyStringSchema,
      backToAirway: nonEmptyStringSchema,
      pinGuessLabel: nonEmptyStringSchema,
      pinActualLabel: nonEmptyStringSchema,
      pinRevealPrompt: nonEmptyStringSchema,
      viewUnavailableTitle: nonEmptyStringSchema,
      viewUnavailableMessage: nonEmptyStringSchema,
      retryView: nonEmptyStringSchema,
      skipRound: nonEmptyStringSchema,
      skipped: nonEmptyStringSchema,
      skippedRoundMessage: nonEmptyStringSchema,
      movesLeft: nonEmptyStringSchema,
      spatialHint: nonEmptyStringSchema,
      revealClue: nonEmptyStringSchema,
      clueConfirmTitle: nonEmptyStringSchema,
      clueConfirmDescription: nonEmptyStringSchema,
      cancel: nonEmptyStringSchema,
      leaveGame: nonEmptyStringSchema,
      keepPlaying: nonEmptyStringSchema,
      leaveGameTitle: nonEmptyStringSchema,
      leaveGameDescription: nonEmptyStringSchema,
      continueGame: nonEmptyStringSchema,
      newGame: nonEmptyStringSchema,
      resumeTitle: nonEmptyStringSchema,
      resumeDescription: nonEmptyStringSchema,
      secondsRemaining: nonEmptyStringSchema,
      timeUp: nonEmptyStringSchema,
      basePoints: nonEmptyStringSchema,
      clueCost: nonEmptyStringSchema,
      totalScore: nonEmptyStringSchema,
      playAgain: nonEmptyStringSchema,
      correctCount: nonEmptyStringSchema,
      totalTime: nonEmptyStringSchema,
      bestRound: nonEmptyStringSchema,
      difficulty: nonEmptyStringSchema,
      resultNotFound: nonEmptyStringSchema,
      gameNotFound: nonEmptyStringSchema,
      exitGame: nonEmptyStringSchema,
      roundProgress: nonEmptyStringSchema,
      pointsAbbreviation: nonEmptyStringSchema,
      roundLabel: nonEmptyStringSchema,
      cluesLabel: nonEmptyStringSchema,
      gameUnavailableTitle: nonEmptyStringSchema,
      resultUnavailableTitle: nonEmptyStringSchema,
      loadingAudio: nonEmptyStringSchema,
      retryAudio: nonEmptyStringSchema,
      audioUnavailable: nonEmptyStringSchema,
      transcript: nonEmptyStringSchema,
      loadingImage: nonEmptyStringSchema,
      retryImage: nonEmptyStringSchema,
      imageUnavailable: nonEmptyStringSchema,
      expandImage: nonEmptyStringSchema,
      hideAnnotations: nonEmptyStringSchema,
      showAnnotations: nonEmptyStringSchema,
      expandTable: nonEmptyStringSchema,
      expandedDataTable: nonEmptyStringSchema,
      showDataTable: nonEmptyStringSchema,
      hideDataTable: nonEmptyStringSchema,
      keyTakeaway: nonEmptyStringSchema,
    })
    .optional(),
  player: z
    .strictObject({
      introAutoAdvanceMs: z.number().int().nonnegative().max(10_000),
      lockedHoldMs: z.number().int().nonnegative().max(3_000),
    })
    .default({ introAutoAdvanceMs: 1_200, lockedHoldMs: 200 }),
  formats: z
    .array(
      z.strictObject({
        id: idSchema,
        title: nonEmptyStringSchema,
        description: nonEmptyStringSchema,
        gameId: idSchema.optional(),
        status: z.enum(['playable', 'preview']),
      }),
    )
    .default([]),
  leaderboard: z
    .strictObject({
      entries: z
        .array(
          z.strictObject({
            id: idSchema,
            name: nonEmptyStringSchema,
            specialty: nonEmptyStringSchema.optional(),
            country: nonEmptyStringSchema.optional(),
            gameId: idSchema,
            difficulty: idSchema,
            period: z.enum(['today', 'week', 'all_time']),
            score: z.number().int().nonnegative(),
          }),
        )
        .default([]),
      disclosure: nonEmptyStringSchema,
    })
    .default({ entries: [], disclosure: 'Demo leaderboard' }),
  expertRuns: z
    .array(
      z.strictObject({
        id: idSchema,
        title: nonEmptyStringSchema,
        persona: z.strictObject({
          name: nonEmptyStringSchema,
          role: nonEmptyStringSchema,
          initials: nonEmptyStringSchema,
        }),
        gameId: idSchema,
        difficulty: idSchema,
        seed: z.number().int().nonnegative(),
        targetScore: z.number().int().nonnegative(),
      }),
    )
    .default([]),
  historyLimit: z.number().int().positive().default(20),
})

export type GameMechanic = z.infer<typeof gameMechanicSchema>
export type GameClue = z.infer<typeof gameClueSchema>
export type RoundDocument = z.infer<typeof roundDocumentSchema>
export type GameSlot = z.infer<typeof gameSlotSchema>
export type GameDocument = z.infer<typeof gameDocumentSchema>
export type GameDifficulty = z.infer<typeof gameDifficultySchema>
export type GameScoringConfig = z.infer<typeof gameScoringSchema>
export type GameMessageRule = z.infer<typeof gameMessageRuleSchema>
export type GameConfig = z.infer<typeof gameConfigSchema>
