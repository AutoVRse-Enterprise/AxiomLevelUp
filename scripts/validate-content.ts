import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import katex from 'katex'
import 'katex/contrib/mhchem'

import {
  ContentValidationError,
  validateContentBundle,
  type ContentBundleInput,
} from '../src/content/loader.ts'
import { contentManifestSchema } from '../src/content/schema/index.ts'
import { formulaPrimitiveSchema } from '../src/content/schema/primitives/formula.ts'
import { experienceBuilds } from '../src/experiences/builds.ts'
import type { ExperienceBuildMetadata } from '../src/experiences/types.ts'
import { validateSvgBytes } from './assets/validate-svg.ts'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

async function validateExperience(build: ExperienceBuildMetadata) {
  const contentRoot = resolve(root, build.contentDir)
  const readJson = async (relativePath: string) =>
    JSON.parse(await readFile(resolve(contentRoot, relativePath), 'utf8')) as unknown
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
  const seedPath = parsed.seeds[parsed.defaultSeed]
  if (!seedPath) {
    throw new Error(`The default seed "${parsed.defaultSeed}" has no configured path.`)
  }
  const input: ContentBundleInput = {
    manifestFile,
    manifest,
    appConfigFile: parsed.appConfig,
    appConfig: await readJson(parsed.appConfig),
    courseFiles: await Promise.all(
      parsed.courses.map(async (file) => ({ file, data: await readJson(file) })),
    ),
    caseFiles: await Promise.all(
      parsed.cases.map(async (file) => ({ file, data: await readJson(file) })),
    ),
    anatomyMapFiles: await Promise.all(
      parsed.anatomyMaps.map(async (file) => ({ file, data: await readJson(file) })),
    ),
    roundFiles: await Promise.all(
      parsed.rounds.map(async (file) => ({ file, data: await readJson(file) })),
    ),
    gameFiles: await Promise.all(
      parsed.games.map(async (file) => ({ file, data: await readJson(file) })),
    ),
    seedFile: seedPath,
    seed: await readJson(seedPath),
    assetManifestFile: parsed.assetManifest,
    assetManifest: await readJson(parsed.assetManifest),
  }

  const registry = validateContentBundle(input)
  const assetIssues = await Promise.all(
    registry.assetManifest.assets.map(async (asset, assetIndex) => {
      const path =
        asset.type === 'dicom'
          ? resolve(root, 'public/assets/dicom', asset.path)
          : resolve(root, 'public', asset.path.replace(/^\/+/, ''))
      try {
        const bytes = await readFile(path)
        if (asset.type === 'dicom') {
          const hostedManifest = JSON.parse(bytes.toString('utf8')) as { totalBytes?: unknown }
          return hostedManifest.totalBytes === asset.sizeBytes
            ? []
            : [
                {
                  file: input.assetManifestFile,
                  path: `assets.${assetIndex}.sizeBytes`,
                  message: `DICOM asset "${asset.assetId}" size does not match the hosted manifest totalBytes.`,
                  severity: 'error' as const,
                },
              ]
        }

        const issues = []
        if (bytes.byteLength !== asset.sizeBytes) {
          issues.push({
            file: input.assetManifestFile,
            path: `assets.${assetIndex}.sizeBytes`,
            message: `Asset "${asset.assetId}" declares ${asset.sizeBytes} bytes but the file contains ${bytes.byteLength}.`,
            severity: 'error' as const,
          })
        }
        const sha256 = createHash('sha256').update(bytes).digest('hex')
        if (sha256 !== asset.sha256) {
          issues.push({
            file: input.assetManifestFile,
            path: `assets.${assetIndex}.sha256`,
            message: `Asset "${asset.assetId}" SHA-256 does not match its local file.`,
            severity: 'error' as const,
          })
        }
        if (
          asset.type === 'image' &&
          (asset.mimeType === 'image/svg+xml' || asset.path.toLowerCase().endsWith('.svg'))
        ) {
          const validation = validateSvgBytes(bytes)
          if (!validation.valid) {
            issues.push({
              file: input.assetManifestFile,
              path: `assets.${assetIndex}.path`,
              message: `Asset "${asset.assetId}" failed SVG validation: ${validation.message}`,
              severity: 'error' as const,
            })
          }
        }
        return issues
      } catch (error) {
        return [
          {
            file: input.assetManifestFile,
            path: `assets.${assetIndex}.path`,
            message: `Asset "${asset.assetId}" could not be read at ${path}: ${
              error instanceof Error ? error.message : 'unknown error'
            }`,
            severity: 'error' as const,
          },
        ]
      }
    }),
  )
  const flatAssetIssues = assetIssues.flat()
  if (flatAssetIssues.length > 0) throw new ContentValidationError(flatAssetIssues)
  const formulaIssues = registry.courses.flatMap((course) =>
    course.lessons.flatMap((lesson) =>
      lesson.primitives.flatMap((primitive, primitiveIndex) => {
        if (primitive.type !== 'formula') return []
        const formula = formulaPrimitiveSchema.parse(primitive)
        return formula.content.expressions.flatMap((expression, expressionIndex) => {
          try {
            katex.renderToString(expression.tex, {
              displayMode: expression.display,
              trust: false,
              throwOnError: true,
              strict: 'error',
            })
            return []
          } catch (error) {
            return [
              {
                file:
                  input.courseFiles.find(
                    ({ data }) =>
                      typeof data === 'object' &&
                      data !== null &&
                      'id' in data &&
                      data.id === course.id,
                  )?.file ?? course.id,
                path: `lessons.${lesson.id}.primitives.${primitiveIndex}.content.expressions.${expressionIndex}.tex`,
                message: error instanceof Error ? error.message : 'Invalid TeX expression',
                severity: 'error' as const,
              },
            ]
          }
        })
      }),
    ),
  )
  if (formulaIssues.length > 0) throw new ContentValidationError(formulaIssues)

  console.log(
    `Validated ${build.id}: ${registry.courses.length} courses, ${registry.lessonById.size} lessons, ${registry.cases.length} cases, ${registry.anatomyMaps.length} anatomy maps, ${registry.rounds.length} rounds, ${registry.games.length} games and ${registry.warnings.length} warnings.`,
  )
  for (const warning of registry.warnings) {
    console.warn(`WARN ${warning.file}:${warning.path} ${warning.message}`)
  }
}

async function main() {
  for (const build of Object.values(experienceBuilds)) await validateExperience(build)
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
