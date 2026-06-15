import { store } from '../core/Store.js'
import { events } from '../core/EventBus.js'

export class StreakSystem {
  constructor() { events.on('puzzle:solved', () => this._checkStreak()) }

  _checkStreak() {
    const player = store.get('player')
    const today = new Date().toDateString()
    const lastPlayed = player.lastPlayed
    if (lastPlayed === today) return
    const yesterday = new Date(Date.now() - 86400000).toDateString()
    let newStreak
    if (lastPlayed === yesterday) {
      newStreak = player.streak + 1
    } else if (lastPlayed !== today) {
      newStreak = 1
    } else {
      return
    }
    store.set('player.streak', newStreak)
    store.set('player.lastPlayed', today)
    store.update('stats', s => {
      if (newStreak > s.bestStreak) s.bestStreak = newStreak
      return s
    })
    if (newStreak === 7 || newStreak === 30 || newStreak === 100 || newStreak % 10 === 0) {
      events.emit('streak:milestone', { streak: newStreak })
    }
  }

  getStreak() { return store.get('player.streak') || 0 }

  getStreakBonus() {
    const s = this.getStreak()
    if (s >= 30) return 2.0
    if (s >= 14) return 1.5
    if (s >= 7) return 1.25
    if (s >= 3) return 1.1
    return 1.0
  }
}
