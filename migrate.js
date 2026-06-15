const fs = require('fs'),
  path = require('path')
const dir = '/home/teo/Saulche'
const shared = ['js/audio.js', 'js/save.js', 'js/canvas.js', 'js/particles.js', 'js/grizzy.js']
const reScript = /<script[\s>]/
const reAudioBlock =
  /(let|var)\s+actx\s*=\s*null;\s*\n?\s*function\s+(getCtx|getAudio|sfx|tone)\s*\(/
const reRoundRect =
  /if\s*\(!\s*CanvasRenderingContext2D\s*\.\s*prototype\s*\.\s*roundRect\s*\)\s*\{?\s*\n?\s*CanvasRenderingContext2D\s*\.\s*prototype\s*\.\s*roundRect\s*=\s*function\s*\(/
const reDrawGrizzy = /(function\s+drawGrizzy|function\s+drawBear)/
const reParticles = /(let\s+pfx\s*=\s*\[\]\s*;?\s*\n?\s*function\s+part\s*\()/
const ignoreFiles = ['index.html', 'migrate.js', 'manifest.json', 'service-worker.js']

const files = fs.readdirSync(dir).filter((f) => f.endsWith('.html') && !ignoreFiles.includes(f))
console.log('Found ' + files.length + ' game files to process')

let stats = { audio: 0, roundrect: 0, grizzy: 0, particles: 0 }

files.forEach(function (file) {
  const fp = path.join(dir, file)
  let html = fs.readFileSync(fp, 'utf8')
  let headEnd = html.indexOf('</head>')
  if (headEnd === -1) {
    console.log('SKIP ' + file + ': no </head>')
    return
  }

  let imports = '\n'
  shared.forEach(function (s) {
    imports += '<script src="' + s + '"></script>\n'
  })
  imports += ''

  var mod = html.slice(0, headEnd) + imports + html.slice(headEnd)

  if (reAudioBlock.test(html)) stats.audio++
  if (reRoundRect.test(html)) stats.roundrect++
  if (reDrawGrizzy.test(html)) stats.grizzy++
  if (reParticles.test(html)) stats.particles++

  if (mod !== html) {
    fs.writeFileSync(fp, mod, 'utf8')
    console.log('PATCH ' + file)
  } else {
    console.log('OK   ' + file + ' (no changes needed)')
  }
})

console.log('\nStats for extracted shared patterns:')
console.log(JSON.stringify(stats, null, 1))
console.log('\nDone! Files with matching patterns can be refactored to use shared modules.')
