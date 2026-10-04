import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

import { validateSvgBytes } from './validate-svg'

const encode = (source: string) => new TextEncoder().encode(source)

describe('SVG asset validation', () => {
  it.each(['windowing-diagram.svg', 'thorax-diagram.svg'])(
    'accepts repaired asset %s',
    async (fileName) => {
      const bytes = await readFile(resolve('public/assets/images', fileName))

      expect(validateSvgBytes(bytes)).toEqual({ valid: true })
    },
  )

  it('accepts well-formed UTF-8 SVG including non-ASCII text', () => {
    expect(
      validateSvgBytes(
        encode(
          '<svg xmlns="http://www.w3.org/2000/svg"><text>Teaching diagram · safe</text></svg>',
        ),
      ),
    ).toEqual({ valid: true })
  })

  it('rejects bytes that are not valid UTF-8', () => {
    const prefix = encode('<svg xmlns="http://www.w3.org/2000/svg"><text>')
    const suffix = encode('</text></svg>')
    const bytes = new Uint8Array(prefix.byteLength + 1 + suffix.byteLength)
    bytes.set(prefix)
    bytes[prefix.byteLength] = 0xb7
    bytes.set(suffix, prefix.byteLength + 1)

    expect(validateSvgBytes(bytes)).toEqual({
      valid: false,
      kind: 'utf8',
      message: 'SVG is not valid UTF-8; re-encode the file as UTF-8.',
    })
  })

  it('rejects malformed SVG XML with parser context', () => {
    const result = validateSvgBytes(
      encode('<svg xmlns="http://www.w3.org/2000/svg"><text>Unclosed</svg>'),
    )

    expect(result).toEqual(
      expect.objectContaining({
        valid: false,
        kind: 'xml',
        message: expect.stringContaining('SVG XML is malformed:'),
      }),
    )
  })

  it('rejects well-formed XML that is not an SVG document', () => {
    expect(validateSvgBytes(encode('<document/>'))).toEqual({
      valid: false,
      kind: 'xml',
      message:
        'SVG XML is malformed: root element must be <svg xmlns="http://www.w3.org/2000/svg">',
    })
  })
})
