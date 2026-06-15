export class TransitionEngine {
  constructor(canvas) {
    this._canvas = canvas
    this._ctx = canvas?.getContext('2d')
    this._active = null
  }

  fadeOut(duration = 300) {
    return this._run('fade', 0, 1, duration)
  }

  fadeIn(duration = 300) {
    return this._run('fade', 1, 0, duration)
  }

  wipe(direction = 'left', duration = 400) {
    return this._run('wipe', 0, 1, duration, { direction })
  }

  _run(type, from, to, duration, opts = {}) {
    return new Promise(resolve => {
      const start = performance.now()
      this._active = { type, from, to, duration, opts, start, resolve }
      if (!this._canvas) { resolve(); return }
    })
  }

  update(now) {
    if (!this._active) return
    const { from, to, duration, start, resolve } = this._active
    const elapsed = now - start
    const t = Math.min(1, elapsed / duration)
    const eased = 1 - Math.pow(1 - t, 3)
    this._active.progress = from + (to - from) * eased
    if (t >= 1) {
      this._active = null
      resolve()
    }
  }

  render(ctx) {
    if (!this._active) return
    const { type, direction, progress } = this._active
    if (type === 'fade') {
      ctx.fillStyle = `rgba(10,10,26,${progress})`
      ctx.fillRect(0, 0, this._canvas.width, this._canvas.height)
    } else if (type === 'wipe') {
      const w = this._canvas.width * progress
      ctx.fillStyle = '#0a0a1a'
      if (direction === 'left') ctx.fillRect(this._canvas.width - w, 0, w, this._canvas.height)
      else ctx.fillRect(0, 0, w, this._canvas.height)
    }
  }

  isActive() { return !!this._active }
}
