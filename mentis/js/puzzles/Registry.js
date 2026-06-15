import { createMathPuzzleEngine } from './MathPuzzle.js'
import { createLogicPuzzleEngine } from './LogicPuzzle.js'
import { createVisualPuzzleEngine } from './VisualPuzzle.js'
import { createStrategyPuzzleEngine } from './StrategyPuzzle.js'
import { createMemoryPuzzleEngine } from './MemoryPuzzle.js'

export const CATEGORIES = {
  math: { id: 'math', name: 'Matemáticas', icon: '🧮', color: '#448aff', desc: 'Números, operaciones y problemas' },
  logic: { id: 'logic', name: 'Lógica', icon: '🧠', color: '#7c4dff', desc: 'Razonamiento, deducción y patrones' },
  visual: { id: 'visual', name: 'Visual', icon: '👁️', color: '#00bcd4', desc: 'Laberintos, rotaciones y simetría' },
  strategy: { id: 'strategy', name: 'Estrategia', icon: '♟️', color: '#ff9800', desc: 'Planificación, optimización y recursos' },
  memory: { id: 'memory', name: 'Memoria', icon: '🔄', color: '#e91e63', desc: 'Secuencias, pares y retención' },
}

const _engines = {}

export function getEngine(category) {
  if (!_engines[category]) {
    switch (category) {
      case 'math': _engines[category] = createMathPuzzleEngine(); break
      case 'logic': _engines[category] = createLogicPuzzleEngine(); break
      case 'visual': _engines[category] = createVisualPuzzleEngine(); break
      case 'strategy': _engines[category] = createStrategyPuzzleEngine(); break
      case 'memory': _engines[category] = createMemoryPuzzleEngine(); break
      default: _engines[category] = createMathPuzzleEngine(); break
    }
  }
  return _engines[category]
}

export function getRandomCategory() {
  const keys = Object.keys(CATEGORIES)
  return keys[Math.floor(Math.random() * keys.length)]
}
