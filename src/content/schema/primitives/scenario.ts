import { z } from 'zod'

import { clueIdsSchema, idSchema, primitiveBaseSchema } from '../primitiveBase'
import type { PrimitiveContentSchema } from './types'

const scenarioAssetSchema = z.strictObject({
  assetId: idSchema,
  alt: z.string().min(1),
  caption: z.string().min(1).optional(),
})

export const scenarioContextNodeSchema = z.strictObject({
  id: idSchema,
  type: z.literal('context'),
  body: z.string().min(1),
  asset: scenarioAssetSchema.optional(),
  next: idSchema,
})

export const scenarioChoiceSchema = z.strictObject({
  id: idSchema,
  label: z.string().min(1),
  consequence: z.string().min(1),
  next: idSchema,
  score: z.number().min(0).max(1).optional(),
  quality: z.string().min(1).optional(),
  clueIds: clueIdsSchema.optional(),
})

export const scenarioDecisionNodeSchema = z.strictObject({
  id: idSchema,
  type: z.literal('decision'),
  prompt: z.string().min(1),
  choices: z.array(scenarioChoiceSchema).min(2),
})

export const scenarioOutcomeNodeSchema = z.strictObject({
  id: idSchema,
  type: z.literal('outcome'),
  title: z.string().min(1),
  body: z.string().min(1),
  result: z.string().min(1),
})

export const scenarioNodeSchema = z.discriminatedUnion('type', [
  scenarioContextNodeSchema,
  scenarioDecisionNodeSchema,
  scenarioOutcomeNodeSchema,
])

export type ScenarioNode = z.infer<typeof scenarioNodeSchema>
export type ScenarioContextNode = z.infer<typeof scenarioContextNodeSchema>
export type ScenarioDecisionNode = z.infer<typeof scenarioDecisionNodeSchema>
export type ScenarioOutcomeNode = z.infer<typeof scenarioOutcomeNodeSchema>
export type ScenarioChoice = z.infer<typeof scenarioChoiceSchema>

export interface ScenarioGraphIssue {
  path: (string | number)[]
  message: string
}

export interface ScenarioGraphValidation {
  issues: ScenarioGraphIssue[]
  warnings: ScenarioGraphIssue[]
}

interface ScenarioGraph {
  startNodeId: string
  nodes: readonly ScenarioNode[]
}

function nextIds(node: ScenarioNode): string[] {
  if (node.type === 'context') return [node.next]
  if (node.type === 'decision') return node.choices.map(({ next }) => next)
  return []
}

