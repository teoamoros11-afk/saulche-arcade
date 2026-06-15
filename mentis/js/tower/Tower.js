import { store } from '../core/Store.js'
import { events } from '../core/EventBus.js'
import { CATEGORIES } from '../puzzles/Registry.js'
import { FloorGenerator } from './Floor.js'

const ZONES = [
  { id: 'logic', name: 'Jardines de la Lógica', floors: [1, 15], icon: '🧠', color: '#7c4dff' },
  { id: 'math', name: 'Cámaras Matemáticas', floors: [16, 35], icon: '🧮', color: '#448aff' },
  { id: 'visual', name: 'Laberinto Espacial', floors: [36, 50], icon: '👁️', color: '#00bcd4' },
  { id: 'strategy', name: 'Fortaleza de la Estrategia', floors: [51, 70], icon: '♟️', color: '#ff9800' },
  { id: 'memory', name: 'Santuario de la Memoria', floors: [71, 85], icon: '🔄', color: '#e91e63' },
  { id: 'mixed', name: 'La Cima del Genio', floors: [86, 100], icon: '🏆', color: '#ffd700' },
]

export class TowerManager {
  constructor() {
    this._floorGen = new FloorGenerator()
    this._initialized = false
    events.on('puzzle:solved', ({ stars, floor }) => this._onPuzzleSolved(stars, floor))
  }

  init() {
    if (this._initialized) return
    this._initialized = true
    const tower = store.get('tower')
    if (!tower || !tower.floors || Object.keys(tower.floors).length === 0) {
      this._generateInitial()
    }
  }

  _generateInitial() {
    const floors = {}
    for (let f = 1; f <= 5; f++) {
      floors[f] = this._floorGen.generate(f)
    }
    store.set('tower.floors', floors)
    store.set('tower.maxUnlocked', 5)
  }

  getZone(floor) {
    return ZONES.find(z => floor >= z.floors[0] && floor <= z.floors[1]) || ZONES[ZONES.length - 1]
  }

  getFloor(num) {
    const floors = store.get('tower.floors')
    if (floors[num]) return floors[num]
    const gen = this._floorGen.generate(num)
    store.set(`tower.floors.${num}`, gen)
    store.set('tower.maxUnlocked', Math.max(num, store.get('tower.maxUnlocked')))
    return gen
  }

  getCurrentFloor() {
    const num = store.get('tower.currentFloor')
    return this.getFloor(num)
  }

  getTotalStars() {
    const floors = store.get('tower.floors')
    return Object.values(floors).reduce((sum, f) => sum + (f.stars || 0), 0)
  }

  getCompletedFloors() {
    const floors = store.get('tower.floors')
    return Object.values(floors).filter(f => f.completed).length
  }

  advance() {
    const current = store.get('tower.currentFloor')
    if (current < 100) {
      store.set('tower.currentFloor', current + 1)
      this.getFloor(current + 1)
      events.emit('tower:advance', { floor: current + 1, zone: this.getZone(current + 1) })
    }
  }

  canAdvance() {
    const floor = this.getCurrentFloor()
    return floor && floor.stars > 0
  }

  _onPuzzleSolved(stars, floorNum) {
    const floors = store.get('tower.floors')
    const floor = floors[floorNum] || this.getFloor(floorNum)
    if (floor) {
      floor.stars = Math.max(floor.stars || 0, stars)
      store.set(`tower.floors.${floorNum}.stars`, floor.stars)
      if (!floor.completed && stars > 0) {
        store.set(`tower.floors.${floorNum}.completed`, true)
      }
    }
  }

  static getZones() { return ZONES }
}
