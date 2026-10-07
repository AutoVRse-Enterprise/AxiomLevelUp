import { contentRuleForMechanic, mechanicContentProblems } from './gameMechanics'
import type { AnatomyMap, GameConfig, GameDocument, Primitive, RoundDocument } from './schema'
import type { ContentIssue } from './errors'

interface GameValidationInput {
  rounds: readonly RoundDocument[]
  games: readonly GameDocument[]
  anatomyMaps: readonly AnatomyMap[]
  config: GameConfig | undefined
  roundFiles: readonly { file: string }[]
  gameFiles: readonly { file: string }[]
  appConfigFile: string
  issues: ContentIssue[]
  warnings: ContentIssue[]
  validatePrimitive: (primitive: Primitive, file: string, path: string) => void
}

function issue(
  collection: ContentIssue[],
  file: string,
  path: string,
  message: string,
  severity: ContentIssue['severity'] = 'error',
) {
  collection.push({ file, path, message, severity })
}

function duplicateIndexes(values: readonly string[]) {
  const seen = new Set<string>()
  return values.flatMap((value, index) => {
    if (seen.has(value)) return [index]
    seen.add(value)
    return []
  })
}

function correctAnswerLabel(primitive: Primitive): string | null {
  const content = primitive.content as {
    correctOptionId?: unknown
    options?: unknown
  }
  if (typeof content.correctOptionId !== 'string' || !Array.isArray(content.options)) return null
  const option = content.options.find(
    (candidate) =>
      candidate &&
      typeof candidate === 'object' &&
      'id' in candidate &&
      candidate.id === content.correctOptionId,
  )
  return option &&
    typeof option === 'object' &&
    'label' in option &&
    typeof option.label === 'string'
    ? option.label
    : null
}

function visibleText(value: unknown): string {
  if (typeof value === 'string') return value
  if (typeof value === 'number') return String(value)
  if (Array.isArray(value)) return value.map(visibleText).join(' ')
  if (value && typeof value === 'object') return Object.values(value).map(visibleText).join(' ')
  return ''
}

function validateRound(
  round: RoundDocument,
  roundIndex: number,
  input: GameValidationInput,
  difficultyIds: ReadonlySet<string>,
) {
  const file = input.roundFiles[roundIndex]?.file ?? `round:${round.id}`
  mechanicContentProblems(round).forEach((message) =>
    issue(input.issues, file, 'mechanic', message),
  )
  input.validatePrimitive(round.primitive, file, 'primitive')
  if (round.explore) input.validatePrimitive(round.explore, file, 'explore')
  Object.entries(round.primitiveByOptionSet).forEach(([optionSet, primitive]) => {
    input.validatePrimitive(primitive, file, `primitiveByOptionSet.${optionSet}`)
    if (primitive.id !== round.primitive.id || primitive.type !== round.primitive.type) {
      issue(
        input.issues,
        file,
        `primitiveByOptionSet.${optionSet}`,
        'Option-set primitives must keep the base primitive id and type.',
      )
    }
  })
  duplicateIndexes(round.clues.map(({ id }) => id)).forEach((index) =>
    issue(input.issues, file, `clues.${index}.id`, 'Round clue IDs must be unique.'),
  )
  round.clues.forEach((clue, clueIndex) =>
    input.validatePrimitive(clue.primitive, file, `clues.${clueIndex}.primitive`),
  )
  if (!round.feedback.answerTemplate.includes('{answer}')) {
    issue(
      input.issues,
      file,
      'feedback.answerTemplate',
      'The answer template must contain the {answer} placeholder.',
    )
  }
  Object.keys(round.difficulty).forEach((difficulty) => {
    if (!difficultyIds.has(difficulty)) {
      issue(
        input.issues,
        file,
        `difficulty.${difficulty}`,
        `Unknown game difficulty "${difficulty}".`,
      )
    }
  })

  const map = round.anatomyMapId
    ? input.anatomyMaps.find(({ id }) => id === round.anatomyMapId)
    : undefined
  if (round.anatomyMapId && !map) {
    issue(input.issues, file, 'anatomyMapId', `Unknown anatomy map "${round.anatomyMapId}".`)
  }
  if (round.drop && map) {
    const waypointById = new Map(map.waypoints.map((waypoint) => [waypoint.id, waypoint]))
    const levels = Array.isArray(round.primitive.content.levels)
      ? (round.primitive.content.levels as Array<{ levelId?: unknown }>)
      : []
    Object.entries(round.drop.pools).forEach(([difficulty, waypointIds]) => {
      if (!difficultyIds.has(difficulty)) {
        issue(
          input.issues,
          file,
          `drop.pools.${difficulty}`,
          `Unknown game difficulty "${difficulty}".`,
        )
      }
      waypointIds.forEach((waypointId, waypointIndex) => {
        const waypoint = waypointById.get(waypointId)
        if (!waypoint) {
          issue(
            input.issues,
            file,
            `drop.pools.${difficulty}.${waypointIndex}`,
            `Unknown anatomy waypoint "${waypointId}".`,
          )
          return
        }
        levels.forEach(({ levelId }, levelIndex) => {
          if (typeof levelId === 'string' && !waypoint.answerIds?.[levelId]) {
            issue(
              input.issues,
              file,
              `drop.pools.${difficulty}.${waypointIndex}`,
              `Waypoint "${waypointId}" has no answerIds value for level "${levelId}" (primitive level ${levelIndex}).`,
            )
          }
        })
      })
    })
  }

  const label = correctAnswerLabel(round.primitive)?.trim().toLocaleLowerCase()
  if (label) {
    const prompt =
      typeof round.primitive.content.prompt === 'string'
        ? round.primitive.content.prompt.toLocaleLowerCase()
        : ''
    if (round.intro.toLocaleLowerCase().includes(label) || prompt.includes(label)) {
      issue(
        input.issues,
        file,
        'primitive.content',
        `The correct answer label "${label}" is leaked.`,
      )
    }
    input.config?.difficulties.forEach((difficulty) => {
      const freeCount = round.difficulty[difficulty.id]?.freeClues ?? difficulty.freeClues
      round.clues.slice(0, freeCount).forEach((clue, clueIndex) => {
        if (visibleText(clue.primitive.content).toLocaleLowerCase().includes(label)) {
          issue(
            input.issues,
            file,
            `clues.${clueIndex}.primitive.content`,
            `Free clue content leaks the correct answer label "${label}".`,
          )
        }
      })
    })
  }

  const rule = contentRuleForMechanic(round.mechanic)
  if (rule.cluePolicy === 'required') {
    input.config?.difficulties.forEach((difficulty) => {
      const freeCount = round.difficulty[difficulty.id]?.freeClues ?? difficulty.freeClues
      if (freeCount > round.clues.length) {
        issue(
          input.warnings,
          file,
          `difficulty.${difficulty.id}.freeClues`,
          `Difficulty "${difficulty.id}" opens all ${round.clues.length} clues because it requests ${freeCount}.`,
          'warning',
        )
      }
    })
  }
}

