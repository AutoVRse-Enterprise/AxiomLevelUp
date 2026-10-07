import * as THREE from 'three'

type Waypoint = {
  id: string
  label: string
  position: [number, number, number]
  lookAt: [number, number, number]
  radius: number
  next: string[]
  depth: number
}

const waypoints: Waypoint[] = [
  {
    id: 'trachea-mid',
    label: 'Trachea',
    position: [0, -48, 1280],
    lookAt: [0, -72, 1265],
    radius: 8,
    next: ['carina'],
    depth: 0,
  },
  {
    id: 'carina',
    label: 'Carina',
    position: [0, -72, 1265],
    lookAt: [-22, -90, 1248],
    radius: 7,
    next: ['right-main-airway', 'left-main-airway'],
    depth: 1,
  },
  {
    id: 'right-main-airway',
    label: 'Right main bronchus',
    position: [-22, -90, 1248],
    lookAt: [-45, -108, 1235],
    radius: 5.4,
    next: ['right-upper-airway', 'right-middle-airway', 'right-lower-airway'],
    depth: 2,
  },
  {
    id: 'left-main-airway',
    label: 'Left main bronchus',
    position: [22, -90, 1248],
    lookAt: [45, -108, 1235],
    radius: 4.8,
    next: ['left-upper-airway', 'left-lower-airway'],
    depth: 2,
  },
  {
    id: 'right-upper-airway',
    label: 'Right upper lobar airway',
    position: [-48, -103, 1280],
    lookAt: [-66, -112, 1302],
    radius: 3.5,
    next: ['right-upper-apical-airway'],
    depth: 3,
  },
  {
    id: 'right-upper-apical-airway',
    label: 'Right apical segmental airway',
    position: [-66, -92, 1307],
    lookAt: [-72, -72, 1340],
    radius: 2.3,
    next: [],
    depth: 4,
  },
  {
    id: 'right-middle-airway',
    label: 'Right middle lobar airway',
    position: [-43, -112, 1253],
    lookAt: [-58, -121, 1250],
    radius: 3.2,
    next: [],
    depth: 3,
  },
  {
    id: 'right-lower-airway',
    label: 'Right lower lobar airway',
    position: [-44, -118, 1222],
    lookAt: [-62, -140, 1195],
    radius: 3.5,
    next: ['right-lower-superior', 'right-lower-posterior'],
    depth: 3,
  },
  {
    id: 'right-lower-superior',
    label: 'Right superior segment',
    position: [-66, -136, 1228],
    lookAt: [-82, -151, 1238],
    radius: 2.4,
    next: [],
    depth: 4,
  },
  {
    id: 'right-lower-posterior',
    label: 'Right posterior basal segment',
    position: [-61, -151, 1182],
    lookAt: [-77, -171, 1161],
    radius: 2.3,
    next: [],
    depth: 4,
  },
  {
    id: 'left-upper-airway',
    label: 'Left upper lobar airway',
    position: [48, -103, 1280],
    lookAt: [66, -112, 1302],
    radius: 3.5,
    next: ['left-upper-apicoposterior'],
    depth: 3,
  },
  {
    id: 'left-upper-apicoposterior',
    label: 'Left apicoposterior segment',
    position: [64, -91, 1308],
    lookAt: [73, -72, 1338],
    radius: 2.3,
    next: [],
    depth: 4,
  },
  {
    id: 'left-lower-airway',
    label: 'Left lower lobar airway',
    position: [44, -118, 1222],
    lookAt: [62, -140, 1195],
    radius: 3.5,
    next: [],
    depth: 3,
  },
]

const candidates = [
  'trachea-mid',
  'carina',
  'right-main-airway',
  'left-main-airway',
  'right-lower-airway',
  'left-upper-airway',
]
const byId = new Map(waypoints.map((waypoint) => [waypoint.id, waypoint]))

function requiredElement<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector)
  if (!element) throw new Error(`Spatial spike page is missing ${selector}.`)
  return element
}

const canvas = requiredElement<HTMLCanvasElement>('canvas')
const output = requiredElement<HTMLOutputElement>('output')
const waypointSelect = requiredElement<HTMLSelectElement>('#waypoint')
const ridgeToggle = requiredElement<HTMLInputElement>('#ridge')
const ringsToggle = requiredElement<HTMLInputElement>('#rings')
const fogToggle = requiredElement<HTMLInputElement>('#fog')
const tintToggle = requiredElement<HTMLInputElement>('#depthTint')
const zoomIn = requiredElement<HTMLButtonElement>('#zoomIn')
const zoomOut = requiredElement<HTMLButtonElement>('#zoomOut')

