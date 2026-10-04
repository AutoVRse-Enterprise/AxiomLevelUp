import { TextDecoder } from 'node:util'
import { SaxesParser } from 'saxes'

const SVG_NAMESPACE = 'http://www.w3.org/2000/svg'

export type SvgValidationResult =
  { valid: true } | { valid: false; kind: 'utf8' | 'xml'; message: string }

export function validateSvgBytes(bytes: Uint8Array): SvgValidationResult {
  let source: string
  try {
    source = new TextDecoder('utf-8', { fatal: true }).decode(bytes)
  } catch {
    return {
      valid: false,
      kind: 'utf8',
      message: 'SVG is not valid UTF-8; re-encode the file as UTF-8.',
    }
  }

  let rootSeen = false
  try {
    const parser = new SaxesParser({ xmlns: true, fileName: 'SVG' })
    parser.on('opentag', (tag) => {
      if (rootSeen) return
      rootSeen = true
      if (tag.local !== 'svg' || tag.uri !== SVG_NAMESPACE) {
        throw new Error(`root element must be <svg xmlns="${SVG_NAMESPACE}">`)
      }
    })
    parser.write(source).close()
  } catch (error) {
    return {
      valid: false,
      kind: 'xml',
      message: `SVG XML is malformed: ${
        error instanceof Error ? error.message : 'unknown XML parsing error'
      }`,
    }
  }

  if (!rootSeen) {
    return {
      valid: false,
      kind: 'xml',
      message: 'SVG XML is malformed: document has no root <svg> element.',
    }
  }

  return { valid: true }
}
