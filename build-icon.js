'use strict'
/* Build AppIcon.png (1024) + AppIcon.icns from the official DSH favicon.
   Renders the logo mark on a dark squircle via @resvg/resvg-js, then packs
   the PNG into a minimal .icns (ic10 chunk) — no iconutil needed. */

const fs = require('node:fs')
const { Resvg } = require('@resvg/resvg-js')

const OUT = '/tmp/dsh-app-build/icon'
const svg = fs.readFileSync(`${OUT}/favicon.svg`, 'utf8')
const m = svg.match(/<path[^>]*\sd="([^"]+)"/)
if (!m) throw new Error('no path found in favicon.svg')
const d = m[1]

const S = 1024
const combined = `<svg width="${S}" height="${S}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#17334f"/>
      <stop offset="1" stop-color="#0a1322"/>
    </linearGradient>
  </defs>
  <rect width="${S}" height="${S}" rx="228" fill="url(#bg)"/>
  <g transform="translate(270 270) scale(9.8)">
    <path d="${d}" fill="#eaf6ff"/>
  </g>
</svg>`

const resvg = new Resvg(combined, { fitTo: { mode: 'width', value: S } })
const png = resvg.render().asPng()
fs.writeFileSync(`${OUT}/AppIcon.png`, png)
console.log('AppIcon.png', png.length, 'bytes')

const u32 = (n) => {
  const b = Buffer.alloc(4)
  b.writeUInt32BE(n, 0)
  return b
}
const ic10 = Buffer.concat([Buffer.from('ic10'), u32(8 + png.length), png])
const icns = Buffer.concat([Buffer.from('icns'), u32(8 + ic10.length), ic10])
fs.writeFileSync(`${OUT}/AppIcon.icns`, icns)
console.log('AppIcon.icns', icns.length, 'bytes')
