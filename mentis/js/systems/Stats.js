import { store } from '../core/Store.js'
import { events } from '../core/EventBus.js'

export class StatsTracker {
  constructor() {
    this._sessionStart = Date.now()
    this._combo = 0
    this._fastestSolve = 99
    this._floorStars = 0
    events.on('puzzle:solved', (result) => this._onPuzzle(result))
    events.on('tower:advance', () => this._onFloorComplete())
  }

  _onPuzzle({ correct, category, time, xp, stars }) {
    if (time === undefined) return
    store.update('stats.totalTime', t => t + time)
    if (!correct) { this._combo = 0; return }
    this._combo++
    this._floorStars += stars || 0
    store.update('stats', s => {
      s.puzzlesSolved++
      s.totalXP += xp || 0
      if (this._combo > (s.bestCombo || 0)) s.bestCombo = this._combo
      if (time < this._fastestSolve) { this._fastestSolve = time; s.fastestSolve = time }
      if (category && s.byCategory[category] !== undefined) s.byCategory[category]++
      return s
    })
  }

  _onFloorComplete() {
    if (this._floorStars >= 9) {
      store.update('stats', s => {
        s.perfectFloors = (s.perfectFloors || 0) + 1
        return s
      })
    }
    this._floorStars = 0
  }

  getSessionTime() {
    return Math.floor((Date.now() - this._sessionStart) / 1000)
  }

  getRadarData() {
    const stats = store.get('stats')
    const cat = stats.byCategory
    const max = Math.max(1, ...Object.values(cat))
    return Object.entries(cat).map(([key, val]) => ({
      category: key,
      value: val,
      percent: Math.round(val / max * 100)
    }))
  }
}
