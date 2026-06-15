export class StateInspector {
  constructor(page) {
    this.page = page
  }

  async inspect() {
    return this.page.evaluate(() => {
      const result = {}

      const globals = ['gameState', 'state', 'st', 'level', 'score', 'best', 'lives',
        'over', 'win', 'gameOver', 'gameActive', 'playing', 'turn',
        'foodEaten', 'needed', 'snake', 'pieces', 'board', 'rows', 'cols']

      for (const g of globals) {
        if (typeof window[g] !== 'undefined') {
          result[g] = typeof window[g] === 'object'
            ? JSON.parse(JSON.stringify(window[g], (k, v) => k === 'parent' ? undefined : v))
            : window[g]
        }
      }

      result._localStorage = {}
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i)
        result._localStorage[k] = localStorage.getItem(k)
      }

      result._canvas = (() => {
        const c = document.querySelector('canvas')
        if (!c) return null
        return { width: c.width, height: c.height, id: c.id || 'none' }
      })()

      return result
    })
  }

  async dump(description) {
    const state = await this.inspect()
    const relevant = Object.fromEntries(
      Object.entries(state).filter(([k]) => !k.startsWith('_'))
    )
  }
}
