import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js'

import { isVolumeStructure, type AnatomyMap } from '@/content/schema/anatomyMap'
import type { CaseFinding } from '@/content/schema/case'
import type {
  AnatomyControllerConfig,
  AnatomyHighlightGroup,
  AnatomyHighlightStyle,
  AnatomyLoadResult,
  AnatomyProjectedScreenPoint,
  AnatomyStartView,
  AnatomyViewerController,
  AnatomyViewState,
  CreateAnatomyControllerOptions,
} from '@/anatomy3d/viewer/controller'
import { clampAnatomyFov } from '@/anatomy3d/viewer/controller'
import { resolveStructure } from '@/anatomy3d/viewer/resolveStructure'
import { deterministicOcclusionBlobs } from '@/anatomy3d/three/findingGeometry'
import { ReferenceCountedCache, type CacheLease } from '@/anatomy3d/three/referenceCache'

interface MaterialState {
  color?: THREE.Color
  emissive?: THREE.Color
  opacity: number
  transparent: boolean
  depthWrite: boolean
}

interface CameraTween {
  startedAt: number
  duration: number
  fromPosition: THREE.Vector3
  toPosition: THREE.Vector3
  fromTarget: THREE.Vector3
  toTarget: THREE.Vector3
}

const modelCache = new ReferenceCountedCache<THREE.Group>()
const DEFAULT_FOV_DEGREES = 42

function materialsOf(mesh: THREE.Mesh) {
  return Array.isArray(mesh.material) ? mesh.material : [mesh.material]
}

function disposeSourceModel(model: THREE.Group) {
  const geometries = new Set<THREE.BufferGeometry>()
  const materials = new Set<THREE.Material>()
  const textures = new Set<THREE.Texture>()
  model.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return
    geometries.add(object.geometry)
    materialsOf(object).forEach((material) => {
      materials.add(material)
      Object.values(material).forEach((value) => {
        if (value instanceof THREE.Texture) textures.add(value)
      })
    })
  })
  textures.forEach((texture) => texture.dispose())
  materials.forEach((material) => material.dispose())
  geometries.forEach((geometry) => geometry.dispose())
}

async function acquireModel(url: string) {
  return modelCache.acquire(
    url,
    async () => {
      const loader = new GLTFLoader()
      loader.setMeshoptDecoder(MeshoptDecoder)
      return (await loader.loadAsync(url)).scene
    },
    disposeSourceModel,
  )
}

export async function prefetchAnatomyModel(url: string): Promise<() => void> {
  const lease = await acquireModel(url)
  return () => lease.release()
}

function cloneModel(source: THREE.Group) {
  const clone = source.clone(true)
  clone.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return
    object.material = Array.isArray(object.material)
      ? object.material.map((material) => material.clone())
      : object.material.clone()
  })
  return clone
}

function ease(progress: number, kind: AnatomyControllerConfig['flyThroughEasing']) {
  if (kind === 'linear') return progress
  if (kind === 'ease_out') return 1 - Math.pow(1 - progress, 3)
  return progress < 0.5
    ? 4 * progress * progress * progress
    : 1 - Math.pow(-2 * progress + 2, 3) / 2
}

function vector(value: readonly [number, number, number]) {
  return new THREE.Vector3(value[0], value[1], value[2])
}

function waypointCurve(
  from: AnatomyMap['waypoints'][number],
  to: AnatomyMap['waypoints'][number],
  strength: number,
) {
  const start = vector(from.position)
  const finish = vector(to.position)
  const distance = start.distanceTo(finish)
  const startDirection = vector(from.lookAt).sub(start).normalize()
  const finishDirection = vector(to.lookAt).sub(finish).normalize()
  return new THREE.CubicBezierCurve3(
    start,
    start.clone().addScaledVector(startDirection, distance * strength),
    finish.clone().addScaledVector(finishDirection, -distance * strength),
    finish,
  )
}

function pathToWaypoint(map: AnatomyMap, waypointId: string) {
  const visit = (id: string, path: string[]): string[] | null => {
    if (path.includes(id)) return null
    const waypoint = map.waypoints.find((candidate) => candidate.id === id)
    if (!waypoint) return null
    const nextPath = [...path, id]
    if (id === waypointId) return nextPath
    for (const nextId of waypoint.next) {
      const result = visit(nextId, nextPath)
      if (result) return result
    }
    return null
  }
  const childIds = new Set(map.waypoints.flatMap(({ next }) => next))
  for (const root of map.waypoints.filter(({ id }) => !childIds.has(id))) {
    const result = visit(root.id, [])
    if (result) return result
  }
  return [waypointId]
}

function taperedTubeGeometry(
  curve: THREE.Curve<THREE.Vector3>,
  startRadius: number,
  endRadius: number,
  tubularSegments: number,
  radialSegments: number,
) {
  const frames = curve.computeFrenetFrames(tubularSegments, false)
  const positions: number[] = []
  const uvs: number[] = []
  const indices: number[] = []

  for (let segment = 0; segment <= tubularSegments; segment += 1) {
    const progress = segment / tubularSegments
    const point = curve.getPointAt(progress)
    const radius = THREE.MathUtils.lerp(startRadius, endRadius, progress)
    for (let side = 0; side <= radialSegments; side += 1) {
      const angle = (side / radialSegments) * Math.PI * 2
      const offset = frames.normals[segment]!.clone()
        .multiplyScalar(Math.cos(angle) * radius)
        .addScaledVector(frames.binormals[segment]!, Math.sin(angle) * radius)
      positions.push(point.x + offset.x, point.y + offset.y, point.z + offset.z)
      uvs.push(progress, side / radialSegments)
    }
  }

  for (let segment = 0; segment < tubularSegments; segment += 1) {
    for (let side = 0; side < radialSegments; side += 1) {
      const row = radialSegments + 1
      const a = segment * row + side
      const b = (segment + 1) * row + side
      indices.push(a, b, a + 1, b, b + 1, a + 1)
    }
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  return geometry
}

function disposeGeneratedGroup(group: THREE.Group | null) {
  group?.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return
    object.geometry.dispose()
    materialsOf(object).forEach((material) => material.dispose())
  })
}

