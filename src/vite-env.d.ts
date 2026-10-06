/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

import type { AnatomyTestBridge } from '@/anatomy3d/viewer/controller'

declare global {
  interface ImportMetaEnv {
    readonly VITE_BUILD_ID?: string
    readonly VITE_EXPERIENCE?: 'default' | 'sanofi'
    readonly VITE_E2E?: string
    readonly VITE_ENABLE_DEV_TOOLS?: string
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv
  }

  interface Window {
    __anatomyTest?: AnatomyTestBridge
  }
}
