import { getEngine, getRandomCategory, CATEGORIES } from '../puzzles/Registry.js'

function getDailySeed() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

export class DailyChallenge {
  constructor() { this._today = null }

  generate() {
    const seed = getDailySeed()
    if (this._today && this._today.seed === seed) return this._today
    const catKeys = Object.keys(CATEGORIES)
    const category = catKeys[Math.abs(this._hash(seed)) % catKeys.length]
    const engine = getEngine(category)
    const puzzle = engine.generate(5 + (Math.abs(this._hash(seed + '_diff')) % 5))
    this._today = { seed, category, puzzle, date: seed }
    return this._today
  }

  getScore() {
    try {
      const stored = localStorage.getItem('mentis_daily_' + getDailySeed())
      return stored ? JSON.parse(stored) : null
    } catch { return null }
  }

  saveScore(result) {
    localStorage.setItem('mentis_daily_' + getDailySeed(), JSON.stringify({
      ...result,
      seed: getDailySeed(),
      timestamp: Date.now()
    }))
  }

  _hash(str) {
    let h = 0
    for (let i = 0; i < str.length; i++) {
      h = ((h << 5) - h) + str.charCodeAt(i)
      h |= 0
    }
    return h
  }
}
