import PuzzleEngine, { PuzzleQuestion } from './Engine.js'

function shuffle(arr) { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]] }; return a }

function genSequence(diff) {
  const symbols = ['●', '■', '▲', '★', '♦', '♥', '♣', '◆', '⬟', '⬢']
  const len = 3 + Math.floor(Math.min(diff, 5))
  const seq = []
  let pool = [...symbols]
  for (let i = 0; i < len; i++) {
    const idx = Math.floor(Math.random() * pool.length)
    seq.push(pool[idx])
    if (pool.length > 2) pool.splice(idx, 1)
    else pool = [...symbols]
  }
  const shown = seq.slice(0, -1)
  const correct = seq[seq.length - 1]
  const opts = shuffle([correct, ...symbols.filter(s => s !== correct).slice(0, 3)])
  return new PuzzleQuestion({
    text: `🧠 Memoriza la secuencia:\n\n${shown.join(' ')}\n\n¿Qué símbolo sigue?`,
    options: opts,
    answer: opts.indexOf(correct),
    data: { category: 'memory', subType: 'sequence', len }
  })
}

const CARD_SYMBOLS = ['🐱', '🐶', '🐰', '🐸', '🦊', '🐻', '🐭', '🐹', '🐨', '🐼', '🦁', '🐯']
function genPairs(diff) {
  const pairCount = 3 + Math.floor(Math.min(diff, 3))
  const selected = shuffle(CARD_SYMBOLS).slice(0, pairCount)
  const deck = shuffle([...selected, ...selected])
  const positions = deck.map((s, i) => ({ s, i }))
  let moves = 0
  const revealed = new Set()
  for (let i = 0; i < deck.length; i++) {
    if (revealed.has(i)) continue
    for (let j = i + 1; j < deck.length; j++) {
      if (revealed.has(j)) continue
      if (deck[i] === deck[j]) { revealed.add(i); revealed.add(j); moves++; break }
    }
  }
  const optimalMoves = pairCount
  const answer = optimalMoves
  const opts = shuffle([answer, answer + 1, answer + 2, answer + 3])
  return new PuzzleQuestion({
    text: `🃏 Encuentra los ${pairCount} pares iguales.\nCartas boca abajo: ${pairCount * 2}\n\n¿Cuál es el número MÍNIMO de movimientos para encontrar todos los pares?`,
    options: opts.map(o => String(o)),
    answer: opts.indexOf(answer),
    data: { category: 'memory', subType: 'pairs', pairCount }
  })
}

function genMemoryGrid(diff) {
  const size = 3 + Math.floor(Math.min(diff, 2))
  const total = size * size
  const nums = shuffle(Array.from({ length: total }, (_, i) => i + 1))
  const display = []
  for (let r = 0; r < size; r++) {
    display.push(nums.slice(r * size, (r + 1) * size).join(' '))
  }
  const toRemove = Math.floor(Math.random() * total)
  const correct = nums[toRemove]
  const opts = shuffle([correct, ...Array.from({ length: 3 }, () => Math.floor(Math.random() * total) + 1).filter(v => v !== correct)])
  return new PuzzleQuestion({
    text: `🔢 Memoria visual. Grid ${size}×${size}:\n\n${display.join('\n')}\n\nSi quitamos el número en posición ${toRemove + 1},\n¿qué número falta?`,
    options: opts.map(o => String(o)),
    answer: opts.indexOf(correct),
    data: { category: 'memory', subType: 'grid', size }
  })
}

function genChangeBlind(diff) {
  const scene = shuffle(['🌞', '🌳', '🏠', '☁️', '🚗', '🌸', '🦋', '⭐', '🌙', '🏔️', '🌊', '🏖️']).slice(0, 5 + Math.floor(Math.min(diff, 3)))
  const changeIdx = Math.floor(Math.random() * scene.length)
  const origItem = scene[changeIdx]
  const replacements = shuffle(['🌞', '🌳', '🏠', '☁️', '🚗', '🌸', '🦋', '⭐', '🌙', '🏔️', '🌊', '🏖️'].filter(s => s !== origItem))
  const newItem = replacements[0]
  const before = scene.join(' ')
  const after = [...scene]; after[changeIdx] = newItem
  const opts = shuffle([origItem, newItem, ...replacements.slice(1, 3)])
  return new PuzzleQuestion({
    text: `👀 Escena original:\n${before}\n\nEscena nueva:\n${after.join(' ')}\n\n¿Qué elemento CAMBIÓ?`,
    options: opts.map(o => `«${o}»`),
    answer: opts.indexOf(origItem),
    data: { category: 'memory', subType: 'change', origItem, newItem }
  })
}

export function createMemoryPuzzleEngine() {
  const engine = new PuzzleEngine({ category: 'memory' })
  const generators = [genSequence, genPairs, genMemoryGrid, genChangeBlind]
  generators.forEach(g => engine.register(g))
  return engine
}
