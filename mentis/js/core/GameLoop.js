export default class GameLoop {
  constructor({ update, render, fps = 60 } = {}) {
    this._update = update
    this._render = render
    this._fps = fps
    this._interval = 1000 / fps
    this._running = false
    this._last = 0
    this._accum = 0
    this._frame = 0
    this._raf = null
  }
  start() {
    if (this._running) return
    this._running = true
    this._last = performance.now()
    this._accum = 0
    this._frame = 0
    this._tick(this._last)
  }
  stop() {
    this._running = false
    if (this._raf) cancelAnimationFrame(this._raf)
    this._raf = null
  }
  _tick(now) {
    if (!this._running) return
    this._raf = requestAnimationFrame(t => this._tick(t))
    const delta = Math.min(now - this._last, 100)
    this._last = now
    this._accum += delta
    this._frame++
    while (this._accum >= this._interval) {
      this._accum -= this._interval
      this._update?.(this._interval / 1000, this._frame)
    }
    this._render?.(this._accum / this._interval, this._frame)
  }
  setFps(fps) {
    this._fps = fps
    this._interval = 1000 / fps
  }
  get fps() { return this._fps }
  get running() { return this._running }
}
