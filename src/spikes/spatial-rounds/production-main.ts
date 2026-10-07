import appConfigDocument from '../../../public/experiences/sanofi/content/app-config.json'
import anatomyMapDocument from '../../../public/experiences/sanofi/content/anatomy/respiratory-game-map.json'

import { createAnatomyController } from '@/anatomy3d/three/createAnatomyController'
import type { AnatomyTestSnapshot } from '@/anatomy3d/viewer/controller'
import { anatomyMapSchema, appConfigSchema } from '@/content/schema'

declare global {
  interface Window {
    spatialCueSnapshot?: AnatomyTestSnapshot
  }
}

const element = document.querySelector<HTMLDivElement>('#viewer')
const output = document.querySelector<HTMLOutputElement>('output')
if (!element || !output) throw new Error('Production cue harness is incomplete.')

const config = appConfigSchema.parse(appConfigDocument).product.anatomy3d
const map = anatomyMapSchema.parse(anatomyMapDocument)
const controller = createAnatomyController({ element, config })
const result = await controller.load('/assets/models/lung-map/model.glb', map)
controller.enterEndoscopic('right-main-airway')

window.setInterval(() => {
  const snapshot = controller.getTestSnapshot()
  window.spatialCueSnapshot = snapshot
  output.value = `${result.triangleCount} model triangles · ${snapshot.performance.medianFps?.toFixed(1) ?? 'collecting'} fps · ${snapshot.performance.sampleCount} samples`
}, 250)
