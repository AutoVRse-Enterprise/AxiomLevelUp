import { createHash } from 'node:crypto'
import { spawn } from 'node:child_process'
import { createRequire } from 'node:module'
import { mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { dirname, extname, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

import { NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'
import { getBounds } from '@gltf-transform/functions'
import { MeshoptDecoder, MeshoptEncoder } from 'meshoptimizer'

const require = createRequire(import.meta.url)
const cliPath = resolve(dirname(require.resolve('@gltf-transform/cli')), '../bin/cli.js')
const supportedExtensions = new Set(['.glb', '.gltf'])

function fail(message) {
  throw new Error(`Model preparation failed: ${message}`)
}

function parseMapping(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    fail('mapping JSON must be an object.')
  }
  const allowedKeys = new Set(['nodeNames', 'targetTriangles', 'simplificationError'])
  for (const key of Object.keys(value)) {
    if (!allowedKeys.has(key)) fail(`mapping contains unsupported property "${key}".`)
  }
  const nodeNames = value.nodeNames ?? {}
  if (!nodeNames || typeof nodeNames !== 'object' || Array.isArray(nodeNames)) {
    fail('nodeNames must be an object mapping source names to prepared names.')
  }
  for (const [sourceName, preparedName] of Object.entries(nodeNames)) {
    if (!sourceName.trim() || typeof preparedName !== 'string' || !preparedName.trim()) {
      fail('nodeNames keys and values must be non-empty strings.')
    }
  }
  if (!Number.isSafeInteger(value.targetTriangles) || value.targetTriangles <= 0) {
    fail('targetTriangles must be a positive integer.')
  }
  const simplificationError = value.simplificationError ?? 0.001
  if (
    typeof simplificationError !== 'number' ||
    !Number.isFinite(simplificationError) ||
    simplificationError <= 0 ||
    simplificationError > 1
  ) {
    fail('simplificationError must be greater than zero and at most one.')
  }
  return {
    nodeNames,
    targetTriangles: value.targetTriangles,
    simplificationError,
  }
}

function primitiveTriangleCount(primitive) {
  const elementCount =
    primitive.getIndices()?.getCount() ?? primitive.getAttribute('POSITION')?.getCount() ?? 0
  switch (primitive.getMode()) {
    case 4:
      return Math.floor(elementCount / 3)
    case 5:
    case 6:
      return Math.max(0, elementCount - 2)
    default:
      return 0
  }
}

function documentTriangleCount(document) {
  return document
    .getRoot()
    .listNodes()
    .reduce(
      (total, node) =>
        total +
        (node
          .getMesh()
          ?.listPrimitives()
          .reduce((meshTotal, primitive) => meshTotal + primitiveTriangleCount(primitive), 0) ?? 0),
      0,
    )
}

function documentBounds(document) {
  const scenes = document.getRoot().listScenes()
  if (scenes.length === 0) fail('prepared model must contain at least one scene.')
  const bounds = scenes.map((scene) => getBounds(scene))
  return {
    min: [
      Math.min(...bounds.map(({ min }) => min[0])),
      Math.min(...bounds.map(({ min }) => min[1])),
      Math.min(...bounds.map(({ min }) => min[2])),
    ],
    max: [
      Math.max(...bounds.map(({ max }) => max[0])),
      Math.max(...bounds.map(({ max }) => max[1])),
      Math.max(...bounds.map(({ max }) => max[2])),
    ],
  }
}

function runCli(arguments_) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(process.execPath, [cliPath, ...arguments_], {
      shell: false,
      stdio: 'inherit',
    })
    child.once('error', reject)
    child.once('exit', (code, signal) => {
      if (code === 0) {
        resolvePromise()
      } else {
        reject(
          new Error(
            `glTF Transform exited ${signal ? `after signal ${signal}` : `with code ${code}`}.`,
          ),
        )
      }
    })
  })
}

