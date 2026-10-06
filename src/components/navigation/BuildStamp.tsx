const buildId = import.meta.env.VITE_BUILD_ID?.trim() || 'development'

export function BuildStamp() {
  return (
    <footer className="mx-auto w-full max-w-6xl px-4 pb-4 text-right sm:px-6">
      <p className="text-caption text-neutral-500" title="Application build identifier">
        Build {buildId}
      </p>
    </footer>
  )
}
