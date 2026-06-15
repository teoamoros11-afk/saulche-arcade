import { events } from './EventBus.js'
export default class InputManager {
  constructor(element = document) {
    this._keys = new Set()
    this._justPressed = new Set()
    this._mouse = { x: 0, y: 0, down: false, justClicked: false }
    this._touches = new Map()
    this._bound = {}
    this._element = element
    this._pressed = null
    this._bind()
  }
  _bind() {
    const el = this._element
    this._bound.keydown = e => {
      const k = e.key
      if (!this._keys.has(k)) this._justPressed.add(k)
      this._keys.add(k)
      this._pressed = k
      if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(k)) e.preventDefault()
      events.emit('input:keydown', k, e)
    }
    this._bound.keyup = e => {
      this._keys.delete(e.key)
      events.emit('input:keyup', e.key, e)
    }
    this._bound.mousedown = e => {
      this._mouse.down = true
      this._mouse.justClicked = true
      this._mouse.x = e.clientX; this._mouse.y = e.clientY
      events.emit('input:mousedown', this._mouse, e)
    }
    this._bound.mousemove = e => {
      const rect = el.getBoundingClientRect ? el.getBoundingClientRect() : { left: 0, top: 0 }
      this._mouse.x = (e.clientX - rect.left) / (rect.width || 1)
      this._mouse.y = (e.clientY - rect.top) / (rect.height || 1)
    }
    this._bound.mouseup = e => {
      this._mouse.down = false
      events.emit('input:mouseup', this._mouse, e)
    }
    this._bound.touchstart = e => {
      e.preventDefault()
      for (const t of e.changedTouches) this._touches.set(t.identifier, { x: t.clientX, y: t.clientY })
      const touch = e.changedTouches[0]
      const rect = el.getBoundingClientRect ? el.getBoundingClientRect() : { left: 0, top: 0, width: 1, height: 1 }
      this._mouse.x = (touch.clientX - rect.left) / (rect.width || 1)
      this._mouse.y = (touch.clientY - rect.top) / (rect.height || 1)
      this._mouse.justClicked = true
      events.emit('input:touchstart', touch, e)
    }
    this._bound.touchend = e => {
      for (const t of e.changedTouches) this._touches.delete(t.identifier)
    }
    el.addEventListener('keydown', this._bound.keydown)
    el.addEventListener('keyup', this._bound.keyup)
    el.addEventListener('mousedown', this._bound.mousedown)
    el.addEventListener('mousemove', this._bound.mousemove)
    el.addEventListener('mouseup', this._bound.mouseup)
    el.addEventListener('touchstart', this._bound.touchstart, { passive: false })
    el.addEventListener('touchend', this._bound.touchend)
    el.addEventListener('contextmenu', e => e.preventDefault())
  }
  isDown(key) { return this._keys.has(key) }
  justPressed(key) { return this._justPressed.has(key) }
  anyJustPressed() { return this._justPressed.size > 0 || this._mouse.justClicked }
  anyKey() { return this._pressed }
  mouse() { return { ...this._mouse } }
  clear() {
    this._justPressed.clear()
    this._mouse.justClicked = false
    this._pressed = null
  }
  destroy() {
    const el = this._element
    el.removeEventListener('keydown', this._bound.keydown)
    el.removeEventListener('keyup', this._bound.keyup)
    el.removeEventListener('mousedown', this._bound.mousedown)
    el.removeEventListener('mousemove', this._bound.mousemove)
    el.removeEventListener('mouseup', this._bound.mouseup)
    el.removeEventListener('touchstart', this._bound.touchstart)
    el.removeEventListener('touchend', this._bound.touchend)
    el.removeEventListener('contextmenu', e => e.preventDefault())
  }
}
