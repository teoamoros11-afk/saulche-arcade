import PuzzleEngine, { PuzzleQuestion } from './Engine.js'

function shuffle(arr) { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]] }; return a }

function genOptions(correct, count = 4) {
  const opts = new Set([correct])
  let attempts = 0
  while (opts.size < count && attempts < 50) {
    const d = correct + Math.floor(Math.random() * 8 - 4)
    if (d >= 1 && d !== correct) opts.add(d)
    attempts++
  }
  while (opts.size < count) opts.add(opts.size + 1)
  const arr = shuffle([...opts])
  return { options: arr.map(o => String(o)), answer: arr.indexOf(correct) }
}

function genTowersOfHanoi(diff) {
  const disks = 3 + Math.floor(Math.min(diff, 3))
  const minMoves = Math.pow(2, disks) - 1
  const { options, answer } = genOptions(minMoves, 4)
  return new PuzzleQuestion({
    text: `🗼 Torres de Hanoi\n${disks} discos.\nPásalos todos al tercer poste.\nSolo puedes mover un disco a la vez y no puedes poner un disco grande sobre uno pequeño.\n\n¿Cuál es el número MÍNIMO de movimientos?`,
    options,
    answer,
    data: { category: 'strategy', subType: 'hanoi', disks, minMoves }
  })
}

function genBridgeCrossing(diff) {
  const times = shuffle([1, 2, 5, 8, 10, 13].slice(0, 4 + Math.floor(Math.min(diff, 2))))
  const sorted = [...times].sort((a, b) => a - b)
  const n = times.length
  let optimal = 0
  if (n <= 2) optimal = Math.max(...sorted)
  else if (n === 3) optimal = sorted[0] + sorted[1] + sorted[2]
  else {
    const a = sorted[0], b = sorted[1]
    for (let i = n - 1; i >= 0; i -= 2) {
      if (i === 1) { optimal += b; break }
      if (i === 2) { optimal += a + sorted[1] + sorted[2]; break }
      optimal += Math.min(2 * a + sorted[i] + sorted[i - 1], a + 2 * b + sorted[i])
    }
  }
  const { options, answer } = genOptions(optimal, 4)
  return new PuzzleQuestion({
    text: `🌉 ${n} personas cruzan un puente. Llevan una linterna.\nTiempos: ${times.join(', ')} segundos.\nEl puente solo soporta a 2 personas a la vez.\nSin linterna no pueden cruzar.\n\n¿Cuál es el tiempo MÍNIMO total (en segundos)?`,
    options: options.map(o => o + 's'),
    answer,
    data: { category: 'strategy', subType: 'bridge', optimal }
  })
}

function genWaterJug(diff) {
  const cap1 = 5 + Math.floor(Math.random() * (3 + diff * 2))
  const cap2 = 3 + Math.floor(Math.random() * (3 + diff))
  const target = 2 + Math.floor(Math.random() * Math.min(cap1, cap2) - 1)
  if (target < 1) target = 1
  const answer = target
  const { options: opts, answer: optAns } = genOptions(target, 4)
  return new PuzzleQuestion({
    text: `🫗 Jarras de agua.\nJarra A: ${cap1} litros\nJarra B: ${cap2} litros\nTienes un grifo que llena las jarras.\nPuedes llenar, vaciar, o verter de una a otra.\n\n¿Cuántos litros puedes medir EXACTAMENTE?`,
    options: opts.map(o => o + 'L'),
    answer: optAns,
    data: { category: 'strategy', subType: 'water', target }
  })
}

function genOptimization(diff) {
  const items = [
    { name: 'Manzanas', value: 3, weight: 2 },
    { name: 'Pan', value: 5, weight: 3 },
    { name: 'Agua', value: 4, weight: 2 },
    { name: 'Libro', value: 6, weight: 4 },
    { name: 'Linterna', value: 2, weight: 1 },
    { name: 'Manta', value: 3, weight: 3 },
    { name: 'Comida', value: 7, weight: 5 },
    { name: 'Botiquín', value: 8, weight: 3 },
  ]
  const selected = shuffle(items).slice(0, 4 + Math.floor(Math.min(diff, 2)))
  const capacity = selected.reduce((s, i) => s + i.weight, 0) / 2 + Math.floor(Math.random() * 2)
  const cap = Math.floor(capacity)
  const dp = Array(cap + 1).fill(0)
  for (const item of selected) {
    for (let w = cap; w >= item.weight; w--) {
      dp[w] = Math.max(dp[w], dp[w - item.weight] + item.value)
    }
  }
  const optimal = Math.max(...dp)
  const { options, answer } = genOptions(optimal, 4)
  const listStr = selected.map(i => `${i.name}: ${i.value}pts, ${i.weight}kg`).join('\n')
  return new PuzzleQuestion({
    text: `🎒 Mochila (capacidad: ${cap}kg)\n\n${listStr}\n\n¿Cuál es el valor MÁXIMO que puedes llevar?`,
    options: options.map(o => o + ' pts'),
    answer,
    data: { category: 'strategy', subType: 'optimize', optimal }
  })
}

function genRiverCrossing(diff) {
  const animals = ['🐺 Lobo', '🐑 Oveja', '🥬 Lechuga', '🐔 Gallina', '🌾 Trigo']
  const sel = animals.slice(0, 3 + Math.floor(Math.min(diff, 1)))
  const n = sel.length
  let boatTrips = n + (n - 1)
  const { options, answer } = genOptions(boatTrips, 4)
  return new PuzzleQuestion({
    text: `🚣 Cruce del río.\n${sel.join(', ')}.\nEl bote solo lleva 1 cosa además de ti.\nNo puedes dejar solos a: Lobo+Oveja, Oveja+Lechuga, Gallina+Trigo.\n\n¿Cuál es el número MÍNIMO de viajes?`,
    options: options.map(o => o + ' viajes'),
    answer,
    data: { category: 'strategy', subType: 'river', trips: boatTrips }
  })
}

export function createStrategyPuzzleEngine() {
  const engine = new PuzzleEngine({ category: 'strategy' })
  const generators = [genTowersOfHanoi, genOptimization, genWaterJug, genRiverCrossing]
  if (Math.random() > 0.5) generators.push(genBridgeCrossing)
  generators.forEach(g => engine.register(g))
  return engine
}
