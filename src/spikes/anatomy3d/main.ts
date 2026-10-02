import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js'

declare global {
  interface Window {
    anatomySpikeMetrics?: {
      firstFrameMs: number
      averageFps: number
      renderedFrames: number
      rendererMemory: {
        geometries: number
        textures: number
      }
      meshNames: string[]
    }
  }
}

const canvas = document.querySelector('canvas')
const output = document.querySelector('output')
const overviewButton = document.querySelector<HTMLButtonElement>('#overview')
const endoscopicButton = document.querySelector<HTMLButtonElement>('#endoscopic')

if (!canvas || !output || !overviewButton || !endoscopicButton) {
  throw new Error('Spike page is missing required controls.')
}

const startedAt = performance.now()
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5))
renderer.setClearColor(0x13171f, 1)
renderer.outputColorSpace = THREE.SRGBColorSpace

const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(42, 1, 0.01, 100)
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

scene.add(new THREE.HemisphereLight(0xffffff, 0x5c4acf, 2.4))
const keyLight = new THREE.DirectionalLight(0xffffff, 3.2)
keyLight.position.set(3, 5, 4)
scene.add(keyLight)

const resize = () => {
  const width = Math.max(canvas.clientWidth, 1)
  const height = Math.max(canvas.clientHeight, 1)
  renderer.setSize(width, height, false)
  camera.aspect = width / height
  camera.updateProjectionMatrix()
}

new ResizeObserver(resize).observe(canvas)
resize()

const loader = new GLTFLoader()
loader.setMeshoptDecoder(MeshoptDecoder)
const gltf = await loader.loadAsync('/assets/bodyparts-respiratory.glb')
const model = gltf.scene
scene.add(model)

const bounds = new THREE.Box3().setFromObject(model)
const center = bounds.getCenter(new THREE.Vector3())
const size = bounds.getSize(new THREE.Vector3())
const scale = 3 / Math.max(size.x, size.y, size.z)
model.scale.setScalar(scale)
model.position.copy(center).multiplyScalar(-scale)
model.updateMatrixWorld(true)

const meshNames: string[] = []
model.traverse((object) => {
  if (!(object instanceof THREE.Mesh)) return
  meshNames.push(object.name)
  const material = object.material
  const materials = Array.isArray(material) ? material : [material]
  for (const item of materials) {
    item.side = THREE.DoubleSide
    item.needsUpdate = true
  }
})

const setOverview = () => {
  camera.position.set(0, 0.2, 4.7)
  controls.target.set(0, 0, 0)
  camera.near = 0.01
  camera.updateProjectionMatrix()
  controls.enabled = true
  controls.update()
}

const setEndoscopic = () => {
  controls.enabled = false
  camera.position.set(0, 0, 1.05)
  camera.lookAt(0, 0, 0.7)
  camera.near = 0.002
  camera.updateProjectionMatrix()
}

overviewButton.addEventListener('click', setOverview)
endoscopicButton.addEventListener('click', setEndoscopic)
setOverview()

const sampledFrames: number[] = []
let previousFrame = performance.now()
let firstFrameMs = 0

const render = (now: number) => {
  if (controls.enabled) controls.update()
  renderer.render(scene, camera)
  if (firstFrameMs === 0) firstFrameMs = now - startedAt
  const delta = now - previousFrame
  previousFrame = now
  if (delta > 0 && sampledFrames.length < 180) sampledFrames.push(1000 / delta)

  const averageFps =
    sampledFrames.length === 0
      ? 0
      : sampledFrames.reduce((total, value) => total + value, 0) / sampledFrames.length
  window.anatomySpikeMetrics = {
    firstFrameMs: Math.round(firstFrameMs),
    averageFps: Math.round(averageFps * 10) / 10,
    renderedFrames: sampledFrames.length,
    rendererMemory: {
      geometries: renderer.info.memory.geometries,
      textures: renderer.info.memory.textures,
    },
    meshNames,
  }
  output.value = `First frame ${Math.round(firstFrameMs)} ms · ${averageFps.toFixed(1)} fps · ${meshNames.length} structures`
  requestAnimationFrame(render)
}

requestAnimationFrame(render)
