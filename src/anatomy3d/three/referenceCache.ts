export interface CacheLease<T> {
  value: T
  release(): void
}

interface CacheEntry<T> {
  promise: Promise<T>
  references: number
  dispose: (value: T) => void
}

export class ReferenceCountedCache<T> {
  private readonly entries = new Map<string, CacheEntry<T>>()

  async acquire(key: string, load: () => Promise<T>, dispose: (value: T) => void) {
    let entry = this.entries.get(key)
    if (!entry) {
      entry = { promise: load(), references: 0, dispose }
      this.entries.set(key, entry)
      void entry.promise.catch(() => {
        if (this.entries.get(key) === entry) this.entries.delete(key)
      })
    }
    entry.references += 1

    try {
      const value = await entry.promise
      let released = false
      return {
        value,
        release: () => {
          if (released) return
          released = true
          this.release(key, entry!)
        },
      } satisfies CacheLease<T>
    } catch (error) {
      this.release(key, entry)
      throw error
    }
  }

  private release(key: string, entry: CacheEntry<T>) {
    entry.references -= 1
    if (entry.references > 0 || this.entries.get(key) !== entry) return
    this.entries.delete(key)
    void entry.promise.then(entry.dispose, () => undefined)
  }

  size() {
    return this.entries.size
  }
}
