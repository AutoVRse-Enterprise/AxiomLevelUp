import { useEffect, useRef, useState } from 'react'

export function useImmersiveArtifact<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [immersive, setImmersive] = useState(false)

  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) setImmersive(false)
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  const toggle = async () => {
    if (immersive) {
      if (document.fullscreenElement) await document.exitFullscreen()
      setImmersive(false)
      return
    }
    setImmersive(true)
    try {
      await ref.current?.requestFullscreen?.()
    } catch {
      // The fixed overlay is the fallback where Fullscreen API is unavailable.
    }
  }

  return { ref, immersive, toggle }
}