export function validateGameContent(input: GameValidationInput): void {
  const difficultyIds = new Set(input.config?.difficulties.map(({ id }) => id) ?? [])
  input.rounds.forEach((round, index) => validateRound(round, index, input, difficultyIds))
  const roundById = new Map(input.rounds.map((round) => [round.id, round]))

  input.games.forEach((game, gameIndex) => {
    const file = input.gameFiles[gameIndex]?.file ?? `game:${game.id}`
    duplicateIndexes(game.slots.map(({ id }) => id)).forEach((index) =>
      issue(input.issues, file, `slots.${index}.id`, 'Game slot IDs must be unique.'),
    )
    duplicateIndexes(game.difficulties).forEach((index) =>
      issue(input.issues, file, `difficulties.${index}`, 'Game difficulties must be unique.'),
    )
    game.difficulties.forEach((difficulty, index) => {
      if (!difficultyIds.has(difficulty)) {
        issue(
          input.issues,
          file,
          `difficulties.${index}`,
          `Unknown game difficulty "${difficulty}".`,
        )
      }
    })
    game.slots.forEach((slot, slotIndex) => {
      duplicateIndexes(slot.pool).forEach((index) =>
        issue(
          input.issues,
          file,
          `slots.${slotIndex}.pool.${index}`,
          'Round pool IDs must be unique.',
        ),
      )
      if (slot.pick > slot.pool.length) {
        issue(
          input.issues,
          file,
          `slots.${slotIndex}.pick`,
          'Slot pick count cannot exceed its round pool.',
        )
      }
      slot.pool.forEach((roundId, roundIndex) => {
        if (!roundById.has(roundId)) {
          issue(
            input.issues,
            file,
            `slots.${slotIndex}.pool.${roundIndex}`,
            `Unknown round "${roundId}".`,
          )
        }
      })
    })

    const config = input.config
    const timing = config?.timing
    if (!config || !timing) return
    game.difficulties.forEach((difficultyId) => {
      const difficulty = config.difficulties.find(({ id }) => id === difficultyId)
      if (!difficulty) return
      const playSeconds = game.slots.reduce((total, slot) => {
        const limits = slot.pool.flatMap((roundId) => {
          const round = roundById.get(roundId)
          if (!round) return []
          return [
            round.difficulty[difficultyId]?.timeLimitSeconds ??
              Math.round(round.timeLimitSeconds * difficulty.timeMultiplier),
          ]
        })
        return total + (limits.length ? Math.max(...limits) * slot.pick : 0)
      }, 0)
      const roundCount = game.slots.reduce((total, slot) => total + slot.pick, 0)
      const totalSeconds = playSeconds + roundCount * timing.revealAllowanceSeconds
      const window = game.durationWindowSeconds ?? timing.defaultWindowSeconds
      if (totalSeconds < window.min || totalSeconds > window.max) {
        issue(
          input.warnings,
          file,
          'estimatedSeconds',
          `Difficulty "${difficultyId}" plans ${totalSeconds}s outside the ${window.min}-${window.max}s window.`,
          'warning',
        )
      }
    })
  })

  input.config?.messages.forEach((rule, index) => {
    if (rule.when.difficulty && !difficultyIds.has(rule.when.difficulty)) {
      issue(
        input.issues,
        input.appConfigFile,
        `games.messages.${index}.when.difficulty`,
        `Unknown game difficulty "${rule.when.difficulty}".`,
      )
    }
    if (
      rule.when.minCorrectRatio !== undefined &&
      rule.when.maxCorrectRatio !== undefined &&
      rule.when.minCorrectRatio > rule.when.maxCorrectRatio
    ) {
      issue(
        input.issues,
        input.appConfigFile,
        `games.messages.${index}.when`,
        'Minimum correct ratio cannot exceed maximum correct ratio.',
      )
    }
  })
}