export function validateScenarioGraph(graph: ScenarioGraph): ScenarioGraphValidation {
  const issues: ScenarioGraphIssue[] = []
  const warnings: ScenarioGraphIssue[] = []
  const nodeById = new Map<string, ScenarioNode>()

  graph.nodes.forEach((node, nodeIndex) => {
    if (nodeById.has(node.id)) {
      issues.push({
        path: ['nodes', nodeIndex, 'id'],
        message: `Scenario node ID "${node.id}" must be unique.`,
      })
    } else {
      nodeById.set(node.id, node)
    }

    if (node.type === 'decision') {
      const choiceIds = new Set<string>()
      node.choices.forEach((choice, choiceIndex) => {
        if (choiceIds.has(choice.id)) {
          issues.push({
            path: ['nodes', nodeIndex, 'choices', choiceIndex, 'id'],
            message: `Choice ID "${choice.id}" must be unique within decision "${node.id}".`,
          })
        }
        choiceIds.add(choice.id)
      })
    }
  })

  if (!nodeById.has(graph.startNodeId)) {
    issues.push({
      path: ['startNodeId'],
      message: `Scenario start node "${graph.startNodeId}" does not exist.`,
    })
  }

  graph.nodes.forEach((node, nodeIndex) => {
    if (node.type === 'context' && !nodeById.has(node.next)) {
      issues.push({
        path: ['nodes', nodeIndex, 'next'],
        message: `Scenario next node "${node.next}" does not exist.`,
      })
    }
    if (node.type === 'decision') {
      node.choices.forEach((choice, choiceIndex) => {
        if (!nodeById.has(choice.next)) {
          issues.push({
            path: ['nodes', nodeIndex, 'choices', choiceIndex, 'next'],
            message: `Scenario next node "${choice.next}" does not exist.`,
          })
        }
      })
    }
  })

  const visited = new Set<string>()
  const active = new Set<string>()
  let cyclic = false
  const visit = (nodeId: string) => {
    if (active.has(nodeId)) {
      cyclic = true
      return
    }
    if (visited.has(nodeId)) return
    const node = nodeById.get(nodeId)
    if (!node) return
    active.add(nodeId)
    nextIds(node).forEach(visit)
    active.delete(nodeId)
    visited.add(nodeId)
  }

  visit(graph.startNodeId)
  if (cyclic) {
    issues.push({
      path: ['nodes'],
      message: 'Scenario graph must be acyclic.',
    })
  }

  const outcomeMemo = new Map<string, boolean>()
  const allPathsEndAtOutcome = (nodeId: string, checking: Set<string>): boolean => {
    const memoized = outcomeMemo.get(nodeId)
    if (memoized !== undefined) return memoized
    if (checking.has(nodeId)) return false
    const node = nodeById.get(nodeId)
    if (!node) return false
    if (node.type === 'outcome') {
      outcomeMemo.set(nodeId, true)
      return true
    }
    const targets = nextIds(node)
    const nextChecking = new Set(checking).add(nodeId)
    const result =
      targets.length > 0 && targets.every((target) => allPathsEndAtOutcome(target, nextChecking))
    outcomeMemo.set(nodeId, result)
    return result
  }
  if (nodeById.has(graph.startNodeId) && !allPathsEndAtOutcome(graph.startNodeId, new Set())) {
    issues.push({
      path: ['nodes'],
      message: 'Every scenario path must end at an outcome.',
    })
  }

  graph.nodes.forEach((node, nodeIndex) => {
    if (!visited.has(node.id)) {
      issues.push({
        path: ['nodes', nodeIndex],
        message: `Scenario node "${node.id}" is unreachable from the start node.`,
      })
    }
  })

  if (!cyclic && nodeById.has(graph.startNodeId)) {
    const inspectPath = (nodeId: string, decisionCount: number, path: Set<string>) => {
      const node = nodeById.get(nodeId)
      if (!node || path.has(nodeId)) return
      const nextPath = new Set(path).add(nodeId)
      const nextDecisionCount = decisionCount + Number(node.type === 'decision')

      if (node.type === 'outcome') {
        if (nextDecisionCount < 2 || nextDecisionCount > 4) {
          warnings.push({
            path: ['nodes'],
            message: `Scenario path ending at "${node.id}" has ${nextDecisionCount} decision points; expected 2 to 4.`,
          })
        }
        return
      }

      const targets = nextIds(node).filter((target) => nodeById.has(target))
      if (targets.length === 0) {
        issues.push({
          path: ['nodes', graph.nodes.indexOf(node)],
          message: `Every scenario path must end at an outcome; "${node.id}" does not.`,
        })
        return
      }
      targets.forEach((target) => inspectPath(target, nextDecisionCount, nextPath))
    }

    inspectPath(graph.startNodeId, 0, new Set())
  }

  return { issues, warnings }
}

export const scenarioPrimitiveSchema = primitiveBaseSchema.extend({
  type: z.literal('scenario'),
  content: z
    .strictObject({
      startNodeId: idSchema,
      nodes: z.array(scenarioNodeSchema).min(1),
    })
    .superRefine((content, context) => {
      for (const issue of validateScenarioGraph(content).issues) {
        context.addIssue({
          code: 'custom',
          path: issue.path,
          message: issue.message,
        })
      }
    }),
})

export type ScenarioPrimitive = z.infer<typeof scenarioPrimitiveSchema>
export type ScenarioContent = ScenarioPrimitive['content']

export const scenarioContentSchema = {
  schema: scenarioPrimitiveSchema,
  assetRefs: (primitive) =>
    primitive.content.nodes.flatMap((node, nodeIndex) =>
      node.type === 'context' && node.asset
        ? [
            {
              assetId: node.asset.assetId,
              type: 'image' as const,
              path: `content.nodes.${nodeIndex}.asset.assetId`,
            },
          ]
        : [],
    ),
} satisfies PrimitiveContentSchema<ScenarioPrimitive>
