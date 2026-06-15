import { store } from '../core/Store.js'
import { events } from '../core/EventBus.js'
import { audio } from '../app.js'

const ACHIEVEMENTS = [
  { id: 'first_puzzle', name: 'Primer Puzzle', desc: 'Resuelve tu primer puzzle', icon: '🎯', check: (s) => s.puzzlesSolved >= 1, xp: 50 },
  { id: 'ten_puzzles', name: 'Novato', desc: 'Resuelve 10 puzzles', icon: '🔟', check: (s) => s.puzzlesSolved >= 10, xp: 100 },
  { id: 'fifty_puzzles', name: 'Estudiante', desc: 'Resuelve 50 puzzles', icon: '📚', check: (s) => s.puzzlesSolved >= 50, xp: 250 },
  { id: 'hundred_puzzles', name: 'Sabio', desc: 'Resuelve 100 puzzles', icon: '🧙', check: (s) => s.puzzlesSolved >= 100, xp: 500 },
  { id: 'fivehundred_puzzles', name: 'Erudito', desc: 'Resuelve 500 puzzles', icon: '🎓', check: (s) => s.puzzlesSolved >= 500, xp: 1500 },
  { id: 'thousand_puzzles', name: 'Genio Legendario', desc: 'Resuelve 1000 puzzles', icon: '🏆', check: (s) => s.puzzlesSolved >= 1000, xp: 5000 },
  { id: 'floor_10', name: 'Piso 10', desc: 'Alcanza el piso 10', icon: '🏗️', check: (s) => s.maxFloor >= 10, xp: 100 },
  { id: 'floor_25', name: 'Piso 25', desc: 'Alcanza el piso 25', icon: '🏢', check: (s) => s.maxFloor >= 25, xp: 250 },
  { id: 'floor_50', name: 'Piso 50', desc: 'Alcanza el piso 50', icon: '🏬', check: (s) => s.maxFloor >= 50, xp: 500 },
  { id: 'floor_75', name: 'Piso 75', desc: 'Alcanza el piso 75', icon: '🏰', check: (s) => s.maxFloor >= 75, xp: 750 },
  { id: 'floor_100', name: 'Cima de la Torre', desc: 'Alcanza el piso 100', icon: '🗼', check: (s) => s.maxFloor >= 100, xp: 2000 },
  { id: 'perfect_floor', name: 'Perfecto', desc: 'Completa un piso con 3 estrellas', icon: '⭐', check: (s) => s.perfectFloors >= 1, xp: 100 },
  { id: 'ten_perfect', name: 'Impecable', desc: 'Completa 10 pisos perfectos', icon: '💫', check: (s) => s.perfectFloors >= 10, xp: 500 },
  { id: 'speed_demon', name: 'Rayo', desc: 'Resuelve un puzzle en menos de 3s', icon: '⚡', check: (s) => s.fastestSolve <= 3 && s.fastestSolve > 0, xp: 150 },
  { id: 'streak_3', name: 'Racha', desc: 'Juega 3 días seguidos', icon: '🔥', check: (s) => s.bestStreak >= 3, xp: 100 },
  { id: 'streak_7', name: 'Semana', desc: 'Juega 7 días seguidos', icon: '🔥', check: (s) => s.bestStreak >= 7, xp: 300 },
  { id: 'streak_30', name: 'Mes', desc: 'Juega 30 días seguidos', icon: '🔥', check: (s) => s.bestStreak >= 30, xp: 1500 },
  { id: 'streak_100', name: 'Leyenda', desc: 'Juega 100 días seguidos', icon: '🔥', check: (s) => s.bestStreak >= 100, xp: 5000 },
  { id: 'no_hints', name: 'Sin Ayuda', desc: 'Completa un piso sin usar pistas', icon: '💪', check: (s) => s.noHintFloors >= 1, xp: 100 },
  { id: 'math_master', name: 'Matemático', desc: 'Resuelve 50 puzzles de matemáticas', icon: '🧮', check: (s) => s.byCategory.math >= 50, xp: 300 },
  { id: 'logic_master', name: 'Lógico', desc: 'Resuelve 50 puzzles de lógica', icon: '🧠', check: (s) => s.byCategory.logic >= 50, xp: 300 },
  { id: 'visual_master', name: 'Visual', desc: 'Resuelve 50 puzzles visuales', icon: '👁️', check: (s) => s.byCategory.visual >= 50, xp: 300 },
  { id: 'strategy_master', name: 'Estratega', desc: 'Resuelve 50 puzzles de estrategia', icon: '♟️', check: (s) => s.byCategory.strategy >= 50, xp: 300 },
  { id: 'memory_master', name: 'Memoria', desc: 'Resuelve 50 puzzles de memoria', icon: '🔄', check: (s) => s.byCategory.memory >= 50, xp: 300 },
  { id: 'all_categories', name: 'Polímata', desc: 'Resuelve 10 puzzles de cada categoría', icon: '🌈', check: (s) => Object.values(s.byCategory).every(v => v >= 10), xp: 500 },
  { id: 'level_10', name: 'Nivel 10', desc: 'Alcanza el nivel 10', icon: '⬆️', check: (s) => s.playerLevel >= 10, xp: 300 },
  { id: 'level_25', name: 'Nivel 25', desc: 'Alcanza el nivel 25', icon: '⬆️', check: (s) => s.playerLevel >= 25, xp: 800 },
  { id: 'level_50', name: 'Nivel 50', desc: 'Alcanza el nivel 50', icon: '⬆️', check: (s) => s.playerLevel >= 50, xp: 2000 },
  { id: 'time_1h', name: 'Dedicación', desc: 'Juega durante 1 hora en total', icon: '⏰', check: (s) => s.totalTime >= 3600, xp: 200 },
  { id: 'time_10h', name: 'Pasión', desc: 'Juega durante 10 horas en total', icon: '⏰', check: (s) => s.totalTime >= 36000, xp: 1000 },
  { id: 'time_100h', name: 'Obsesión', desc: 'Juega durante 100 horas en total', icon: '⏰', check: (s) => s.totalTime >= 360000, xp: 5000 },
  { id: 'combo_3', name: 'Racha de Aciertos', desc: 'Acierta 3 puzzles seguidos', icon: '🎯', check: (s) => s.bestCombo >= 3, xp: 50 },
  { id: 'combo_10', name: 'Imparable', desc: 'Acierta 10 puzzles seguidos', icon: '🎯', check: (s) => s.bestCombo >= 10, xp: 300 },
  { id: 'combo_20', name: 'Invencible', desc: 'Acierta 20 puzzles seguidos', icon: '🎯', check: (s) => s.bestCombo >= 20, xp: 800 },
]

