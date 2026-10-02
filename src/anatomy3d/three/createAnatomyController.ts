import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js'

import type { AnatomyMap } from '@/content/schema/anatomyMap'
import type {
  AnatomyControllerConfig,
  AnatomyHighlightStyle,
  AnatomyLoadResult,
  AnatomyStartView,
  AnatomyViewerController,
  AnatomyViewState,
  CreateAnatomyControllerOptions,
} from '@/anatomy3d/viewer/controller'
import { ReferenceCountedCache, type CacheLease } from '@/anatomy3d/three/referenceCache'

interface MaterialState {
  color?: THREE.Color
  emissive?: THREE.Color
  opacity: number
  transparent: boolean
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
}: CreateAnatomyControllerOptions): AnatomyViewerController {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.setClearColor(config.backgroundColor, 1)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, config.pixelRatioCap))
  renderer.domElement.className = 'block h-full w-full'
  renderer.domElement.setAttribute('aria-hidden', 'true')
  element.replaceChildren(renderer.domElement)

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(42, 1, 0.001, 10_000)
  const controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.enablePan = true
  controls.enableRotate = true
  controls.enableZoom = true
  scene.add(new THREE.HemisphereLight(0xffffff, 0x5c4acf, 2.4))
  const keyLight = new THREE.DirectionalLight(0xffffff, 3.2)
  keyLight.position.set(3, 5, 4)
  scene.add(keyLight)

  const raycaster = new THREE.Raycaster()
  const pointer = new THREE.Vector2()
  const materialStates = new Map<THREE.Material, MaterialState>()
  let lease: CacheLease<THREE.Group> | null = null
  let model: THREE.Group | null = null
  let map: AnatomyMap | null = null
  let marker: THREE.Mesh | null = null
  let lumen: THREE.Group | null = null
  let overviewPosition = new THREE.Vector3(0, 0, 5)
  let overviewTarget = new THREE.Vector3()
  let currentWaypointId: string | null = null
  let endoscopic = false
  let tween: CameraTween | null = null
  let disposed = false

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
    if (tween) {
      const progress = Math.min(1, (time - tween.startedAt) / tween.duration)
      const eased = ease(progress, config.flyThroughEasing)
      camera.position.lerpVectors(tween.fromPosition, tween.toPosition, eased)
      controls.target.lerpVectors(tween.fromTarget, tween.toTarget, eased)
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
    if (!marker) return
    scene.remove(marker)
    marker.geometry.dispose()
    materialsOf(marker).forEach((material) => material.dispose())
    marker = null
  }

  const clearLumen = () => {
    if (!lumen) return
    scene.remove(lumen)
    disposeGeneratedGroup(lumen)
    lumen = null
  }

  const releaseModel = () => {
    clearMarker()
    clearLumen()
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
    const names = new Set(
      map.structures.find((structure) => structure.id === structureId)?.meshNames ?? [],
    )
    const meshes: THREE.Mesh[] = []
    model.traverse((object) => {
      if (object instanceof THREE.Mesh && names.has(object.name)) meshes.push(object)
    })
    return meshes
  }

  const setCamera = (position: THREE.Vector3, target: THREE.Vector3) => {
    tween = null
    camera.position.copy(position)
    controls.target.copy(target)
    camera.lookAt(target)
    controls.update()
    notifyViewChanged()
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
      camera.far = Math.max(radius * 20, 100)
      camera.updateProjectionMatrix()
      controls.minDistance = radius * 0.05
      controls.maxDistance = radius * 8
      controller.resetView()
      return { meshNames, triangleCount }
    },

    setStartView(view: AnatomyStartView) {
      if (view.mode === 'overview') controller.resetView()
      else if (view.mode === 'marker') {
        controller.resetView()
        controller.setMarker(view.structureId)
      } else if (view.mode === 'waypoint') {
        controller.flyTo(view.waypointId, { animate: false })
      } else {
        controller.enterEndoscopic(view.waypointId)
      }
    },

    pick(clientX, clientY) {
      if (!model || !map || !model.visible) return null
      const rect = renderer.domElement.getBoundingClientRect()
      if (rect.width === 0 || rect.height === 0) return null
      pointer.set(
        ((clientX - rect.left) / rect.width) * 2 - 1,
        -((clientY - rect.top) / rect.height) * 2 + 1,
      )
      raycaster.setFromCamera(pointer, camera)
      const hit = raycaster.intersectObject(model, true)[0]?.object
      if (!hit) return null
      let current: THREE.Object3D | null = hit
      while (current && current !== model) {
        const structure = map.structures.find(({ meshNames }) => meshNames.includes(current!.name))
        if (structure) return structure.id
        current = current.parent
      }
      return null
    },

    highlight(structureIds, style: AnatomyHighlightStyle) {
      materialStates.forEach((state, material) => {
        const candidate = material as THREE.Material & {
          color?: THREE.Color
          emissive?: THREE.Color
        }
        if (state.color && candidate.color) candidate.color.copy(state.color)
        if (state.emissive && candidate.emissive) candidate.emissive.copy(state.emissive)
        material.opacity = state.opacity
        material.transparent = state.transparent
        material.needsUpdate = true
      })
      const selected = new Set(structureIds)
      selected.forEach((id) => {
        meshForStructure(id).forEach((mesh) => {
          materialsOf(mesh).forEach((material) => {
            const candidate = material as THREE.Material & {
              color?: THREE.Color
              emissive?: THREE.Color
            }
            if (candidate.emissive) candidate.emissive.set(style.color)
            else candidate.color?.set(style.color)
            if (style.opacity !== undefined) {
              material.opacity = style.opacity
              material.transparent = style.opacity < 1
            }
            material.needsUpdate = true
          })
        })
      })
    },

    setMarker(structureId) {
      clearMarker()
      if (!structureId) return
      const meshes = meshForStructure(structureId)
      if (meshes.length === 0) return
      const bounds = new THREE.Box3()
      meshes.forEach((mesh) => bounds.expandByObject(mesh))
      const sphere = bounds.getBoundingSphere(new THREE.Sphere())
      marker = new THREE.Mesh(
        new THREE.SphereGeometry(Math.max(sphere.radius * 0.08, 0.01), 16, 12),
        new THREE.MeshBasicMaterial({ color: config.markerColor }),
      )
      marker.position.copy(sphere.center)
      scene.add(marker)
    },

    flyTo(waypointId, options = {}) {
      const waypoint = map?.waypoints.find(({ id }) => id === waypointId)
      if (!waypoint) return
      clearLumen()
      if (model) model.visible = true
      endoscopic = false
      currentWaypointId = waypointId
      controls.enabled = true
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

    enterEndoscopic(waypointId) {
      const waypoint = map?.waypoints.find(({ id }) => id === waypointId)
      if (!waypoint || !map) return
      clearLumen()
      lumen = new THREE.Group()
      const material = new THREE.MeshStandardMaterial({
        color: config.lumen.color,
        opacity: config.lumen.opacity,
        transparent: config.lumen.opacity < 1,
        roughness: 0.8,
        side: THREE.BackSide,
      })
      map.waypoints.forEach((from) => {
        const start = vector(from.position)
        const radius = from.radius ?? config.lumen.defaultRadius
        lumen!.add(
          new THREE.Mesh(
            new THREE.SphereGeometry(radius, config.lumen.radialSegments, 12),
            material.clone(),
          ),
        )
        const junction = lumen!.children.at(-1)!
        junction.position.copy(start)
        from.next.forEach((nextId) => {
          const next = map!.waypoints.find(({ id }) => id === nextId)
          if (!next) return
          const finish = vector(next.position)
          lumen!.add(
            new THREE.Mesh(
              new THREE.TubeGeometry(
                new THREE.LineCurve3(start, finish),
                config.lumen.tubularSegmentsPerConnection,
                (radius + (next.radius ?? config.lumen.defaultRadius)) / 2,
                config.lumen.radialSegments,
                false,
              ),
              material.clone(),
            ),
          )
        })
      })
      material.dispose()
      scene.add(lumen)
      if (model) model.visible = false
      endoscopic = true
      currentWaypointId = waypointId
      controls.enabled = false
      camera.near = Math.max((waypoint.radius ?? config.lumen.defaultRadius) / 100, 0.0001)
      camera.updateProjectionMatrix()
      setCamera(vector(waypoint.position), vector(waypoint.lookAt))
    },

    resetView() {
      clearLumen()
      if (model) model.visible = true
      endoscopic = false
      currentWaypointId = null
      controls.enabled = true
      setCamera(overviewPosition, overviewTarget)
    },

    dispose() {
      if (disposed) return
      disposed = true
      tween = null
      renderer.setAnimationLoop(null)
      controls.removeEventListener('end', notifyViewChanged)
      controls.dispose()
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