export function createAnatomyController({
  element,
  config,
  onViewChanged,
  onContextLost,
  onContextRestored,
}: CreateAnatomyControllerOptions): AnatomyViewerController {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.setClearColor(config.backgroundColor, 1)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, config.pixelRatioCap))
  renderer.domElement.className = 'block h-full w-full'
  renderer.domElement.setAttribute('aria-hidden', 'true')
  element.replaceChildren(renderer.domElement)

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(DEFAULT_FOV_DEGREES, 1, 0.001, 10_000)
  scene.add(camera)
  const controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.enablePan = true
  controls.enableRotate = true
  controls.enableZoom = true
  scene.add(new THREE.HemisphereLight(0xffffff, 0x5c4acf, 2.4))
  const keyLight = new THREE.DirectionalLight(0xffffff, 3.2)
  keyLight.position.set(3, 5, 4)
  scene.add(keyLight)
  const headlight = new THREE.PointLight(
    config.lumen.headlight.color,
    config.lumen.headlight.intensity,
  )
  headlight.visible = false
  camera.add(headlight)

  const raycaster = new THREE.Raycaster()
  const pointer = new THREE.Vector2()
  const materialStates = new Map<THREE.Material, MaterialState>()
  let lease: CacheLease<THREE.Group> | null = null
  let model: THREE.Group | null = null
  let map: AnatomyMap | null = null
  let marker: THREE.Mesh | null = null
  let markerId: string | null = null
  let lumen: THREE.Group | null = null
  let findingRoot: THREE.Group | null = null
  let volumeRoot: THREE.Group | null = null
  let findings: readonly CaseFinding[] = []
  const findingObjects = new Map<string, THREE.Group>()
  const volumeObjects = new Map<string, THREE.Mesh>()
  let selectableLevelIds: readonly string[] | undefined
  let highlightGroups: readonly AnatomyHighlightGroup[] = []
  let overviewPosition = new THREE.Vector3(0, 0, 5)
  let overviewTarget = new THREE.Vector3()
  let overviewNear = camera.near
  let currentWaypointId: string | null = null
  let waypointTrail: string[] = []
  let endoscopic = false
  let endoscopicDirection = new THREE.Vector3(0, 0, -1)
  let endoscopicLookDistance = 1
  let lookYaw = 0
  let lookPitch = 0
  let tween: CameraTween | null = null
  let disposed = false
  let previousFrameAt: number | null = null
  const frameTimes: number[] = []

  const contextLossExtension = renderer.getContext().getExtension('WEBGL_lose_context')
  const handleContextLost = (event: Event) => {
    event.preventDefault()
    onContextLost?.()
  }
  const handleContextRestored = () => {
    previousFrameAt = null
    frameTimes.length = 0
    onContextRestored?.()
  }
  renderer.domElement.addEventListener('webglcontextlost', handleContextLost)
  renderer.domElement.addEventListener('webglcontextrestored', handleContextRestored)

  const notifyViewChanged = () => {
    const view: AnatomyViewState = {
      position: [camera.position.x, camera.position.y, camera.position.z],
      target: [controls.target.x, controls.target.y, controls.target.z],
      waypointId: currentWaypointId,
      endoscopic,
    }
    onViewChanged?.(view)
  }
  controls.addEventListener('end', notifyViewChanged)

  const resize = () => {
    const width = Math.max(1, element.clientWidth)
    const height = Math.max(1, element.clientHeight)
    renderer.setSize(width, height, false)
    camera.aspect = width / height
    camera.updateProjectionMatrix()
  }
  const resizeObserver =
    typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(() => resize())
  resizeObserver?.observe(element)
  window.addEventListener('resize', resize)
  resize()

  const render = (time: number) => {
    if (previousFrameAt !== null) {
      const elapsed = time - previousFrameAt
      if (elapsed > 0 && elapsed <= 250) {
        frameTimes.push(elapsed)
        if (frameTimes.length > 120) frameTimes.shift()
      }
    }
    previousFrameAt = time
    if (tween) {
      const progress = Math.min(1, (time - tween.startedAt) / tween.duration)
      const eased = ease(progress, config.flyThroughEasing)
      camera.position.lerpVectors(tween.fromPosition, tween.toPosition, eased)
      controls.target.lerpVectors(tween.fromTarget, tween.toTarget, eased)
      if (!controls.enabled) camera.lookAt(controls.target)
      if (progress === 1) {
        tween = null
        notifyViewChanged()
      }
    }
    if (controls.enabled) controls.update()
    renderer.render(scene, camera)
  }
  renderer.setAnimationLoop(render)

  const clearMarker = () => {
    if (marker) {
      scene.remove(marker)
      marker.geometry.dispose()
      materialsOf(marker).forEach((material) => material.dispose())
    }
    marker = null
    markerId = null
  }

  const clearLumen = () => {
    if (!lumen) return
    scene.remove(lumen)
    disposeGeneratedGroup(lumen)
    lumen = null
  }

  const clearFindings = () => {
    if (!findingRoot) return
    scene.remove(findingRoot)
    disposeGeneratedGroup(findingRoot)
    findingRoot = null
    findingObjects.clear()
  }

  const clearVolumes = () => {
    if (!volumeRoot) return
    scene.remove(volumeRoot)
    disposeGeneratedGroup(volumeRoot)
    volumeRoot = null
    volumeObjects.clear()
  }

  const releaseModel = () => {
    clearMarker()
    clearLumen()
    clearFindings()
    clearVolumes()
    if (model) {
      scene.remove(model)
      model.traverse((object) => {
        if (!(object instanceof THREE.Mesh)) return
        materialsOf(object).forEach((material) => material.dispose())
      })
    }
    model = null
    materialStates.clear()
    lease?.release()
    lease = null
  }

  const meshForStructure = (structureId: string) => {
    if (!model || !map) return []
    const structure = map.structures.find((candidate) => candidate.id === structureId)
    const names = new Set(structure && 'meshNames' in structure ? structure.meshNames : [])
    const meshes: THREE.Mesh[] = []
    model.traverse((object) => {
      if (object instanceof THREE.Mesh && names.has(object.name)) meshes.push(object)
    })
    return meshes
  }

  const volumeForStructure = (structureId: string) => {
    const volume = volumeObjects.get(structureId)
    return volume ? [volume] : []
  }

  const objectsForStructure = (structureId: string) => [
    ...meshForStructure(structureId),
    ...volumeForStructure(structureId),
  ]

  const restoreModelAppearance = () => {
    model?.traverse((object) => {
      if (object instanceof THREE.Mesh) object.visible = true
    })
    materialStates.forEach((state, material) => {
      const candidate = material as THREE.Material & {
        color?: THREE.Color
        emissive?: THREE.Color
      }
      if (state.color && candidate.color) candidate.color.copy(state.color)
      if (state.emissive && candidate.emissive) candidate.emissive.copy(state.emissive)
      material.opacity = state.opacity
      material.transparent = state.transparent
      material.depthWrite = state.depthWrite
      material.needsUpdate = true
    })
  }

  const nearestMeshAncestor = (structureId: string) => {
    if (!map) return null
    const structureById = new Map(map.structures.map((structure) => [structure.id, structure]))
    const visited = new Set<string>()
    let current = structureById.get(structureId)
    while (current?.parentId && !visited.has(current.parentId)) {
      visited.add(current.parentId)
      const parent = structureById.get(current.parentId)
      if (!parent) return null
      if ('meshNames' in parent) return parent
      current = parent
    }
    return null
  }

  const resetVolumeAppearance = () => {
    volumeObjects.forEach((volume) => {
      const material = volume.material as THREE.MeshStandardMaterial
      material.color.set(config.volumeStyles.color)
      material.emissive
        .set(config.volumeStyles.color)
        .multiplyScalar(config.volumeStyles.emissiveIntensity)
      material.opacity = config.volumeStyles.opacity
      material.transparent = config.volumeStyles.opacity < 1
      material.depthWrite = false
      material.needsUpdate = true
    })
  }

  const applyStructureAppearance = () => {
    restoreModelAppearance()
    resetVolumeAppearance()
    const allowedLevels = selectableLevelIds ? new Set(selectableLevelIds) : null
    const activeVolumeIds = new Set<string>()
    volumeObjects.forEach((volume, structureId) => {
      const structure = map?.structures.find(({ id }) => id === structureId)
      volume.visible = Boolean(
        !endoscopic && allowedLevels && structure && allowedLevels.has(structure.levelId),
      )
      if (volume.visible) activeVolumeIds.add(structureId)
    })
    if (volumeRoot) volumeRoot.visible = !endoscopic

    if (activeVolumeIds.size > 0 && model) {
      model.traverse((object) => {
        if (object instanceof THREE.Mesh) object.visible = false
      })
      activeVolumeIds.forEach((structureId) => {
        const parent = nearestMeshAncestor(structureId)
        if (!parent) return
        meshForStructure(parent.id).forEach((mesh) => {
          mesh.visible = true
          materialsOf(mesh).forEach((material) => {
            material.opacity = config.volumeStyles.contextOpacity
            material.transparent = true
            material.depthWrite = false
            material.needsUpdate = true
          })
        })
      })
    }

    highlightGroups.forEach(({ ids, style }) =>
      ids.forEach((id) => {
        meshForStructure(id).forEach((mesh) => {
          materialsOf(mesh).forEach((material) => {
            const candidate = material as THREE.Material & {
              color?: THREE.Color
              emissive?: THREE.Color
            }
            if (candidate.emissive) candidate.emissive.set(style.color)
            else candidate.color?.set(style.color)
            material.opacity =
              style.opacity ?? materialStates.get(material)?.opacity ?? material.opacity
            material.transparent = material.opacity < 1
            material.needsUpdate = true
          })
        })
        volumeForStructure(id).forEach((volume) => {
          const material = volume.material as THREE.MeshStandardMaterial
          material.color.set(style.color)
          material.emissive
            .set(style.color)
            .multiplyScalar(config.volumeStyles.highlightEmissiveIntensity)
          material.opacity = style.opacity ?? config.volumeStyles.highlightOpacity
          material.transparent = material.opacity < 1
          material.needsUpdate = true
        })
      }),
    )
  }

  const buildVolumes = () => {
    clearVolumes()
    if (!map) return
    volumeRoot = new THREE.Group()
    volumeRoot.name = 'procedural-anatomy-volumes'
    map.structures.forEach((structure) => {
      if (!isVolumeStructure(structure)) return
      const geometry = new THREE.SphereGeometry(
        1,
        config.volumeStyles.widthSegments,
        config.volumeStyles.heightSegments,
      )
      const material = new THREE.MeshStandardMaterial({
        color: config.volumeStyles.color,
        emissive: new THREE.Color(config.volumeStyles.color).multiplyScalar(
          config.volumeStyles.emissiveIntensity,
        ),
        opacity: config.volumeStyles.opacity,
        transparent: config.volumeStyles.opacity < 1,
        depthWrite: false,
        roughness: config.volumeStyles.roughness,
        metalness: config.volumeStyles.metalness,
        side: THREE.DoubleSide,
      })
      const volume = new THREE.Mesh(geometry, material)
      volume.name = `volume:${structure.id}`
      volume.position.set(...structure.volume.center)
      volume.scale.set(...structure.volume.radii)
      volume.rotation.set(...(structure.volume.rotation ?? [0, 0, 0]))
      volume.renderOrder = 2
      volume.userData.structureId = structure.id
      volume.visible = false
      volumeRoot!.add(volume)
      volumeObjects.set(structure.id, volume)
    })
    scene.add(volumeRoot)
    applyStructureAppearance()
  }

  const updateFindingVisibility = () => {
    findingObjects.forEach((group) => {
      group.visible = group.userData.anchorType === 'waypoint' ? endoscopic : !endoscopic
    })
  }

  const findingMaterial = (color: string, opacity: number, side: THREE.Side = THREE.DoubleSide) =>
    new THREE.MeshStandardMaterial({
      color,
      emissive: new THREE.Color(color).multiplyScalar(0.16),
      opacity,
      transparent: opacity < 1,
      roughness: 0.72,
      side,
      depthWrite: opacity >= 1,
    })

  const addFindingPickTarget = (
    group: THREE.Group,
    findingId: string,
    radius: number,
    position = new THREE.Vector3(),
  ) => {
    const target = new THREE.Mesh(
      new THREE.SphereGeometry(radius, 12, 8),
      new THREE.MeshBasicMaterial({
        transparent: true,
        opacity: 0,
        depthWrite: false,
        colorWrite: false,
      }),
    )
    target.position.copy(position)
    target.userData.findingId = findingId
    group.add(target)
  }

  const buildFindings = () => {
    clearFindings()
    if (!map || findings.length === 0) return
    findingRoot = new THREE.Group()

    findings.forEach((finding) => {
      const group = new THREE.Group()
      group.name = `finding:${finding.id}`
      group.userData.findingId = finding.id
      group.userData.anchorType = finding.anchor.type

      if (finding.anchor.type === 'structure') {
        const meshes = meshForStructure(finding.anchor.structure)
        const style =
          finding.kind === 'region'
            ? config.findingStyles.region
            : config.findingStyles[finding.kind]
        meshes.forEach((mesh) => {
          mesh.updateWorldMatrix(true, false)
          const overlay = new THREE.Mesh(
            mesh.geometry.clone(),
            findingMaterial(style.color, style.opacity),
          )
          mesh.matrixWorld.decompose(overlay.position, overlay.quaternion, overlay.scale)
          if (finding.kind === 'region') {
            overlay.scale.multiplyScalar(config.findingStyles.region.scale)
          }
          overlay.userData.findingId = finding.id
          group.add(overlay)
        })
        const bounds = new THREE.Box3().setFromObject(group)
        if (!bounds.isEmpty()) {
          const sphere = bounds.getBoundingSphere(new THREE.Sphere())
          addFindingPickTarget(
            group,
            finding.id,
            Math.max(sphere.radius * config.findingStyles.pickRadiusRatio, 0.01),
            sphere.center,
          )
        }
      } else {
        const anchor = finding.anchor
        const from = map!.waypoints.find(({ id }) => id === anchor.waypoint)
        const to = map!.waypoints.find(({ id }) => id === anchor.toWaypoint)
        if (!from || !to) return
        const curve = waypointCurve(from, to, config.lumen.curveStrength)
        const position = curve.getPointAt(anchor.t)
        const tangent = curve.getTangentAt(anchor.t).normalize()
        const radius = THREE.MathUtils.lerp(
          from.radius ?? config.lumen.defaultRadius,
          to.radius ?? config.lumen.defaultRadius,
          anchor.t,
        )

        if (finding.kind === 'lumen_occlusion') {
          const style = config.findingStyles.lumen_occlusion
          deterministicOcclusionBlobs(finding.id, style.blobCount).forEach((sample) => {
            const blobRadius =
              radius * style.blobRadiusRatio * sample.radiusScale * finding.severity
            const blob = new THREE.Mesh(
              new THREE.IcosahedronGeometry(Math.max(blobRadius, radius * 0.06), 1),
              findingMaterial(style.color, style.opacity),
            )
            const spread = radius * style.spreadRadiusRatio * sample.spreadScale
            blob.position
              .copy(position)
              .add(
                new THREE.Vector3(
                  Math.cos(sample.angle) * spread,
                  Math.sin(sample.angle) * spread,
                  0,
                ),
              )
            blob.rotation.set(...sample.rotation)
            blob.userData.findingId = finding.id
            group.add(blob)
          })
        } else if (finding.kind === 'region') {
          const style = config.findingStyles.region
          const region = new THREE.Mesh(
            new THREE.SphereGeometry(radius * style.scale, 20, 14),
            findingMaterial(style.color, style.opacity),
          )
          region.position.copy(position)
          region.userData.findingId = finding.id
          group.add(region)
        } else {
          const style =
            finding.kind === 'lumen_narrowing'
              ? config.findingStyles.lumen_narrowing
              : config.findingStyles.wall_thickening
          const radiusReduction =
            finding.kind === 'lumen_narrowing'
              ? config.findingStyles.lumen_narrowing.maxRadiusReduction * finding.severity
              : config.findingStyles.wall_thickening.thicknessRadiusRatio * finding.severity
          const innerRadius = Math.max(radius * (1 - radiusReduction), radius * 0.08)
          const sleeve = new THREE.Mesh(
            new THREE.CylinderGeometry(
              innerRadius,
              innerRadius,
              radius * style.axialLengthRadiusMultiplier,
              config.lumen.radialSegments,
              1,
              true,
            ),
            findingMaterial(style.color, style.opacity, THREE.BackSide),
          )
          sleeve.position.copy(position)
          sleeve.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), tangent)
          sleeve.userData.findingId = finding.id
          group.add(sleeve)
        }

        addFindingPickTarget(
          group,
          finding.id,
          Math.max(radius * config.findingStyles.pickRadiusRatio, 0.01),
          position,
        )
      }

      findingRoot!.add(group)
      findingObjects.set(finding.id, group)
    })
    updateFindingVisibility()
    scene.add(findingRoot)
  }

  const setCamera = (position: THREE.Vector3, target: THREE.Vector3) => {
    tween = null
    camera.position.copy(position)
    controls.target.copy(target)
    camera.lookAt(target)
    controls.update()
    notifyViewChanged()
  }

  const setEndoscopicEnvironment = (waypoint: AnatomyMap['waypoints'][number]) => {
    const radius = waypoint.radius ?? config.lumen.defaultRadius
    camera.near = Math.max(radius / 100, 0.0001)
    camera.updateProjectionMatrix()
    headlight.distance = radius * config.lumen.headlight.distanceRadiusMultiplier
    scene.fog = new THREE.Fog(
      config.lumen.fog.color,
      radius * config.lumen.fog.nearRadiusMultiplier,
      radius * config.lumen.fog.farRadiusMultiplier,
    )
    const position = vector(waypoint.position)
    const target = vector(waypoint.lookAt)
    endoscopicDirection = target.clone().sub(position).normalize()
    endoscopicLookDistance = Math.max(position.distanceTo(target), radius)
    lookYaw = 0
    lookPitch = 0
    camera.fov = clampAnatomyFov(DEFAULT_FOV_DEGREES, config.lumen.zoom)
    camera.updateProjectionMatrix()
  }

  const buildLumen = () => {
    if (!map || lumen) return
    lumen = new THREE.Group()
    const wallMaterial = new THREE.MeshStandardMaterial({
      color: config.lumen.color,
      opacity: config.lumen.opacity,
      transparent: config.lumen.opacity < 1,
      roughness: config.lumen.roughness,
      side: THREE.BackSide,
    })
    const ringMaterial = new THREE.MeshStandardMaterial({
      color: config.lumen.rings.color,
      opacity: config.lumen.rings.opacity,
      transparent: config.lumen.rings.opacity < 1,
      roughness: config.lumen.roughness,
      side: THREE.DoubleSide,
    })
    const branchRimMaterial = new THREE.MeshStandardMaterial({
      color: config.lumen.cues.branchRimColor,
      opacity: config.lumen.cues.branchRimOpacity,
      transparent: config.lumen.cues.branchRimOpacity < 1,
      roughness: config.lumen.roughness,
      side: THREE.DoubleSide,
    })

    map.waypoints.forEach((from) => {
      const startRadius = from.radius ?? config.lumen.defaultRadius
      const depth = Math.max(0, pathToWaypoint(map!, from.id).length - 1)

      from.next.forEach((nextId) => {
        const next = map!.waypoints.find(({ id }) => id === nextId)
        if (!next) return
        const endRadius = next.radius ?? config.lumen.defaultRadius
        const curve = waypointCurve(from, next, config.lumen.curveStrength)
        const connectionMaterial = wallMaterial.clone()
        if (config.lumen.cues.enabled && config.lumen.cues.depthTintStrength > 0) {
          connectionMaterial.color.lerp(
            new THREE.Color(config.lumen.cues.depthTintColor),
            Math.min(1, depth / 5) * config.lumen.cues.depthTintStrength,
          )
        }
        lumen!.add(
          new THREE.Mesh(
            taperedTubeGeometry(
              curve,
              startRadius,
              endRadius,
              config.lumen.tubularSegmentsPerConnection,
              config.lumen.radialSegments,
            ),
            connectionMaterial,
          ),
        )

        if (config.lumen.cues.enabled && config.lumen.cues.branchRims) {
          const rim = new THREE.Mesh(
            new THREE.TorusGeometry(
              endRadius * (1 - config.lumen.cues.branchRimTubeRadiusRatio),
              endRadius * config.lumen.cues.branchRimTubeRadiusRatio,
              6,
              20,
            ),
            branchRimMaterial.clone(),
          )
          rim.position.copy(curve.getPointAt(0.94))
          rim.quaternion.setFromUnitVectors(
            new THREE.Vector3(0, 0, 1),
            curve.getTangentAt(0.94).normalize(),
          )
          lumen!.add(rim)
        }

        const ringCount = from.lumen?.ringCount ?? 0
        for (let ringIndex = 1; ringIndex <= ringCount; ringIndex += 1) {
          const progress = ringIndex / (ringCount + 1)
          const radius = THREE.MathUtils.lerp(startRadius, endRadius, progress)
          const ring = new THREE.Mesh(
            new THREE.TorusGeometry(
              radius * (1 - config.lumen.rings.tubeRadiusRatio),
              radius * config.lumen.rings.tubeRadiusRatio,
              config.lumen.rings.radialSegments,
              config.lumen.rings.tubularSegments,
            ),
            ringMaterial.clone(),
          )
          ring.position.copy(curve.getPointAt(progress))
          ring.quaternion.setFromUnitVectors(
            new THREE.Vector3(0, 0, 1),
            curve.getTangentAt(progress).normalize(),
          )
          lumen!.add(ring)
        }
      })
    })
    wallMaterial.dispose()
    ringMaterial.dispose()
    branchRimMaterial.dispose()
    scene.add(lumen)
  }

  const controller: AnatomyViewerController = {
    async load(modelUrl, anatomyMap): Promise<AnatomyLoadResult> {
      releaseModel()
      map = anatomyMap
      const nextLease = await acquireModel(modelUrl)
      if (disposed) {
        nextLease.release()
        throw new Error('The anatomy viewer was disposed before the model loaded.')
      }
      lease = nextLease
      model = cloneModel(nextLease.value)
      scene.add(model)

      const meshNames: string[] = []
      let triangleCount = 0
      model.traverse((object) => {
        if (!(object instanceof THREE.Mesh)) return
        meshNames.push(object.name)
        const indexCount = object.geometry.index?.count
        const positionCount = object.geometry.getAttribute('position')?.count ?? 0
        triangleCount += Math.floor((indexCount ?? positionCount) / 3)
        materialsOf(object).forEach((material) => {
          const candidate = material as THREE.Material & {
            color?: THREE.Color
            emissive?: THREE.Color
          }
          materialStates.set(material, {
            color: candidate.color?.clone(),
            emissive: candidate.emissive?.clone(),
            opacity: material.opacity,
            transparent: material.transparent,
            depthWrite: material.depthWrite,
          })
        })
      })

      const bounds = new THREE.Box3().setFromObject(model)
      const sphere = bounds.getBoundingSphere(new THREE.Sphere())
      const radius = Math.max(sphere.radius, 0.01)
      overviewTarget = sphere.center.clone()
      overviewPosition = sphere.center
        .clone()
        .add(new THREE.Vector3(0, radius * 0.15, radius * 2.8))
      camera.near = Math.max(radius / 1_000, 0.001)
      overviewNear = camera.near
      camera.far = Math.max(radius * 20, 100)
      camera.updateProjectionMatrix()
      controls.minDistance = radius * 0.05
      controls.maxDistance = radius * 8
      buildVolumes()
      buildFindings()
      controller.resetView()
      return { meshNames, triangleCount }
    },

    setStartView(view: AnatomyStartView) {
      if (view.mode === 'overview') controller.resetView()
      else if (view.mode === 'marker') {
        controller.resetView()
        controller.setMarker(view.structureId)
      } else if (view.mode === 'waypoint_marker') {
        controller.resetView()
        controller.setWaypointMarker(view.waypointId)
      } else if (view.mode === 'waypoint') {
        controller.travelTo(view.waypointId, { animate: false })
      } else {
        controller.enterEndoscopic(view.waypointId)
      }
    },

    setSelectableLevelIds(levelIds) {
      selectableLevelIds = levelIds ? [...levelIds] : undefined
      applyStructureAppearance()
    },

    pick(clientX, clientY, selectableLevelIds) {
      if (!model || !map || !model.visible) return null
      const rect = renderer.domElement.getBoundingClientRect()
      if (rect.width === 0 || rect.height === 0) return null
      pointer.set(
        ((clientX - rect.left) / rect.width) * 2 - 1,
        -((clientY - rect.top) / rect.height) * 2 + 1,
      )
      raycaster.setFromCamera(pointer, camera)
      const structureIdHits = volumeRoot
        ? raycaster
            .intersectObject(volumeRoot, true)
            .flatMap(({ object }) =>
              typeof object.userData.structureId === 'string'
                ? [object.userData.structureId as string]
                : [],
            )
        : []
      const volumeHit = resolveStructure([], map.structures, selectableLevelIds, structureIdHits)
      if (volumeHit) return volumeHit
      const meshNameHits = raycaster.intersectObject(model, true).flatMap(({ object }) => {
        const names: string[] = []
        let current: THREE.Object3D | null = object
        while (current && current !== model) {
          if (current.name) names.push(current.name)
          current = current.parent
        }
        return names
      })
      return resolveStructure(meshNameHits, map.structures, selectableLevelIds)
    },

    pickFinding(clientX, clientY) {
      if (!findingRoot) return null
      const rect = renderer.domElement.getBoundingClientRect()
      if (rect.width === 0 || rect.height === 0) return null
      pointer.set(
        ((clientX - rect.left) / rect.width) * 2 - 1,
        -((clientY - rect.top) / rect.height) * 2 + 1,
      )
      raycaster.setFromCamera(pointer, camera)
      for (const { object } of raycaster.intersectObject(findingRoot, true)) {
        let current: THREE.Object3D | null = object
        while (current && current !== findingRoot) {
          if (typeof current.userData.findingId === 'string') {
            return current.userData.findingId
          }
          current = current.parent
        }
      }
      return null
    },

    highlight(structureIds, style: AnatomyHighlightStyle) {
      highlightGroups = [{ ids: [...structureIds], style }]
      applyStructureAppearance()
    },

    highlightGroups(groups) {
      highlightGroups = groups.map(({ ids, style }) => ({ ids: [...ids], style: { ...style } }))
      applyStructureAppearance()
    },

    setMarker(structureId) {
      clearMarker()
      if (!structureId) return
      const objects = objectsForStructure(structureId)
      if (objects.length === 0) return
      const bounds = new THREE.Box3()
      objects.forEach((object) => bounds.expandByObject(object))
      const sphere = bounds.getBoundingSphere(new THREE.Sphere())
      marker = new THREE.Mesh(
        new THREE.SphereGeometry(Math.max(sphere.radius * 0.08, 0.01), 16, 12),
        new THREE.MeshBasicMaterial({ color: config.markerColor }),
      )
      marker.position.copy(sphere.center)
      scene.add(marker)
      markerId = structureId
    },

    setWaypointMarker(waypointId) {
      clearMarker()
      if (!waypointId) return
      const waypoint = map?.waypoints.find(({ id }) => id === waypointId)
      if (!waypoint) return
      const radius = waypoint.radius ?? config.lumen.defaultRadius
      marker = new THREE.Mesh(
        new THREE.SphereGeometry(Math.max(radius * 0.35, 0.01), 18, 14),
        new THREE.MeshBasicMaterial({ color: config.markerColor }),
      )
      marker.position.copy(vector(waypoint.position))
      scene.add(marker)
      markerId = waypointId
    },

    setFindings(nextFindings) {
      findings = [...nextFindings]
      buildFindings()
    },

    travelTo(waypointId, options = {}) {
      const waypoint = map?.waypoints.find(({ id }) => id === waypointId)
      if (!waypoint) return
      const previousId = waypointTrail.at(-2)
      const current = map?.waypoints.find(({ id }) => id === currentWaypointId)
      if (waypointId === previousId) waypointTrail = waypointTrail.slice(0, -1)
      else if (current?.next.includes(waypointId)) waypointTrail = [...waypointTrail, waypointId]
      else if (waypointId !== currentWaypointId) waypointTrail = pathToWaypoint(map!, waypointId)
      currentWaypointId = waypointId
      if (endoscopic) {
        buildLumen()
        if (model) model.visible = false
        if (volumeRoot) volumeRoot.visible = false
        controls.enabled = false
        headlight.visible = true
        setEndoscopicEnvironment(waypoint)
      } else {
        clearLumen()
        if (model) model.visible = true
        applyStructureAppearance()
        controls.enabled = true
        headlight.visible = false
        scene.fog = null
        camera.near = overviewNear
        camera.updateProjectionMatrix()
      }
      updateFindingVisibility()
      const toPosition = vector(waypoint.position)
      const toTarget = vector(waypoint.lookAt)
      if (options.animate !== false && config.cameraAnimationDurationMs > 0) {
        tween = {
          startedAt: performance.now(),
          duration: config.cameraAnimationDurationMs,
          fromPosition: camera.position.clone(),
          toPosition,
          fromTarget: controls.target.clone(),
          toTarget,
        }
      } else {
        setCamera(toPosition, toTarget)
      }
    },

    availableBranches() {
      return (
        map?.waypoints
          .find(({ id }) => id === currentWaypointId)
          ?.next.filter((id) => map!.waypoints.some((waypoint) => waypoint.id === id)) ?? []
      )
    },

    parentWaypoint() {
      return waypointTrail.at(-2) ?? null
    },

    waypointPath() {
      return waypointTrail
    },

    enterEndoscopic(waypointId) {
      const waypoint = map?.waypoints.find(({ id }) => id === waypointId)
      if (!waypoint || !map) return
      buildLumen()
      if (model) model.visible = false
      if (volumeRoot) volumeRoot.visible = false
      endoscopic = true
      if (waypointId !== currentWaypointId || waypointTrail.length === 0) {
        waypointTrail = pathToWaypoint(map, waypointId)
      }
      currentWaypointId = waypointId
      controls.enabled = false
      headlight.visible = true
      setEndoscopicEnvironment(waypoint)
      updateFindingVisibility()
      setCamera(vector(waypoint.position), vector(waypoint.lookAt))
    },

    exitEndoscopic(options = {}) {
      if (!endoscopic || !currentWaypointId) return
      const waypoint = map?.waypoints.find(({ id }) => id === currentWaypointId)
      if (!waypoint) return
      endoscopic = false
      clearLumen()
      if (model) model.visible = true
      applyStructureAppearance()
      controls.enabled = true
      headlight.visible = false
      scene.fog = null
      camera.near = overviewNear
      camera.fov = DEFAULT_FOV_DEGREES
      camera.updateProjectionMatrix()
      updateFindingVisibility()
      controller.travelTo(waypoint.id, options)
    },

    lookAround(deltaX, deltaY) {
      if (!endoscopic || !config.lumen.lookAround.enabled || tween) return
      const radiansPerPixel = THREE.MathUtils.degToRad(config.lumen.lookAround.degreesPerPixel)
      lookYaw = THREE.MathUtils.clamp(
        lookYaw - deltaX * radiansPerPixel,
        -THREE.MathUtils.degToRad(config.lumen.lookAround.maxYawDegrees),
        THREE.MathUtils.degToRad(config.lumen.lookAround.maxYawDegrees),
      )
      lookPitch = THREE.MathUtils.clamp(
        lookPitch - deltaY * radiansPerPixel,
        -THREE.MathUtils.degToRad(config.lumen.lookAround.maxPitchDegrees),
        THREE.MathUtils.degToRad(config.lumen.lookAround.maxPitchDegrees),
      )
      const worldUp = new THREE.Vector3(0, 1, 0)
      const right = endoscopicDirection.clone().cross(worldUp)
      if (right.lengthSq() < 0.0001) right.set(1, 0, 0)
      right.normalize()
      const direction = endoscopicDirection
        .clone()
        .applyAxisAngle(worldUp, lookYaw)
        .applyAxisAngle(right, lookPitch)
      controls.target.copy(camera.position).addScaledVector(direction, endoscopicLookDistance)
      camera.lookAt(controls.target)
      notifyViewChanged()
    },

    setZoom(fovDegrees) {
      if (!endoscopic || !config.lumen.zoom.enabled) return
      camera.fov = clampAnatomyFov(fovDegrees, config.lumen.zoom)
      camera.updateProjectionMatrix()
      notifyViewChanged()
    },

    zoomBy(deltaDegrees) {
      controller.setZoom(camera.fov + deltaDegrees)
    },

    frameStructures(structureIds, options = {}) {
      if (!model || endoscopic || structureIds.length === 0) return
      const bounds = new THREE.Box3()
      structureIds.forEach((id) =>
        objectsForStructure(id).forEach((object) => bounds.expandByObject(object)),
      )
      if (bounds.isEmpty()) return
      const sphere = bounds.getBoundingSphere(new THREE.Sphere())
      const direction = camera.position.clone().sub(controls.target)
      if (direction.lengthSq() < 0.0001) direction.set(0, 0, 1)
      direction.normalize()
      const verticalFov = THREE.MathUtils.degToRad(camera.fov)
      const horizontalFov = 2 * Math.atan(Math.tan(verticalFov / 2) * camera.aspect)
      const limitingFov = Math.min(verticalFov, horizontalFov)
      const distance = Math.max(sphere.radius / Math.sin(limitingFov / 2), sphere.radius * 2)
      const position = sphere.center.clone().addScaledVector(direction, distance * 1.15)
      if (options.animate !== false && config.cameraAnimationDurationMs > 0) {
        tween = {
          startedAt: performance.now(),
          duration: config.cameraAnimationDurationMs,
          fromPosition: camera.position.clone(),
          toPosition: position,
          fromTarget: controls.target.clone(),
          toTarget: sphere.center.clone(),
        }
      } else {
        setCamera(position, sphere.center)
      }
    },

    resetView() {
      clearLumen()
      if (model) model.visible = true
      endoscopic = false
      currentWaypointId = null
      waypointTrail = []
      controls.enabled = true
      headlight.visible = false
      scene.fog = null
      camera.near = overviewNear
      camera.fov = DEFAULT_FOV_DEGREES
      camera.updateProjectionMatrix()
      applyStructureAppearance()
      updateFindingVisibility()
      setCamera(overviewPosition, overviewTarget)
    },

    getTestSnapshot() {
      scene.updateMatrixWorld(true)
      camera.updateMatrixWorld(true)
      const rect = renderer.domElement.getBoundingClientRect()
      const projectPoint = (id: string, position: THREE.Vector3, rendered: boolean) => {
        const projected = position.clone().project(camera)
        return {
          id,
          clientX: rect.left + ((projected.x + 1) / 2) * rect.width,
          clientY: rect.top + ((1 - projected.y) / 2) * rect.height,
          visible:
            rendered &&
            projected.x >= -1 &&
            projected.x <= 1 &&
            projected.y >= -1 &&
            projected.y <= 1 &&
            projected.z >= -1 &&
            projected.z <= 1,
        } satisfies AnatomyProjectedScreenPoint
      }
      const structures: AnatomyProjectedScreenPoint[] = []
      map?.structures.forEach((structure) => {
        const objects = objectsForStructure(structure.id)
        if (objects.length === 0) return
        const center = new THREE.Box3()
        objects.forEach((object) => center.expandByObject(object))
        const rendered = objects.some((object) => {
          let current: THREE.Object3D | null = object
          while (current) {
            if (!current.visible) return false
            current = current.parent
          }
          return true
        })
        structures.push(projectPoint(structure.id, center.getCenter(new THREE.Vector3()), rendered))
      })
      const projectedFindings = [...findingObjects].flatMap(([id, group]) => {
        if (!group.visible) return []
        const bounds = new THREE.Box3().setFromObject(group)
        if (bounds.isEmpty()) return []
        return [projectPoint(id, bounds.getCenter(new THREE.Vector3()), true)]
      })
      const markers =
        marker && markerId
          ? [projectPoint(markerId, marker.getWorldPosition(new THREE.Vector3()), true)]
          : []

      const context = renderer.getContext()
      const debugInfo = context.getExtension('WEBGL_debug_renderer_info')
      const sortedFrameTimes = [...frameTimes].sort((left, right) => left - right)
      const medianFrameMs = sortedFrameTimes.length
        ? sortedFrameTimes[Math.floor(sortedFrameTimes.length / 2)]!
        : null
      return {
        structures,
        findings: projectedFindings,
        markers,
        renderer: {
          webglVersion: renderer.capabilities.isWebGL2 ? 2 : 1,
          renderer: String(context.getParameter(context.RENDERER)),
          vendor: String(context.getParameter(context.VENDOR)),
          unmaskedRenderer: debugInfo
            ? String(context.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL))
            : null,
          unmaskedVendor: debugInfo
            ? String(context.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL))
            : null,
        },
        performance: {
          medianFrameMs,
          medianFps: medianFrameMs === null ? null : 1_000 / medianFrameMs,
          sampleCount: sortedFrameTimes.length,
        },
      }
    },

    loseContext() {
      if (!contextLossExtension) return false
      contextLossExtension.loseContext()
      return true
    },

    restoreContext() {
      if (!contextLossExtension) return false
      contextLossExtension.restoreContext()
      return true
    },

    dispose() {
      if (disposed) return
      disposed = true
      tween = null
      renderer.setAnimationLoop(null)
      controls.removeEventListener('end', notifyViewChanged)
      controls.dispose()
      renderer.domElement.removeEventListener('webglcontextlost', handleContextLost)
      renderer.domElement.removeEventListener('webglcontextrestored', handleContextRestored)
      resizeObserver?.disconnect()
      window.removeEventListener('resize', resize)
      releaseModel()
      renderer.renderLists.dispose()
      renderer.dispose()
      renderer.forceContextLoss()
      renderer.domElement.remove()
    },
  }

  return controller
}