for (const id of candidates) {
  const waypoint = byId.get(id)!
  const option = document.createElement('option')
  option.value = id
  option.textContent = waypoint.label
  waypointSelect.append(option)
}

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5))
renderer.setClearColor(0x170d12)
renderer.outputColorSpace = THREE.SRGBColorSpace
const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(42, 1, 0.05, 450)
const lumen = new THREE.Group()
scene.add(lumen)
const headlight = new THREE.PointLight(0xffe1d7, 8, 90)
camera.add(headlight)
scene.add(camera)

const toVector = ([x, y, z]: [number, number, number]) => new THREE.Vector3(x, y, z)
let yaw = 0
let pitch = 0
let baseDirection = new THREE.Vector3(0, 0, -1)
let active = byId.get(candidates[0]!)!
let pointer: { id: number; x: number; y: number } | null = null
let pinchDistance: number | null = null
const touches = new Map<number, THREE.Vector2>()

function disposeLumen() {
  for (const child of [...lumen.children]) {
    lumen.remove(child)
    child.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return
      object.geometry.dispose()
      const materials = Array.isArray(object.material) ? object.material : [object.material]
      materials.forEach((material) => material.dispose())
    })
  }
}

function wallColor(depth: number) {
  if (!tintToggle.checked) return 0xb7675c
  return [0xc77b70, 0xbc6b63, 0xac5a55, 0x95484b, 0x7d3d46][Math.min(depth, 4)]!
}

function addEdge(from: Waypoint, to: Waypoint) {
  const start = toVector(from.position)
  const finish = toVector(to.position)
  const mid = start.clone().lerp(finish, 0.5)
  mid.z += (from.depth % 2 === 0 ? 1 : -1) * start.distanceTo(finish) * 0.08
  const curve = new THREE.CatmullRomCurve3([start, mid, finish])
  const geometry = new THREE.TubeGeometry(curve, 18, Math.max(to.radius, 1.5), 18, false)
  const material = new THREE.MeshStandardMaterial({
    color: wallColor(from.depth),
    emissive: 0x321015,
    emissiveIntensity: 0.75,
    transparent: true,
    opacity: 0.62,
    depthWrite: false,
    roughness: 0.8,
    side: THREE.BackSide,
  })
  lumen.add(new THREE.Mesh(geometry, material))

  const opening = new THREE.Mesh(
    new THREE.CircleGeometry(Math.max(to.radius * 0.72, 1.1), 28),
    new THREE.MeshBasicMaterial({ color: 0x12080c, side: THREE.DoubleSide }),
  )
  opening.position.copy(finish)
  opening.quaternion.setFromUnitVectors(
    new THREE.Vector3(0, 0, 1),
    curve.getTangentAt(0.98).normalize(),
  )
  lumen.add(opening)

  if (ringsToggle.checked) {
    const ringCount = Math.max(2, 7 - from.depth)
    for (let index = 1; index <= ringCount; index += 1) {
      const t = index / (ringCount + 1)
      const center = curve.getPointAt(t)
      const tangent = curve.getTangentAt(t).normalize()
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(
          THREE.MathUtils.lerp(from.radius, to.radius, t) * 0.94,
          Math.max(from.radius * 0.035, 0.09),
          6,
          28,
        ),
        new THREE.MeshStandardMaterial({
          color: 0xd68b7f,
          emissive: 0x2c090d,
          side: THREE.DoubleSide,
        }),
      )
      ring.position.copy(center)
      ring.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), tangent)
      lumen.add(ring)
    }
  }
}

function rebuildLumen() {
  disposeLumen()
  for (const from of waypoints) {
    for (const nextId of from.next) {
      const next = byId.get(nextId)
      if (next) addEdge(from, next)
    }
  }
  if (ridgeToggle.checked) {
    const carina = byId.get('carina')!
    const ridge = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.38, 4.2, 5, 10),
      new THREE.MeshStandardMaterial({ color: 0xe7a39a, roughness: 0.65 }),
    )
    ridge.position.copy(toVector(carina.position)).add(new THREE.Vector3(0, -5, -2))
    ridge.rotation.z = Math.PI / 2
    lumen.add(ridge)
  }
}

function applyLook() {
  const direction = baseDirection.clone()
  const right = new THREE.Vector3().crossVectors(direction, new THREE.Vector3(0, 0, 1)).normalize()
  direction.applyAxisAngle(new THREE.Vector3(0, 0, 1), yaw)
  direction.applyAxisAngle(right.lengthSq() ? right : new THREE.Vector3(1, 0, 0), pitch)
  camera.lookAt(camera.position.clone().add(direction))
}

