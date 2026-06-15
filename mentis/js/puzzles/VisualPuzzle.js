import PuzzleEngine, { PuzzleQuestion } from './Engine.js'

function shuffle(arr) { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]] }; return a }

function genMaze(diff) {
  const size = 5 + Math.floor(Math.min(diff, 5)) * 2
  const grid = Array.from({ length: size }, () => Array.from({ length: size }, () => ({ n: true, s: true, e: true, w: true, visited: false })))
  function carve(cx, cy) {
    grid[cy][cx].visited = true
    const dirs = shuffle([[0, -1, 'n', 's'], [0, 1, 's', 'n'], [1, 0, 'e', 'w'], [-1, 0, 'w', 'e']])
    for (const [dx, dy, dir, opp] of dirs) {
      const nx = cx + dx, ny = cy + dy
      if (nx < 0 || nx >= size || ny < 0 || ny >= size) continue
      if (!grid[ny][nx].visited) {
        grid[cy][cx][dir] = false
        grid[ny][nx][opp] = false
        carve(nx, ny)
      }
    }
  }
  carve(0, 0)
  const endX = size - 1, endY = size - 1
  let solution = []
  function solve(x, y, path) {
    if (x === endX && y === endY) { solution = [...path, { x, y }]; return true }
    if (grid[y][x]._solved) return false
    grid[y][x]._solved = true
    const dirs = [[0, -1, 'n'], [0, 1, 's'], [1, 0, 'e'], [-1, 0, 'w']]
    for (const [dx, dy, dir] of shuffle(dirs)) {
      if (!grid[y][x][dir]) {
        const nx = x + dx, ny = y + dy
        if (nx >= 0 && nx < size && ny >= 0 && ny < size && !grid[ny][nx]._solved) {
          if (solve(nx, ny, [...path, { x, y }])) return true
        }
      }
    }
    return false
  }
  solve(0, 0, [])
  const solutionLen = solution.length - 1
  const answer = solutionLen
  const options = shuffle([answer, answer - 1, answer + 1, answer - 2].filter(v => v > 0))
  const optAnswer = options.indexOf(answer)
  return new PuzzleQuestion({
    text: `🌀 Laberinto ${size}×${size}\nEncuentra la salida.\n¿Cuál es la longitud del camino más corto (en pasos)?`,
    options: options.map(o => String(o) + ' pasos'),
    answer: optAnswer,
    data: { category: 'visual', subType: 'maze', size, solution: solutionLen, grid }
  })
}

const ROT_SHAPES = ['◢', '◣', '◤', '◥', '⬒', '⬔', '⭓', '⭔']
const ROT_PATTERNS = [
  { s: '◢', rots: [0, 1, 2, 3] },
  { s: '◣', rots: [1, 2, 3, 0] },
  { s: '⬒', rots: [0, 1, 2, 3] },
]

function genRotation(diff) {
  const pat = ROT_PATTERNS[Math.floor(Math.random() * ROT_PATTERNS.length)]
  const deg = (Math.floor(Math.random() * 3) + 1) * 90
  const steps = deg / 90
  const answer = steps % 4
  const options = shuffle([0, 1, 2, 3])
  return new PuzzleQuestion({
    text: `🔄 La figura ${pat.s} rota ${deg}°.\n¿Qué posición final tiene?`,
    options: [pat.s, ...ROT_SHAPES.filter(s => s !== pat.s).slice(0, 3)],
    answer: options.indexOf(answer),
    data: { category: 'visual', subType: 'rotation' }
  })
}

function genPattern(diff) {
  const shapes = ['●', '■', '▲', '◆', '★', '⬟']
  const s = shuffle(shapes).slice(0, 3)
  const grid = []
  for (let r = 0; r < 3; r++) {
    grid.push([])
    for (let c = 0; c < 3; c++) {
      grid[r].push(s[Math.floor(Math.random() * s.length)])
    }
  }
  const missingR = Math.floor(Math.random() * 3)
  const missingC = Math.floor(Math.random() * 3)
  const correct = grid[missingR][missingC]
  grid[missingR][missingC] = '❓'
  const opts = shuffle([correct, ...s.filter(x => x !== correct)])
  const display = grid.map(r => r.join(' ')).join('\n')
  return new PuzzleQuestion({
    text: `🔲 ¿Qué figura falta?\n\n${display}`,
    options: opts,
    answer: opts.indexOf(correct),
    data: { category: 'visual', subType: 'pattern' }
  })
}

function genSymmetry(diff) {
  const pairs = [
    { left: '🐱', right: '🐱', axis: 'vertical' },
    { left: '▶', right: '◀', axis: 'vertical' },
    { left: '⬆', right: '⬆', axis: 'vertical' },
  ]
  const p = pairs[Math.floor(Math.random() * pairs.length)]
  const wrongs = ['🐶', '🐰', '🐸']
  const opts = shuffle([p.right, ...wrongs.slice(0, 3)])
  return new PuzzleQuestion({
    text: `🪞 Eje de simetría vertical.\nLado izquierdo: ${p.left}\n¿Qué va al lado derecho?`,
    options: opts,
    answer: opts.indexOf(p.right),
    data: { category: 'visual', subType: 'symmetry' }
  })
}

export function createVisualPuzzleEngine() {
  const engine = new PuzzleEngine({ category: 'visual' })
  const generators = [genMaze, genRotation, genPattern, genSymmetry]
  generators.forEach(g => engine.register(g))
  return engine
}
