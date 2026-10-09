import { createReadStream, existsSync, statSync } from 'node:fs'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { extname, relative, resolve, sep } from 'node:path'

import type { Connect, Plugin } from 'vite'

const mimeTypes: Record<string, string> = {
  '.json': 'application/json',
  '.dcm': 'application/dicom',
}

export function serveRuntimeDicomPlugin(root: string, experienceId: string): Plugin | null {
  if (experienceId !== 'sanofi') return null
  const dicomRoot = resolve(root, 'public/assets/dicom')

  const middleware: Connect.NextHandleFunction = (
    req: IncomingMessage,
    res: ServerResponse,
    next,
  ) => {
    const url = req.url?.split('?')[0] ?? ''
    if (!url.startsWith('/assets/dicom/')) {
      next()
      return
    }
    const relativePath = decodeURIComponent(url.slice('/assets/dicom/'.length))
    if (!relativePath || relativePath.includes('\0')) {
      next()
      return
    }
    const file = resolve(dicomRoot, relativePath.split('/').join(sep))
    const fromRoot = relative(dicomRoot, file)
    if (!fromRoot || fromRoot.startsWith('..') || fromRoot.includes(`..${sep}`)) {
      next()
      return
    }
    if (!existsSync(file) || statSync(file).isDirectory()) {
      next()
      return
    }
    const stats = statSync(file)
    const type = mimeTypes[extname(file).toLowerCase()] ?? 'application/octet-stream'
    res.setHeader('Content-Type', type)
    res.setHeader('Accept-Ranges', 'bytes')
    const range = req.headers.range
    const match = range ? /^bytes=(\d*)-(\d*)$/.exec(range) : null
    if (match) {
      const start = match[1] ? Number(match[1]) : 0
      const end = match[2] ? Number(match[2]) : stats.size - 1
      if (Number.isInteger(start) && Number.isInteger(end) && start <= end && end < stats.size) {
        res.statusCode = 206
        res.setHeader('Content-Range', `bytes ${start}-${end}/${stats.size}`)
        res.setHeader('Content-Length', String(end - start + 1))
        createReadStream(file, { start, end }).pipe(res)
        return
      }
    }
    res.setHeader('Content-Length', String(stats.size))
    createReadStream(file).pipe(res)
  }

  return {
    name: 'serve-runtime-dicom',
    configurePreviewServer(server) {
      server.middlewares.use(middleware)
    },
  }
}
