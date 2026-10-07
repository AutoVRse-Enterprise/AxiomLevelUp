import type { ContentBundleInput } from '@/content/loader'
import { makeGameContentBundle } from '@/test/gameFixtures'

type MutableDocument = Record<string, unknown>

function clone(): ContentBundleInput {
  return structuredClone(makeGameContentBundle())
}

export function invalidMechanicPrimitiveFixture() {
  const input = clone()
  const round = input.roundFiles[0]!.data as MutableDocument
  ;(round.primitive as MutableDocument).type = 'true_false'
  return input
}

export function invalidAnswerTemplateFixture() {
  const input = clone()
  const round = input.roundFiles[0]!.data as MutableDocument
  ;(round.feedback as MutableDocument).answerTemplate = 'The configured answer is shown.'
  return input
}

export function unknownRoundFixture() {
  const input = clone()
  const game = input.gameFiles[0]!.data as MutableDocument
  const slot = (game.slots as MutableDocument[])[0]!
  slot.pool = ['unknown-round']
  return input
}

export function leakedAnswerFixture() {
  const input = clone()
  const round = input.roundFiles[0]!.data as MutableDocument
  round.intro = 'The answer is Obstructive pattern.'
  return input
}
