import { del, get, set } from 'idb-keyval'
import type { StateStorage } from 'zustand/middleware'

import { activeExperienceId, storagePrefixFor } from '@/lib/experience'

const prefix = storagePrefixFor(activeExperienceId)

export const idbStorage: StateStorage = {
  async getItem(name) {
    return (await get<string>(`${prefix}${name}`)) ?? null
  },
  async setItem(name, value) {
    try {
      await set(`${prefix}${name}`, value)
    } catch (error) {
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        throw new Error('Browser storage is full. Remove an offline course and try again.', {
          cause: error,
        })
      }
      throw error
    }
  },
  async removeItem(name) {
    await del(`${prefix}${name}`)
  },
}
