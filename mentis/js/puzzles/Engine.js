export class PuzzleResult {
  constructor({ correct, xp, stars, time }) {
    this.correct = correct
    this.xp = xp || (correct ? Math.max(10, 50 - Math.floor(time || 0)) : 0)
    this.stars = stars ?? (correct ? 1 : 0)
    this.time = time || 0
  }
}

export default class PuzzleEngine {
  constructor(config = {}) {
    this.category = config.category || 'generic'
    this.difficulty = config.difficulty || 1
    this._generators = []
    this._current = null
    this._startTime = 0
    this._solved = false
  }
  register(generator) { this._generators.push(generator) }
  generate(difficulty) {
    this.difficulty = difficulty || this.difficulty
    const gen = this._generators[Math.floor(Math.random() * this._generators.length)]
    this._current = gen(this.difficulty)
    this._solved = false
    this._startTime = Date.now()
    return this._current
  }
  get current() { return this._current }
  get elapsed() { return (Date.now() - this._startTime) / 1000 }
  check(answer) {
    if (this._solved) return null
    const correct = this._current?.check?.(answer) ?? false
    const time = this.elapsed
    if (correct) {
      this._solved = true
      const timeBonus = Math.max(0, Math.floor(15 - time) * 2)
      const stars = time < 5 ? 3 : time < 12 ? 2 : 1
      return new PuzzleResult({ correct: true, xp: 25 + timeBonus, stars, time })
    }
    return new PuzzleResult({ correct: false, xp: 0, stars: 0, time })
  }
  reset() {
    this._current = null
    this._solved = false
    this._startTime = 0
  }
}

export class PuzzleQuestion {
  constructor({ text, options, answer, renderer, check, data }) {
    this.text = text
    this.options = options || []
    this.answer = answer ?? 0
    this.renderer = renderer || null
    this.check = check || ((a) => a === this.answer)
    this.data = data || {}
    this.id = Math.random().toString(36).slice(2, 8)
  }
}
