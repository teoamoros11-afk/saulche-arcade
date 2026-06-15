;(function () {
  window.ParticleSystem = function () {
    this.particles = []
  }
  ParticleSystem.prototype.add = function (x, y, opts) {
    opts = opts || {}
    var count = opts.count || 8,
      color = opts.color || '#FFC107'
    for (var i = 0; i < count; i++) {
      this.particles.push({
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * (opts.speed || 6),
        vy: (Math.random() - 0.5) * (opts.speed || 6) - (opts.gravity ? 0 : 3),
        life: (opts.life || 30) + Math.random() * (opts.lifeVar || 20),
        maxLife: (opts.life || 30) + (opts.lifeVar || 20),
        color: color,
        r: (opts.minR || 2) + Math.random() * (opts.maxR || 4),
      })
    }
  }
  ParticleSystem.prototype.update = function (ctx) {
    for (var i = this.particles.length - 1; i >= 0; i--) {
      var p = this.particles[i]
      p.x += p.vx
      p.y += p.vy
      p.vy += 0.12
      p.life--
      if (p.life <= 0) {
        this.particles.splice(i, 1)
        continue
      }
      if (ctx) {
        ctx.save()
        ctx.globalAlpha = Math.max(0, p.life / p.maxLife)
        ctx.fillStyle = p.color
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      }
    }
  }
  window.createLeaves = function (ctx, w, h, count) {
    count = count || 30
    var leaves = []
    function init() {
      leaves = []
      for (var i = 0; i < count; i++)
        leaves.push({
          x: Math.random() * w,
          y: Math.random() * h,
          s: 4 + Math.random() * 6,
          vy: 0.3 + Math.random() * 0.5,
          vx: -0.3 + Math.random() * 0.3,
          rot: Math.random() * Math.PI * 2,
          dr: 0.01 + Math.random() * 0.02,
          color: ['#4CAF50', '#FF9800', '#8B5E3C', '#FFC107', '#6B4226'][
            Math.floor(Math.random() * 5)
          ],
          a: 0.2 + Math.random() * 0.3,
        })
    }
    init()
    function draw() {
      ctx.clearRect(0, 0, w, h)
      for (var i = 0; i < leaves.length; i++) {
        var l = leaves[i]
        l.x += l.vx
        l.y += l.vy
        l.rot += l.dr
        if (l.y > h + 20) {
          l.y = -20
          l.x = Math.random() * w
        }
        if (l.x < -20) l.x = w + 20
        if (l.x > w + 20) l.x = -20
        ctx.save()
        ctx.translate(l.x, l.y)
        ctx.rotate(l.rot)
        ctx.globalAlpha = l.a
        ctx.fillStyle = l.color
        ctx.beginPath()
        ctx.ellipse(0, 0, l.s, l.s * 0.5, 0, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      }
    }
    return {
      draw: draw,
      resize: function (nw, nh) {
        w = nw
        h = nh
        init()
      },
    }
  }
})()
