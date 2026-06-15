const fs = require('fs'),
  path = require('path')
const dir = '/home/teo/Saulche'
const ignore = ['index.html', 'migrate.js', 'extract.js', 'manifest.json', 'service-worker.js']
const files = fs.readdirSync(dir).filter((f) => f.endsWith('.html') && !ignore.includes(f))

var totalSaved = 0

files.forEach(function (file) {
  var fp = path.join(dir, file)
  var html = fs.readFileSync(fp, 'utf8')
  var original = html
  var changes = []

  // 1) Remove roundRect polyfill
  var rr1 = html.indexOf('if(!CanvasRenderingContext2D.prototype.roundRect)')
  var rr2 = html.indexOf('if (!CanvasRenderingContext2D.prototype.roundRect)')
  var rrIdx = rr1 !== -1 ? rr1 : rr2
  while (rrIdx !== -1) {
    var end = html.indexOf('return this', rrIdx)
    if (end === -1) end = html.indexOf('return this}', rrIdx)
    if (end !== -1) {
      var close = html.indexOf('}', end + 10)
      if (close !== -1) {
        var before = html.length
        html = html.slice(0, rrIdx) + html.slice(close + 1)
        var saved = before - html.length
        changes.push('roundRect polyfill')
        totalSaved += saved
        rrIdx = html.indexOf('if(!CanvasRenderingContext2D.prototype.roundRect)')
        if (rrIdx === -1) rrIdx = html.indexOf('if (!CanvasRenderingContext2D.prototype.roundRect)')
      } else break
    } else break
  }

  // 2) Remove drawGrizzy standard function (the one in tetris style)
  var idx = html.indexOf('function drawGrizzy(')
  if (idx !== -1) {
    // Check if it has the standard bear drawing (ellipse, arc patterns)
    if (html.indexOf('ctx.ellipse(cx,cy+8,22,25', idx) !== -1) {
      var brace = html.indexOf('{', idx)
      if (brace !== -1) {
        var depth = 1,
          pos = brace + 1
        while (depth > 0 && pos < html.length) {
          if (html[pos] === '{') depth++
          if (html[pos] === '}') depth--
          pos++
        }
        var before = html.length
        html = html.slice(0, idx) + html.slice(pos)
        changes.push('drawGrizzy()')
        totalSaved += before - html.length
      }
    }
  }

  // 3) Remove standard roundRect helper function (not polyfill)
  var fnIdx = html.indexOf('function roundRect(ctx,x,y,w,h,r){')
  if (fnIdx === -1) fnIdx = html.indexOf('function roundRect(ctx, x, y, w, h, r){')
  if (fnIdx !== -1) {
    var brace = html.indexOf('{', fnIdx)
    if (brace !== -1) {
      var depth = 1,
        pos = brace + 1
      while (depth > 0 && pos < html.length) {
        if (html[pos] === '{') depth++
        if (html[pos] === '}') depth--
        pos++
      }
      var before = html.length
      html = html.slice(0, fnIdx) + html.slice(pos)
      changes.push('roundRect helper')
      totalSaved += before - html.length
    }
  }

  if (html !== original) {
    fs.writeFileSync(fp, html, 'utf8')
    console.log(file + ': ' + changes.join(', '))
  } else {
    console.log(file + ': no changes')
  }
})

console.log('\nTotal saved: ' + totalSaved + ' bytes')
