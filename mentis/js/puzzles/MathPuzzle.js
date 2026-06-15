import PuzzleEngine, { PuzzleQuestion } from './Engine.js'

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function genOptions(correct, count = 4, spread = 5) {
  const opts = new Set([correct])
  let attempts = 0
  while (opts.size < count && attempts < 50) {
    const d = correct + Math.floor(Math.random() * spread * 2 - spread)
    if (d >= 0 && d !== correct) opts.add(d)
    attempts++
  }
  while (opts.size < count) opts.add(Math.floor(Math.random() * 20))
  const arr = shuffle([...opts])
  return { options: arr, answer: arr.indexOf(correct) }
}

function genEquationVisual(diff) {
  const emojis = ['🐻', '⭐', '🌙', '🍎', '🐟', '🌸', '🎈', '🧊']
  const e1 = emojis[Math.floor(Math.random() * emojis.length)]
  let e2;
  do { e2 = emojis[Math.floor(Math.random() * emojis.length)] } while (e2 === e1)
  const v1 = 2 + Math.floor(Math.random() * (4 + diff * 2))
  const v2 = 2 + Math.floor(Math.random() * (4 + diff * 2))
  const ops = ['+', '×', '−']
  const op = ops[Math.floor(Math.random() * (diff < 3 ? 2 : 3))]
  let r1, r2, display
  switch (op) {
    case '+':
      r1 = v1 + v2;
      display = `${e1} + ${e1} = ${r1}\n${e1} + ${e2} = ${r1 + v2}\n${e2} = ?`
      break
    case '×':
      r1 = v1 * v2;
      display = `${e1} × ${e2} = ${r1}\n${e1} × ${e1} = ${v1 * v1}\n${e2} = ?`
      break
    case '−':
      r1 = v1 + v2;
      display = `${e1} + ${e2} = ${r1}\n${e1} = ${v1}\n${e2} = ?`
      break
  }
  const { options, answer } = genOptions(v2, 4, 3 + diff)
  return new PuzzleQuestion({
    text: display,
    options: options.map(o => String(o)),
    answer,
    data: { category: 'math', subType: 'equation', value: v2 }
  })
}

function genSequence(diff) {
  const step = 1 + Math.floor(Math.random() * (2 + diff))
  const start = 1 + Math.floor(Math.random() * (5 + diff * 2))
  const len = 3 + Math.floor(Math.random() * 2)
  const seq = []
  for (let i = 0; i < len; i++) seq.push(start + i * step)
  const next = start + len * step
  const seqDisplay = seq.join(', ')
  const { options, answer } = genOptions(next, 4, Math.max(3, step * 2))
  return new PuzzleQuestion({
    text: `🔢 ¿Qué número sigue?\n\n${seqDisplay}, ?`,
    options: options.map(o => String(o)),
    answer,
    data: { category: 'math', subType: 'sequence', value: next }
  })
}

function genWordProblem(diff) {
  const names = ['Ana', 'Luis', 'Sara', 'Pablo', 'Marta', 'Carlos', 'Elena', 'Diego', 'Lucía', 'Miguel', 'Valeria', 'Jorge']
  const n1 = names[Math.floor(Math.random() * names.length)]
  let n2; do { n2 = names[Math.floor(Math.random() * names.length)] } while (n2 === n1)
  const items = ['canicas', 'manzanas', 'galletas', 'lápices', 'caramelos', 'monedas', 'fichas', 'cromos', 'bolígrafos', 'pegatinas', 'canicas']
  const item = items[Math.floor(Math.random() * items.length)]
  const q1 = 5 + Math.floor(Math.random() * (10 + diff * 3))
  const q2 = 3 + Math.floor(Math.random() * (8 + diff * 2))
  const scenarios = [
    { text: `${n1} tiene ${q1} ${item}. ${n2} le da ${q2} más. ¿Cuántos tiene ahora?`, answer: q1 + q2 },
    { text: `${n1} tiene ${q1 + q2} ${item}. Le da ${q2} a ${n2}. ¿Cuántos le quedan?`, answer: q1 },
    { text: `${n1} tiene ${q1} ${item}. ${n2} tiene ${q2} ${item}. ¿Cuántos tienen entre los dos?`, answer: q1 + q2 },
    { text: `${n1} tiene ${q1 + q2} ${item} y los reparte en partes iguales entre ${q2} amigos. ¿Cuántos le tocan a cada uno?`, answer: Math.round((q1 + q2) / q2) },
  ]
  if (diff >= 3) {
    scenarios.push(
      { text: `${n1} ${['camina', 'corre', 'nada'][Math.floor(Math.random() * 3)]} ${q1} metros por minuto durante ${q2} minutos. ¿Qué distancia recorre en total?`, answer: q1 * q2 },
      { text: `${n1} compra ${q1} ${item === 'canicas' ? 'bolsas de canicas' : item} por ${q2} ${['euros', 'pesos'][Math.floor(Math.random() * 2)]} cada ${item === 'canicas' ? 'bolsa' : 'uno'}. ¿Cuánto gasta en total?`, answer: q1 * q2 },
    )
  }
  const sc = scenarios[Math.floor(Math.random() * scenarios.length)]
  const { options, answer } = genOptions(sc.answer, 4, 3 + diff)
  return new PuzzleQuestion({
    text: `📝 ${sc.text}`,
    options: options.map(o => String(o)),
    answer,
    data: { category: 'math', subType: 'word', value: sc.answer }
  })
}

function genFractionVisual(diff) {
  const total = 4 + Math.floor(Math.random() * (2 + diff)) * 2
  const shaded = 1 + Math.floor(Math.random() * (total - 1))
  const { options, answer } = genOptions(shaded, 4, Math.max(1, Math.floor(total / 2)))
  return new PuzzleQuestion({
    text: `🥧 La torta tiene ${total} partes iguales y ${shaded} están coloreadas.\n¿Qué fracción representa la parte coloreada?`,
    options: options.map(o => `${o}/${total}`),
    answer,
    data: { category: 'math', subType: 'fraction', total, shaded }
  })
}

function genAreaVisual(diff) {
  const w = 2 + Math.floor(Math.random() * (2 + diff))
  const h = 2 + Math.floor(Math.random() * (2 + diff))
  const area = w * h
  const { options, answer } = genOptions(area, 4, Math.max(2, Math.floor(area / 2)))
  return new PuzzleQuestion({
    text: `📐 Un rectángulo mide ${w} × ${h} unidades.\n¿Cuál es su área (en unidades cuadradas)?`,
    options: options.map(o => String(o)),
    answer,
    data: { category: 'math', subType: 'area', w, h }
  })
}

export function createMathPuzzleEngine() {
  const engine = new PuzzleEngine({ category: 'math' })
  const generators = [genEquationVisual, genSequence, genWordProblem, genFractionVisual, genAreaVisual]
  generators.forEach(g => engine.register(g))
  return engine
}
