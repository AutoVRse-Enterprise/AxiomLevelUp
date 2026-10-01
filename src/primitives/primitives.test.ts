import { createElement } from 'react'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { primitiveTypes } from '@/content/primitiveTypes'
import { primitiveBaseSchema } from '@/content/schema'
import { primitiveContentSchemas, richTextPrimitiveSchema } from '@/content/schema/primitives'
import { primitiveComponents } from '@/primitives/componentRegistry'
import { primitiveDefinitions } from '@/primitives/definitions'
import { PrimitiveRenderer } from '@/primitives/registry'

const definitionSources = import.meta.glob('./definitions/*.ts', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

describe('primitive architecture', () => {
  it('keeps definitions, schemas and lazy components in parity', () => {
    const definitionTypes = Object.keys(primitiveDefinitions).sort()
    const schemaTypes = Object.keys(primitiveContentSchemas).sort()
    const componentTypes = Object.keys(primitiveComponents).sort()
    const canonicalTypes = new Set<string>(primitiveTypes)

    expect(definitionTypes).toEqual(schemaTypes)
    expect(definitionTypes).toEqual(componentTypes)
    expect(definitionTypes.every((type) => canonicalTypes.has(type))).toBe(true)
  })

  it('keeps definition modules free of React imports', () => {
    expect(Object.keys(definitionSources).length).toBeGreaterThan(0)
    for (const source of Object.values(definitionSources)) {
      expect(source).not.toMatch(/(?:from|import)\s*['"]react(?:\/[^'"]*)?['"]/)
    }
  })

  it('reports typed content asset references', () => {
    const primitive = richTextPrimitiveSchema.parse({
      id: 'reading',
      type: 'rich_text',
      content: {
        body: 'Review the image.',
        imageAssetId: 'figure-one',
      },
    })

    expect(primitiveContentSchemas.rich_text.assetRefs(primitive)).toEqual([
      { assetId: 'figure-one', type: 'image' },
    ])
  })

  it('falls back when a registered primitive fails its strict schema', () => {
    const primitive = primitiveBaseSchema.parse({
      id: 'invalid-reading',
      type: 'rich_text',
      content: {},
    })

    render(
      createElement(PrimitiveRenderer, {
        primitive,
        attempt: 0,
        onInteract: vi.fn(),
        onSubmit: vi.fn(),
        onComplete: vi.fn(),
      }),
    )

    expect(screen.getByText('This activity type is not supported')).toBeVisible()
  })
})
