import { store } from '../core/Store.js'
import { events } from '../core/EventBus.js'
import { audio } from '../app.js'

const XP_TABLE = [
  0, 100, 250, 450, 700, 1000, 1350, 1750, 2200, 2700,
  3250, 3850, 4500, 5200, 5950, 6750, 7600, 8500, 9450, 10450,
  11500, 12600, 13750, 14950, 16200, 17500, 18850, 20250, 21700, 23200,
  24750, 26350, 28000, 29700, 31450, 33250, 35100, 37000, 38950, 40950,
  43000, 45100, 47250, 49450, 51700, 54000, 56350, 58750, 61200, 63700,
]

const ABILITIES = [
  { level: 2, id: 'hint_extra', name: 'Pista Extra', desc: '+1 pista por piso', icon: '💡' },
  { level: 4, id: 'time_freeze', name: 'Congelar Tiempo', desc: '+5 segundos por puzzle', icon: '⏸️' },
  { level: 6, id: 'skip_easy', name: 'Salto Fácil', desc: 'Saltar 1 puzzle por piso', icon: '⏭️' },
  { level: 8, id: 'double_xp', name: 'Doble XP', desc: '×2 XP por 3 puzzles', icon: '⚡' },
  { level: 10, id: 'wildcard', name: 'Comodín', desc: 'Revelar 1 respuesta por piso', icon: '🃏' },
  { level: 13, id: 'auto_hint', name: 'Pista Automática', desc: 'Pista gratis tras 30s', icon: '🤖' },
  { level: 16, id: 'triple_stars', name: 'Triple Estrellas', desc: 'Gana 3 estrellas más fácil', icon: '⭐' },
  { level: 20, id: 'time_warp', name: 'Dilatación', desc: 'Tiempo se duplica en puzzles', icon: '⏳' },
  { level: 25, id: 'master_hint', name: 'Maestro Pistas', desc: 'Pistas 2× más efectivas', icon: '🎓' },
  { level: 30, id: 'god_mode', name: 'Modo Genio', desc: '+50% XP en todos los puzzles', icon: '🧬' },
]

export class ProgressionSystem {
  constructor() { events.on('puzzle:solved', (r) => this._onSolve(r)) }

  addXP(amount) {
    const player = store.get('player')
    const newXP = player.xp + amount
    store.set('player.xp', newXP)
    const oldLevel = player.level
    const newLevel = this._calcLevel(newXP)
    if (newLevel > oldLevel) {
      store.set('player.level', newLevel)
      const ability = ABILITIES.find(a => a.level === newLevel)
      if (ability) {
        events.emit('ability:unlocked', ability)
        audio.levelUp()
      }
      events.emit('player:levelUp', { level: newLevel, oldLevel })
    }
    store.update('stats', s => { s.totalXP += amount; return s })
  }

  getXPForLevel(level) {
    return XP_TABLE[Math.min(level, XP_TABLE.length - 1)]
  }

  getLevelProgress() {
    const player = store.get('player')
    const currXP = player.xp
    const currLevel = player.level
    const currReq = this.getXPForLevel(currLevel)
    const nextReq = this.getXPForLevel(currLevel + 1) || currReq + 500
    return { current: currXP - currReq, required: nextReq - currReq, level: currLevel }
  }

  getAbilities() {
    const level = store.get('player.level')
    return ABILITIES.filter(a => a.level <= level)
  }

  _onSolve(result) {
    this.addXP(result.xp || 10)
  }

  _calcLevel(xp) {
    for (let i = XP_TABLE.length - 1; i >= 0; i--) {
      if (xp >= XP_TABLE[i]) return i
    }
    return 1
  }
}
