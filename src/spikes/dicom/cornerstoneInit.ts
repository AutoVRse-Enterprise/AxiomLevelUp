import { cache, init as coreInit } from '@cornerstonejs/core'
import { init as dicomImageLoaderInit } from '@cornerstonejs/dicom-image-loader'
import {
  addTool,
  init as toolsInit,
  LengthTool,
  PanTool,
  StackScrollTool,
  WindowLevelTool,
  ZoomTool,
} from '@cornerstonejs/tools'

let initialization: Promise<void> | null = null

export function initializeCornerstone() {
  if (initialization) return initialization

  initialization = Promise.resolve().then(async () => {
    await coreInit()
    await toolsInit()
    dicomImageLoaderInit({
      maxWebWorkers: 1,
      useLegacyMetadataProvider: true,
    })
    const tools = [StackScrollTool, ZoomTool, PanTool, WindowLevelTool, LengthTool]
    tools.forEach((tool) => addTool(tool))
    cache.setMaxCacheSize(256 * 1024 * 1024)
  })

  return initialization
}
