import PuzzleEngine, { PuzzleQuestion } from './Engine.js'

function shuffle(arr) { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]] }; return a }

function genOptions(correct, count = 4) {
  const opts = new Set([correct])
  let attempts = 0
  while (opts.size < count && attempts < 50) {
    const r = Math.floor(Math.random() * count * 3)
    if (r !== correct) opts.add(r)
    attempts++
  }
  while (opts.size < count) opts.add(opts.size)
  const arr = shuffle([...opts])
  return { options: arr.map(i => String.fromCharCode(65 + i)), answer: arr.indexOf(correct) }
}

function guessAnArray(len, options) {
  const res = []
  for (let i = 0; i < len; i++) {
    res.push(options[Math.floor(Math.random() * options.length)])
  }
  return res
}
function arrayShuffleEqual(a, b) {
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false
  return true
}

function genTruthLie(diff) {
  const scenarios = [
    { statements: ['"El cielo es rojo"', '"El agua moja"'], truth: [false, true], answer: 1 },
    { statements: ['"2 + 2 = 5"', '"3 + 3 = 6"', '"1 + 1 = 3"'], truth: [false, true, false], answer: 1 },
    { statements: ['"Los perros vuelan"', '"Los peces nadan"', '"Los gatos maúllan"'], truth: [false, true, true], answer: 1 },
  ]
  const sc = diff >= 3 ? scenarios[Math.floor(Math.random() * scenarios.length)] : scenarios[Math.floor(Math.random() * 2)]
  const q = `¿Cuál de estas afirmaciones es VERDADERA?\n\n${sc.statements.join('\n')}`
  const { options, answer } = genOptions(sc.answer, sc.statements.length)
  const texts = sc.statements.map(s => s.replace(/"/g, ''))
  return new PuzzleQuestion({ text: q, options: texts, answer, data: { category: 'logic', subType: 'truth' } })
}

function genLogicGrid(diff) {
  const items = ['Casa Roja', 'Casa Azul', 'Casa Verde', 'Casa Amarilla']
  const count = 3 + Math.floor(Math.min(diff, 2))
  const selected = items.slice(0, count)
  const correct = Math.floor(Math.random() * count)
  const shuffled = shuffle([...Array(count).keys()])
  const correctIdx = shuffled.indexOf(correct)
  const clues = []
  if (count >= 3) {
    clues.push(`La ${selected[shuffled[0]]} está a la izquierda de la ${selected[shuffled[1]]}.`)
    clues.push(`La ${selected[shuffled[2]]} no está al principio.`)
  }
  if (count >= 4) clues.push(`La ${selected[shuffled[3]]} está al final.`)
  const q = `🧩 Ordena las casas según las pistas:\n\n${clues.join('\n')}\n\n¿Qué casa va al PRINCIPIO?`
  const { options, answer } = genOptions(correctIdx, count)
  return new PuzzleQuestion({ text: q, options: selected, answer, data: { category: 'logic', subType: 'grid', correct: selected[correct] } })
}

function genSequence(diff) {
  const symbols = ['○', '●', '△', '▲', '□', '■', '◇', '◆']
  const sy = symbols.slice(0, 4 + Math.floor(Math.min(diff, 2)))
  const pat = []
  const len = 3 + Math.floor(Math.random() * 2)
  for (let i = 0; i < len; i++) {
    pat.push(sy[Math.floor(Math.random() * sy.length)])
  }
  const next = sy[Math.floor(Math.random() * sy.length)]
  const allOptions = shuffle([...sy]).slice(0, 4)
  const answer = allOptions.indexOf(next)
  return new PuzzleQuestion({
    text: `🔍 ¿Qué símbolo completa la secuencia?\n\n${pat.join(' ')}  ?`,
    options: allOptions,
    answer,
    data: { category: 'logic', subType: 'sequence' }
  })
}

function genAnalogy(diff) {
  const pairs = [
    { a: 'Mano', b: 'Guante', c: 'Pie', d: 'Calcetín' },
    { a: 'Día', b: 'Noche', c: 'Sol', d: 'Luna' },
    { a: 'Perro', b: 'Ladrar', c: 'Gato', d: 'Maullar' },
    { a: 'Ojo', b: 'Ver', c: 'Oído', d: 'Oír' },
    { a: 'Fuego', b: 'Calor', c: 'Hielo', d: 'Frío' },
    { a: 'Cocinar', b: 'Cocina', c: 'Dormir', d: 'Dormitorio' },
    { a: 'Lluvia', b: 'Paraguas', c: 'Sol', d: 'Gafas de sol' },
    { a: 'Pez', b: 'Agua', c: 'Ave', d: 'Aire' },
    { a: 'Libro', b: 'Leer', c: 'Canción', d: 'Cantar' },
    { a: 'Semilla', b: 'Árbol', c: 'Huevo', d: 'Pájaro' },
    { a: 'Lápiz', b: 'Dibujar', c: 'Piano', d: 'Tocar' },
    { a: 'Norte', b: 'Sur', c: 'Este', d: 'Oeste' },
  ]
  const pair = pairs[Math.floor(Math.random() * pairs.length)]
  const wrongs = pairs.filter(p => p !== pair).map(p => p.d)
  const wrong = wrongs[Math.floor(Math.random() * wrongs.length)]
  const opts = shuffle([pair.d, wrong, ...wrongs.slice(1, 3)])
  const answer = opts.indexOf(pair.d)
  return new PuzzleQuestion({
    text: `🧠 ${pair.a} es a ${pair.b} como ${pair.c} es a...`,
    options: opts,
    answer,
    data: { category: 'logic', subType: 'analogy' }
  })
}

function genDeduction(diff) {
  const items = ['🐻', '🦊', '🐰', '🐱', '🐶', '🐭', '🐸', '🦁']
  const animals = shuffle(items).slice(0, 3 + Math.floor(Math.min(diff, 2)))
  const correct = animals[Math.floor(Math.random() * animals.length)]
  const clues = []
  if (animals.length >= 3) {
    clues.push(`${animals[0]} no es de color marrón.`)
    clues.push(`${animals[1]} ${['tiene manchas', 'es muy rápido', 'vive en el bosque', 'tiene orejas largas', 'nada muy bien'][Math.floor(Math.random() * 5)]}.`)
    clues.push(`${animals[2]} ${['es el más pequeño', 'tiene cola larga', 'come frutas', 'salta muy alto', 'tiene rayas'][Math.floor(Math.random() * 5)]}.`)
  }
  if (animals.length >= 4) clues.push(`${animals[3]} es ${['el único que vuela', 'el que tiene más amigos', 'el más viejo', 'el más joven'][Math.floor(Math.random() * 4)]}.`)
  const q = `🔎 Deducción:\n\n${clues.join('\n')}\n\n¿Cuál es ${animals[Math.floor(Math.random() * animals.length)]}?`
  const opts = shuffle(animals)
  const answer = opts.indexOf(correct)
  return new PuzzleQuestion({ text: q, options: opts, answer, data: { category: 'logic', subType: 'deduction' } })
}

export function createLogicPuzzleEngine() {
  const engine = new PuzzleEngine({ category: 'logic' })
  const generators = [genTruthLie, genSequence, genAnalogy, genDeduction]
  if (Math.random() > 0.5) generators.push(genLogicGrid)
  generators.forEach(g => engine.register(g))
  return engine
}
