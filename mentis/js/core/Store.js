function safeClone(obj) {
  if (obj === undefined || obj === null) return obj
  if (typeof obj === 'function') return obj
  if (typeof obj !== 'object') return obj
  if (obj instanceof Date) return new Date(obj)
  if (Array.isArray(obj)) return obj.map(safeClone)
  try { return JSON.parse(JSON.stringify(obj)) }
  catch { return Object.keys(obj).reduce((acc, k) => { acc[k] = safeClone(obj[k]); return acc }, {}) }
}

export default class Store {
  constructor(initial = {}) {
    this._state = {}
    this._listeners = new Map()
    this._frozen = false
    Object.keys(initial).forEach(k => this._state[k] = safeClone(initial[k]))
  }
  get(key) {
    if (!key) return safeClone(this._state)
    const parts = key.split('.')
    let val = this._state
    for (const p of parts) {
      if (val === undefined || val === null) return undefined
      val = val[p]
    }
    return val !== undefined ? safeClone(val) : undefined
  }
  set(key, val) {
    if (this._frozen) return
    const parts = key.split('.')
    const last = parts.pop()
    let target = this._state
    for (const p of parts) {
      if (!target[p] || typeof target[p] !== 'object') target[p] = {}
      target = target[p]
    }
    const prev = target[last]
    if (prev === val) return
    target[last] = safeClone(val)
    this._notify(key, val, prev)
  }
  update(key, fn) {
    const curr = this.get(key)
    this.set(key, fn(curr))
  }
  observe(key, fn) {
    if (!this._listeners.has(key)) this._listeners.set(key, new Set())
    this._listeners.get(key).add(fn)
    return () => { this._listeners.get(key)?.delete(fn) }
  }
  _notify(key, val, prev) {
    const parts = key.split('.')
    while (parts.length) {
      const k = parts.join('.')
      this._listeners.get(k)?.forEach(fn => fn(val, prev))
      parts.pop()
    }
    this._listeners.get('*')?.forEach(fn => fn(key, val, prev))
  }
  snapshot() { return safeClone(this._state) }
  freeze() { this._frozen = true }
  unfreeze() { this._frozen = false }
  reset(initial = {}) {
    this._state = {}
    Object.keys(initial).forEach(k => this._state[k] = safeClone(initial[k]))
    this._notify('*', this._state, null)
  }
}

export const store = new Store({
  screen: 'title',
  player: { xp: 0, level: 1, streak: 0, lastPlayed: null },
  tower: { currentFloor: 1, maxUnlocked: 1, floors: {} },
  puzzle: { current: null, stars: 0, hintsUsed: 0 },
  settings: { sound: true, music: true, particles: true, theme: 'dark' },
  achievements: [],
  stats: {
    puzzlesSolved: 0, totalXP: 0, perfectFloors: 0,
    byCategory: { math: 0, logic: 0, visual: 0, strategy: 0, memory: 0 },
    totalTime: 0, bestStreak: 0, hintsUsed: 0
  }
})
