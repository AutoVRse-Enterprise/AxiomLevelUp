import { Buffer } from 'node:buffer'
import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const output = resolve(root, 'public/assets/media/showcase')
const durationSeconds = 24
const fontPath = [
  'C:/Windows/Fonts/arial.ttf',
  '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
  '/System/Library/Fonts/Helvetica.ttc',
].find(existsSync)
if (!fontPath) throw new Error('A TrueType font is required to render fixture titles.')
const ffmpegFontPath = fontPath.replaceAll('\\', '/').replace(':', '\\:')
const titleFilter = [
  'drawbox=x=0:y=0:w=iw:h=ih:color=0x0f766e:t=fill',
  `drawtext=fontfile='${ffmpegFontPath}':text='Axiom Media Fixture':fontcolor=white:fontsize=34:x=(w-text_w)/2:y=(h-text_h)/2-28`,
  `drawtext=fontfile='${ffmpegFontPath}':text='Synthetic - 24 seconds':fontcolor=0xccfbf1:fontsize=21:x=(w-text_w)/2:y=(h-text_h)/2+24`,
].join(',')

function runFfmpeg(args) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args], {
      stdio: 'inherit',
    })
    child.once('error', reject)
    child.once('exit', (code) => {
      if (code === 0) resolvePromise()
      else reject(new Error(`ffmpeg exited with code ${code}`))
    })
  })
}

function createPdf() {
  const pageContent =
    'BT\n/F1 20 Tf\n72 700 Td\n(Axiom Synthetic Reference) Tj\n/F1 12 Tf\n0 -34 Td\n(Generated locally for runtime testing. No external source material.) Tj\n0 -24 Td\n(Page 1) Tj\nET'
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>',
    `<< /Length ${Buffer.byteLength(pageContent)} >>\nstream\n${pageContent}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ]
  let document = '%PDF-1.4\n'
  const offsets = [0]
  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(document))
    document += `${index + 1} 0 obj\n${object}\nendobj\n`
  })
  const xref = Buffer.byteLength(document)
  document += `xref\n0 ${objects.length + 1}\n0000000000 65535 f\n`
  document += offsets
    .slice(1)
    .map((offset) => `${String(offset).padStart(10, '0')} 00000 n\n`)
    .join('')
  document += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`
  return document
}

await mkdir(output, { recursive: true })

await runFfmpeg([
  '-f',
  'lavfi',
  '-i',
  `color=c=0x0f766e:s=640x360:r=24:d=${durationSeconds}`,
  '-f',
  'lavfi',
  '-i',
  `sine=frequency=440:sample_rate=48000:duration=${durationSeconds}`,
  '-vf',
  titleFilter,
  '-c:v',
  'libx264',
  '-preset',
  'slow',
  '-crf',
  '32',
  '-pix_fmt',
  'yuv420p',
  '-c:a',
  'aac',
  '-b:a',
  '64k',
  '-shortest',
  '-movflags',
  '+faststart',
  resolve(output, 'axiom-media-fixture.mp4'),
])

await runFfmpeg([
  '-f',
  'lavfi',
  '-i',
  'color=c=0x0f766e:s=640x360',
  '-vf',
  titleFilter,
  '-frames:v',
  '1',
  '-q:v',
  '3',
  resolve(output, 'axiom-media-poster.jpg'),
])

await runFfmpeg([
  '-f',
  'lavfi',
  '-i',
  `sine=frequency=523.25:sample_rate=48000:duration=${durationSeconds}`,
  '-c:a',
  'aac',
  '-b:a',
  '64k',
  '-metadata',
  'title=Axiom Synthetic Audio Fixture',
  resolve(output, 'axiom-audio-fixture.m4a'),
])

await writeFile(resolve(output, 'axiom-reference-fixture.pdf'), createPdf(), 'binary')

console.log(`Generated synthetic media fixtures in ${output}`)