export class AchievementSystem {
  constructor() {
    this._unlocked = new Set(store.get('achievements') || [])
    events.on('puzzle:solved', () => this.check())
    events.on('player:levelUp', () => this.check())
    events.on('tower:advance', () => this.check())
  }

  check() {
    const stats = this._buildCheckContext()
    for (const ach of ACHIEVEMENTS) {
      if (this._unlocked.has(ach.id)) continue
      if (ach.check(stats)) {
        this._unlock(ach)
      }
    }
  }

  _unlock(ach) {
    this._unlocked.add(ach.id)
    store.update('achievements', a => { a.push(ach.id); return a })
    events.emit('achievement:unlocked', ach)
    audio.achieve()
  }

  _buildCheckContext() {
    const player = store.get('player')
    const stats = store.get('stats')
    const tower = store.get('tower')
    return {
      puzzlesSolved: stats.puzzlesSolved,
      maxFloor: tower.currentFloor,
      perfectFloors: stats.perfectFloors,
      bestStreak: stats.bestStreak,
      playerLevel: player.level,
      totalTime: stats.totalTime,
      fastestSolve: stats.fastestSolve || 99,
      byCategory: stats.byCategory,
      noHintFloors: stats.noHintFloors || 0,
      bestCombo: stats.bestCombo || 0,
    }
  }

  getAll() { return ACHIEVEMENTS }
  getUnlocked() { return [...this._unlocked] }
  getProgress() {
    return { unlocked: this._unlocked.size, total: ACHIEVEMENTS.length }
  }
}