function setDrop(id: string) {
  active = byId.get(id) ?? active
  camera.position.copy(toVector(active.position))
  baseDirection = toVector(active.lookAt).sub(camera.position).normalize()
  camera.near = Math.max(0.03, active.radius * 0.015)
  camera.far = 450
  camera.fov = 42
  yaw = 0
  pitch = 0
  scene.fog = fogToggle.checked
    ? new THREE.Fog(wallColor(active.depth), active.radius * 3, active.radius * 32)
    : null
  camera.updateProjectionMatrix()
  applyLook()
}

function changeZoom(delta: number) {
  camera.fov = THREE.MathUtils.clamp(camera.fov + delta, 28, 64)
  camera.updateProjectionMatrix()
}

waypointSelect.addEventListener('change', () => setDrop(waypointSelect.value))
for (const toggle of [ridgeToggle, ringsToggle, tintToggle]) {
  toggle.addEventListener('change', () => {
    rebuildLumen()
    setDrop(active.id)
  })
}
fogToggle.addEventListener('change', () => setDrop(active.id))
zoomIn.addEventListener('click', () => changeZoom(-4))
zoomOut.addEventListener('click', () => changeZoom(4))
canvas.addEventListener('wheel', (event) => {
  event.preventDefault()
  changeZoom(Math.sign(event.deltaY) * 3)
})
canvas.addEventListener('pointerdown', (event) => {
  canvas.setPointerCapture(event.pointerId)
  touches.set(event.pointerId, new THREE.Vector2(event.clientX, event.clientY))
  pointer = { id: event.pointerId, x: event.clientX, y: event.clientY }
})
canvas.addEventListener('pointermove', (event) => {
  if (!touches.has(event.pointerId)) return
  touches.set(event.pointerId, new THREE.Vector2(event.clientX, event.clientY))
  if (touches.size === 2) {
    const [a, b] = [...touches.values()]
    const distance = a!.distanceTo(b!)
    if (pinchDistance !== null) changeZoom((pinchDistance - distance) * 0.08)
    pinchDistance = distance
    return
  }
  if (!pointer || pointer.id !== event.pointerId) return
  yaw = THREE.MathUtils.clamp(yaw - (event.clientX - pointer.x) * 0.004, -0.75, 0.75)
  pitch = THREE.MathUtils.clamp(pitch - (event.clientY - pointer.y) * 0.004, -0.55, 0.55)
  pointer = { id: event.pointerId, x: event.clientX, y: event.clientY }
  applyLook()
})
const releasePointer = (event: PointerEvent) => {
  touches.delete(event.pointerId)
  if (pointer?.id === event.pointerId) pointer = null
  if (touches.size < 2) pinchDistance = null
}
canvas.addEventListener('pointerup', releasePointer)
canvas.addEventListener('pointercancel', releasePointer)
window.addEventListener('keydown', (event) => {
  const step = 0.08
  if (event.key === 'ArrowLeft') yaw = Math.min(0.75, yaw + step)
  else if (event.key === 'ArrowRight') yaw = Math.max(-0.75, yaw - step)
  else if (event.key === 'ArrowUp') pitch = Math.min(0.55, pitch + step)
  else if (event.key === 'ArrowDown') pitch = Math.max(-0.55, pitch - step)
  else if (event.key === '+' || event.key === '=') changeZoom(-4)
  else if (event.key === '-') changeZoom(4)
  else return
  event.preventDefault()
  applyLook()
})

const resize = () => {
  const width = Math.max(canvas.clientWidth, 1)
  const height = Math.max(canvas.clientHeight, 1)
  renderer.setSize(width, height, false)
  camera.aspect = width / height
  camera.updateProjectionMatrix()
}
new ResizeObserver(resize).observe(canvas)
resize()
rebuildLumen()
setDrop(active.id)

let previous = performance.now()
const samples: number[] = []
function render(now: number) {
  renderer.render(scene, camera)
  const delta = now - previous
  previous = now
  if (delta > 0 && samples.length < 240) samples.push(1000 / delta)
  const average = samples.reduce((sum, fps) => sum + fps, 0) / Math.max(1, samples.length)
  output.value = `${active.label} · FOV ${Math.round(camera.fov)}° · ${average.toFixed(1)} fps · drag/look, wheel/pinch/+/− zoom`
  requestAnimationFrame(render)
}
requestAnimationFrame(render)
