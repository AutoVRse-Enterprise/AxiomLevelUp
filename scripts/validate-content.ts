import { readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  ContentValidationError,
  validateContentBundle,
  type ContentBundleInput,
} from '../src/content/loader.ts'
import { contentManifestSchema } from '../src/content/schema/index.ts'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const contentRoot = resolve(root, 'public/content')

async function readJson(relativePath: string) {
  return JSON.parse(await readFile(resolve(contentRoot, relativePath), 'utf8')) as unknown
}

async function main() {
  const manifestFile = 'manifest.json'
  const manifest = await readJson(manifestFile)
  const manifestResult = contentManifestSchema.safeParse(manifest)
  if (!manifestResult.success) {
    throw new ContentValidationError(
      manifestResult.error.issues.map((issue) => ({
        file: manifestFile,
        path: issue.path.map(String).join('.') || '$',
        message: issue.message,
        severity: 'error',
      })),
    )
  }

  const parsed = manifestResult.data
  const input: ContentBundleInput = {
    manifestFile,
    manifest,
    appConfigFile: parsed.appConfig,
    appConfig: await readJson(parsed.appConfig),
    courseFiles: await Promise.all(
      parsed.courses.map(async (file) => ({ file, data: await readJson(file) })),
    ),
    seedFile: parsed.seeds[parsed.defaultSeed],
    seed: await readJson(parsed.seeds[parsed.defaultSeed]),
    assetManifestFile: parsed.assetManifest,
    assetManifest: await readJson(parsed.assetManifest),
  }

  const registry = validateContentBundle(input)
  console.log(
    `Validated ${registry.courses.length} courses, ${registry.lessonById.size} lessons and ${registry.warnings.length} warnings.`,
  )
  for (const warning of registry.warnings) {
    console.warn(`WARN ${warning.file}:${warning.path} ${warning.message}`)
  }
}

main().catch((error: unknown) => {
  if (error instanceof ContentValidationError) {
    for (const issue of error.issues) {
      console.error(`ERROR ${issue.file}:${issue.path} ${issue.message}`)
    }
  } else {
    console.error(error)
  }
  process.exitCode = 1
})
