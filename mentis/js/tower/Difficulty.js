import { store } from '../core/Store.js'

export class AdaptiveDifficulty {
  constructor() {
    this._history = []
    this._lastAdjustment = 0
  }

  recordResult(category, correct, time) {
    this._history.push({ category, correct, time, ts: Date.now() })
    if (this._history.length > 100) this._history.shift()
  }

  getAdjustment() {
    const recent = this._history.slice(-20)
    if (recent.length < 5) return 0
    const correct = recent.filter(r => r.correct).length / recent.length
    const avgTime = recent.reduce((s, r) => s + r.time, 0) / recent.length
    if (correct > 0.85 && avgTime < 8) return 1
    if (correct < 0.45) return -1
    return 0
  }

  getCategoryWeaknesses() {
    const byCat = {}
    for (const r of this._history) {
      if (!byCat[r.category]) byCat[r.category] = { total: 0, correct: 0 }
      byCat[r.category].total++
      if (r.correct) byCat[r.category].correct++
    }
    const weaknesses = Object.entries(byCat)
      .map(([cat, data]) => ({ category: cat, rate: data.correct / data.total, total: data.total }))
      .sort((a, b) => a.rate - b.rate)
    return weaknesses.filter(w => w.total >= 3)
  }

  getRecommendedDifficulty() {
    const stats = store.get('stats')
    const adjust = this.getAdjustment()
    const base = Math.min(10, Math.max(1, Math.floor(stats.puzzlesSolved / 20) + 1))
    return Math.min(10, Math.max(1, base + adjust))
  }
}
