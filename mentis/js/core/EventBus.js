export default class EventBus {
  constructor() {
    this._handlers = new Map()
    this._once = new Map()
  }
  on(event, fn) {
    if (!this._handlers.has(event)) this._handlers.set(event, new Set())
    this._handlers.get(event).add(fn)
    return () => this.off(event, fn)
  }
  once(event, fn) {
    if (!this._once.has(event)) this._once.set(event, new Set())
    this._once.get(event).add(fn)
  }
  off(event, fn) {
    this._handlers.get(event)?.delete(fn)
  }
  emit(event, ...args) {
    this._handlers.get(event)?.forEach(fn => { try { fn(...args) } catch (e) { console.warn(`[EventBus] ${event}:`, e) } })
    this._once.get(event)?.forEach(fn => { try { fn(...args) } catch (e) { console.warn(`[EventBus] ${event}:`, e) } })
    this._once.delete(event)
  }
  clear(event) {
    if (event) { this._handlers.delete(event); this._once.delete(event) }
    else { this._handlers.clear(); this._once.clear() }
  }
}

export const events = new EventBus()