export async function prepareModel(sourcePath, mappingPath, outputDirectory) {
  const source = resolve(sourcePath)
  const mappingFile = resolve(mappingPath)
  const output = resolve(outputDirectory)
  if (!supportedExtensions.has(extname(source).toLowerCase())) {
    fail('source must be a .glb or .gltf file.')
  }

  const mapping = parseMapping(JSON.parse(await readFile(mappingFile, 'utf8')))
  await mkdir(output, { recursive: true })
  const intermediatePath = resolve(output, '.prepare-model-input.glb')
  const modelPath = resolve(output, 'model.glb')
  const metadataPath = resolve(output, 'metadata.json')

  await Promise.all([MeshoptDecoder.ready, MeshoptEncoder.ready])
  const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
    'meshopt.decoder': MeshoptDecoder,
    'meshopt.encoder': MeshoptEncoder,
  })
  const document = await io.read(source)
  const sourceNodeNames = new Set(
    document
      .getRoot()
      .listNodes()
      .map((node) => node.getName()),
  )
  for (const sourceName of Object.keys(mapping.nodeNames)) {
    if (!sourceNodeNames.has(sourceName)) {
      fail(`nodeNames references unknown source node "${sourceName}".`)
    }
  }

  document
    .getRoot()
    .listAnimations()
    .forEach((animation) => animation.dispose())
  document
    .getRoot()
    .listNodes()
    .forEach((node) => {
      const sourceName = node.getName()
      const preparedName = mapping.nodeNames[sourceName]?.trim() ?? sourceName
      node.setName(preparedName)
      if (node.getMesh()) node.getMesh().setName(preparedName)
    })

  const renderableNames = document
    .getRoot()
    .listNodes()
    .filter((node) => node.getMesh())
    .map((node) => node.getName())
  if (renderableNames.some((name) => !name)) {
    fail('every renderable node must have a name.')
  }
  if (new Set(renderableNames).size !== renderableNames.length) {
    fail('prepared renderable node names must be unique.')
  }

  const sourceTriangles = documentTriangleCount(document)
  if (sourceTriangles === 0) fail('source model does not contain triangle geometry.')
  const simplifyRatio =
    sourceTriangles > mapping.targetTriangles
      ? (mapping.targetTriangles / sourceTriangles) * 0.95
      : 1

  try {
    await io.write(intermediatePath, document)
    await runCli([
      'optimize',
      intermediatePath,
      modelPath,
      '--compress',
      'meshopt',
      '--flatten',
      'false',
      '--instance',
      'false',
      '--join',
      'false',
      '--palette',
      'false',
      '--prune',
      'true',
      '--resample',
      'false',
      '--weld',
      'true',
      '--simplify',
      'true',
      '--simplify-ratio',
      String(simplifyRatio),
      '--simplify-error',
      String(mapping.simplificationError),
      '--texture-compress',
      'false',
    ])
  } finally {
    await rm(intermediatePath, { force: true })
  }

  const preparedDocument = await io.read(modelPath)
  const meshNames = preparedDocument
    .getRoot()
    .listNodes()
    .filter((node) => node.getMesh())
    .map((node) => node.getName())
  if (meshNames.some((name) => !name) || new Set(meshNames).size !== meshNames.length) {
    fail('optimizer did not preserve unique renderable node names.')
  }
  const triangleCount = documentTriangleCount(preparedDocument)
  if (triangleCount > mapping.targetTriangles) {
    fail(
      `prepared model has ${triangleCount} triangles, exceeding target ${mapping.targetTriangles}.`,
    )
  }
  const fileBytes = await readFile(modelPath)
  const metadata = {
    schemaVersion: '0.1',
    mimeType: 'model/gltf-binary',
    path: 'model.glb',
    meshNames,
    triangleCount,
    bounds: documentBounds(preparedDocument),
    sizeBytes: (await stat(modelPath)).size,
    sha256: createHash('sha256').update(fileBytes).digest('hex'),
  }
  await writeFile(metadataPath, `${JSON.stringify(metadata, null, 2)}\n`)
  return metadata
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href
if (isMain) {
  const [sourcePath, mappingPath, outputDirectory] = process.argv.slice(2)
  if (!sourcePath || !mappingPath || !outputDirectory) {
    console.error('Usage: npm run model:prepare -- <source.glb|gltf> <mapping.json> <out-dir>')
    process.exitCode = 1
  } else {
    prepareModel(sourcePath, mappingPath, outputDirectory)
      .then((metadata) => {
        console.log(
          `Prepared model.glb (${metadata.triangleCount} triangles, ${metadata.sizeBytes} bytes).`,
        )
        console.log('Wrote metadata.json.')
      })
      .catch((error) => {
        console.error(error instanceof Error ? error.message : error)
        process.exitCode = 1
      })
  }
}
