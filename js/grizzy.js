;(function () {
  window.drawGrizzy = function (ctx, w, h) {
    w = w || 80
    h = h || 80
    ctx.clearRect(0, 0, w, h)
    var cx = w / 2,
      cy = h / 2
    var s = Math.min(w, h) / 80

    function a(x, y, r) {
      ctx.beginPath()
      ctx.arc(cx + x * s, cy + y * s, r * s, 0, Math.PI * 2)
      ctx.fill()
    }

    function e(x, y, rx, ry) {
      ctx.beginPath()
      ctx.ellipse(cx + x * s, cy + y * s, rx * s, ry * s, 0, 0, Math.PI * 2)
      ctx.fill()
    }

    // Body / shoulders
    ctx.fillStyle = '#8B5E3C'
    e(0, 24, 26, 22)

    // Sweater / honey pot body
    ctx.fillStyle = '#FFC107'
    if (ctx.roundRect) {
      ctx.beginPath()
      ctx.roundRect(cx - 16, cy + 12, 32 * s, 26 * s, 4 * s)
      ctx.fill()
    } else {
      ctx.fillRect(cx - 16, cy + 12, 32 * s, 26 * s)
    }

    // Sweater stripe
    ctx.fillStyle = '#FF9800'
    ctx.fillRect(cx - 16, cy + 16, 32 * s, 4 * s)

    // Sweater shine
    ctx.fillStyle = 'rgba(255,255,255,0.25)'
    ctx.fillRect(cx - 10, cy + 20, 5 * s, 8 * s)

    // Head
    ctx.fillStyle = '#8B5E3C'
    e(0, -10, 22, 24)

    // Cheeks (lighter)
    ctx.fillStyle = '#A67C52'
    e(0, -4, 14, 16)

    // Ears
    ctx.fillStyle = '#6B4226'
    a(-17, -30, 8)
    a(17, -30, 8)

    // Inner ears
    ctx.fillStyle = '#C49A6C'
    a(-17, -30, 4.5)
    a(17, -30, 4.5)

    // Forehead tuft
    ctx.fillStyle = '#6B4226'
    a(0, -31, 4)

    // Eyes - white
    ctx.fillStyle = '#FFF'
    a(-9, -14, 5)
    a(9, -14, 5)

    // Eyes - pupil
    ctx.fillStyle = '#2D1B0E'
    a(-8, -13, 2.8)
    a(10, -13, 2.8)

    // Eyes - highlight
    ctx.fillStyle = '#FFF'
    a(-7, -15, 1.2)
    a(11, -15, 1.2)

    // Eyebrows
    ctx.strokeStyle = '#5A3A1A'
    ctx.lineWidth = 2 * s
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(cx - 18, cy - 22)
    ctx.quadraticCurveTo(cx - 10, cy - 26, cx - 4, cy - 22)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(cx + 18, cy - 22)
    ctx.quadraticCurveTo(cx + 10, cy - 26, cx + 4, cy - 22)
    ctx.stroke()

    // Nose
    ctx.fillStyle = '#3E2723'
    e(0, -3, 4, 3)

    // Nose highlight
    ctx.fillStyle = 'rgba(255,255,255,0.2)'
    e(-1, -4, 1.5, 1)

    // Mouth - smile
    ctx.strokeStyle = '#3E2723'
    ctx.lineWidth = 1.5 * s
    ctx.beginPath()
    ctx.arc(cx, cy - 1, 6 * s, 0.15, Math.PI - 0.15)
    ctx.stroke()

    // Cheek blush
    ctx.fillStyle = 'rgba(255,150,150,0.2)'
    a(-16, -5, 5)
    a(16, -5, 5)
  }
})()
