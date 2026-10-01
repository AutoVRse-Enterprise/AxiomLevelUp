import { createReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'
import { createServer } from 'node:http'
import { extname, resolve, sep } from 'node:path'
import { URL } from 'node:url'

const root = resolve(process.argv[2] ?? 'public/assets/dicom')
const port = Number(process.argv[3] ?? 4174)
const contentTypes = {
  '.dcm': 'application/dicom',
  '.json': 'application/json; charset=utf-8',
}

createServer(async (request, response) => {
  response.setHeader('Access-Control-Allow-Origin', '*')
  response.setHeader('Access-Control-Expose-Headers', 'Content-Length, Content-Type')
  response.setHeader('Cache-Control', 'public, max-age=3600')
  if (request.method === 'OPTIONS') {
    response.writeHead(204, {
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    })
    response.end()
    return
  }

  try {
    const pathname = decodeURIComponent(new URL(request.url ?? '/', 'http://localhost').pathname)
    const file = resolve(root, `.${pathname}`)
    if (file !== root && !file.startsWith(`${root}${sep}`)) throw new Error('Invalid path')
    const details = await stat(file)
    if (!details.isFile()) throw new Error('Not a file')
    response.writeHead(200, {
      'Content-Type': contentTypes[extname(file)] ?? 'application/octet-stream',
      'Content-Length': details.size,
    })
    if (request.method === 'HEAD') response.end()
    else createReadStream(file).pipe(response)
  } catch {
    response.writeHead(404)
    response.end('Not found')
  }
}).listen(port, () => {
  console.log(`Serving ${root} with CORS at http://localhost:${port}/`)
})
