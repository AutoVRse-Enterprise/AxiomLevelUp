import { createHash } from 'node:crypto'
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { afterEach, describe, expect, it } from 'vitest'

import { updateAssetHashes } from './hash-assets'

const temporaryDirectories: string[] = []

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map((directory) => rm(directory, { recursive: true })),
  )
})

describe('asset hash updater', () => {
  it('hashes model files and keeps them online-only', async () => {
    const root = await mkdtemp(join(tmpdir(), 'axiom-model-hash-'))
    temporaryDirectories.push(root)
    const publicRoot = join(root, 'public')
    const contentDirectory = join(publicRoot, 'content')
    const modelDirectory = join(publicRoot, 'assets', 'models')
    await mkdir(contentDirectory, { recursive: true })
    await mkdir(modelDirectory, { recursive: true })

    const bytes = Buffer.from('fixture glb bytes')
    await writeFile(join(modelDirectory, 'fixture.glb'), bytes)
    const manifestPath = join(contentDirectory, 'assets.json')
    await writeFile(
      manifestPath,
      JSON.stringify({
        schemaVersion: '0.2',
        assets: [
          {
            assetId: 'fixture-model',
            path: '/assets/models/fixture.glb',
            type: 'model',
            offlineRequired: true,
            offlineAvailable: true,
            sizeBytes: 0,
            sha256: '0'.repeat(64),
          },
        ],
      }),
    )

    await updateAssetHashes(manifestPath, publicRoot)

    const updated = JSON.parse(await readFile(manifestPath, 'utf8')) as {
      assets: Array<{
        offlineRequired: boolean
        offlineAvailable: boolean
        sizeBytes: number
        sha256: string
      }>
    }
    expect(updated.assets[0]).toEqual(
      expect.objectContaining({
        offlineRequired: false,
        offlineAvailable: false,
        sizeBytes: bytes.byteLength,
        sha256: createHash('sha256').update(bytes).digest('hex'),
      }),
    )
  })
})
