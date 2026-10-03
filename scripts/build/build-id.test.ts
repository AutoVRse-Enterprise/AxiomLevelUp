import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { afterEach, describe, expect, it } from 'vitest'

import { resolveBuildId } from './build-id'

const temporaryDirectories: string[] = []

function fixtureRoot() {
  const root = mkdtempSync(join(tmpdir(), 'axiom-build-id-'))
  temporaryDirectories.push(root)
  mkdirSync(join(root, 'src'), { recursive: true })
  mkdirSync(join(root, 'public', 'content'), { recursive: true })
  writeFileSync(join(root, 'src', 'main.ts'), 'export const value = 1\n')
  writeFileSync(join(root, 'public', 'content', 'manifest.json'), '{}\n')
  writeFileSync(join(root, 'package.json'), '{}\n')
  writeFileSync(join(root, 'package-lock.json'), '{}\n')
  writeFileSync(join(root, 'vite.config.ts'), 'export default {}\n')
  return root
}

afterEach(() => {
  temporaryDirectories.splice(0).forEach((directory) => rmSync(directory, { recursive: true }))
})

describe('build ID', () => {
  it('honors configured deployment metadata', () => {
    expect(resolveBuildId('unused', 'release-2026.10.03', '0.1.0')).toBe('release-2026.10.03')
  })

  it('is reproducible and changes with build inputs', () => {
    const root = fixtureRoot()
    const first = resolveBuildId(root, undefined, '0.1.0')
    expect(resolveBuildId(root, undefined, '0.1.0')).toBe(first)

    writeFileSync(join(root, 'src', 'main.ts'), 'export const value = 2\n')
    expect(resolveBuildId(root, undefined, '0.1.0')).not.toBe(first)
  })
})
