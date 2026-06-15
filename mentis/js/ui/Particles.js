export class ParticleEngine {
  constructor(canvas) {
    this._canvas = canvas
    this._ctx = canvas?.getContext('2d')
    this._particles = []
    this._running = false
  }

  emit(x, y, count = 10, config = {}) {
    for (let i = 0; i < count; i++) {
      this._particles.push({
        x, y,
        vx: (Math.random() - 0.5) * (config.speed || 4),
        vy: (Math.random() - 0.5) * (config.speed || 4) - 2,
        life: config.life || 40 + Math.random() * 30,
        maxLife: config.life || 60,
        size: config.size || 2 + Math.random() * 3,
        color: config.color || this._randomColor(),
        type: config.type || 'circle',
        gravity: config.gravity ?? 0.08,
        fade: config.fade ?? true,
      })
    }
  }

  emitStar(x, y) { this.emit(x, y, 15, { color: '#ffd700', size: 3, speed: 5 }) }
  emitCorrect(x, y) { this.emit(x, y, 20, { color: '#4caf50', size: 4, speed: 6 }) }
  emitWrong(x, y) { this.emit(x, y, 8, { color: '#ef5350', size: 3, speed: 3 }) }
  emitLevelUp() {
    const cx = this._canvas?.width / 2 || 200
    const cy = this._canvas?.height / 2 || 200
    this.emit(cx, cy, 40, { color: '#ffd700', size: 5, speed: 8, life: 60 })
    this.emit(cx, cy, 20, { color: '#7c4dff', size: 4, speed: 6, life: 50 })
  }
  emitConfetti() {
    for (let i = 0; i < 60; i++) {
      this._particles.push({
        x: Math.random() * (this._canvas?.width || 400),
        y: -10 - Math.random() * 50,
        vx: (Math.random() - 0.5) * 3,
        vy: 1 + Math.random() * 2,
        life: 120 + Math.random() * 60,
        maxLife: 180,
        size: 4 + Math.random() * 4,
        color: ['#ffd700','#7c4dff','#448aff','#4caf50','#ef5350','#ff9800'][Math.floor(Math.random() * 6)],
        type: 'rect',
        gravity: 0.02,
        fade: true,
      })
    }
  }

  _randomColor() {
    return ['#ffd700','#7c4dff','#448aff','#4caf50','#00bcd4','#e91e63'][Math.floor(Math.random() * 6)]
  }

  update(dt) {
    for (let i = this._particles.length - 1; i >= 0; i--) {
      const p = this._particles[i]
      p.x += p.vx
      p.y += p.vy
      p.vy += p.gravity
      p.vx *= 0.98
      p.life--
      if (p.life <= 0 || p.y > (this._canvas?.height || 600) + 20) {
        this._particles.splice(i, 1)
      }
    }
  }

  render(ctx) {
    if (!ctx) ctx = this._ctx
    if (!ctx) return
    for (const p of this._particles) {
      ctx.save()
      const alpha = p.fade ? Math.max(0, p.life / p.maxLife) : 1
      ctx.globalAlpha = alpha
      ctx.fillStyle = p.color
      if (p.type === 'rect') {
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size)
      } else {
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.restore()
    }
  }

  clear() { this._particles = [] }
  get count() { return this._particles.length }
}
