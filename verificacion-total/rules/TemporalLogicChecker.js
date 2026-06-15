export class TemporalLogicChecker {
  constructor({ history } = {}) {
    this.history = history
    this.properties = new Map()
  }

  defineProperty(gameId, property) {
    if (!this.properties.has(gameId)) this.properties.set(gameId, [])
    this.properties.get(gameId).push({
      ...property,
      id: property.id || `${gameId}:tl:${property.name}:${Date.now()}`
    })
  }

  getProperties(gameId) {
    return this.properties.get(gameId) || []
  }

  async checkAlways(page, gameId, { property, maxFrames = 60, intervalMs = 100 } = {}) {
    const prop = property || this.getProperties(gameId).find(p => p.type === 'always')
    if (!prop) return { type: 'always', passed: false, error: 'No always property defined' }

    const frames = []
    for (let i = 0; i < maxFrames; i++) {
      try {
        const holds = await page.evaluate(prop.check)
        frames.push({ frame: i, holds, timestamp: Date.now() })
        if (!holds) {
          return {
            type: 'always', name: prop.name, passed: false,
            failedAtFrame: i, frames,
            error: `Property '${prop.name}' failed at frame ${i}`
          }
        }
      } catch (e) {
        frames.push({ frame: i, holds: false, error: e.message })
        return { type: 'always', name: prop.name, passed: false, failedAtFrame: i, frames, error: e.message }
      }
      await new Promise(r => setTimeout(r, intervalMs))
    }
    return { type: 'always', name: prop.name, passed: true, frames }
  }

  async checkEventually(page, gameId, { property, maxAttempts = 100, intervalMs = 100 } = {}) {
    const prop = property || this.getProperties(gameId).find(p => p.type === 'eventually')
    if (!prop) return { type: 'eventually', passed: false, error: 'No eventually property defined' }

    for (let i = 0; i < maxAttempts; i++) {
      try {
        const holds = await page.evaluate(prop.check)
        if (holds) {
          return { type: 'eventually', name: prop.name, passed: true, achievedAtAttempt: i + 1 }
        }
      } catch (e) {
        await new Promise(r => setTimeout(r, intervalMs))
        continue
      }
      await new Promise(r => setTimeout(r, intervalMs))
    }
    return {
      type: 'eventually', name: prop.name, passed: false,
      error: `Property '${prop.name}' not achieved within ${maxAttempts} attempts`
    }
  }

  async checkUntil(page, gameId, { property, maxFrames = 100, intervalMs = 100 } = {}) {
    const prop = property || this.getProperties(gameId).find(p => p.type === 'until')
    if (!prop) return { type: 'until', passed: false, error: 'No until property defined' }

    const frames = []
    for (let i = 0; i < maxFrames; i++) {
      try {
        const holdsP = await page.evaluate(prop.checkP)
        const holdsQ = await page.evaluate(prop.checkQ)
        frames.push({ frame: i, holdsP, holdsQ, timestamp: Date.now() })
        if (holdsQ) {
          return { type: 'until', name: prop.name, passed: true, terminatedAtFrame: i, frames }
        }
        if (!holdsP) {
          return {
            type: 'until', name: prop.name, passed: false,
            failedAtFrame: i, frames,
            error: `P failed before Q held at frame ${i}`
          }
        }
      } catch (e) {
        frames.push({ frame: i, error: e.message })
        return { type: 'until', name: prop.name, passed: false, failedAtFrame: i, frames, error: e.message }
      }
      await new Promise(r => setTimeout(r, intervalMs))
    }
    return {
      type: 'until', name: prop.name, passed: false,
      error: `Q not achieved within ${maxFrames} frames while P held`
    }
  }

  async checkNext(page, gameId, { property, afterMs = 200 } = {}) {
    const prop = property || this.getProperties(gameId).find(p => p.type === 'next')
    if (!prop) return { type: 'next', passed: false, error: 'No next property defined' }

    try {
      const before = await page.evaluate(prop.check)
      await new Promise(r => setTimeout(r, afterMs))
      const after = await page.evaluate(prop.check)
      const passed = !before && after
      return {
        type: 'next', name: prop.name, passed,
        before, after, afterMs,
        error: passed ? null : `Property did not become true after ${afterMs}ms`
      }
    } catch (e) {
      return { type: 'next', name: prop.name, passed: false, error: e.message }
    }
  }

  async runAll(page, gameId) {
    const props = this.getProperties(gameId)
    const results = []
    for (const prop of props) {
      switch (prop.type) {
        case 'always':
          results.push(await this.checkAlways(page, gameId, { property: prop }))
          break
        case 'eventually':
          results.push(await this.checkEventually(page, gameId, { property: prop }))
          break
        case 'until':
          results.push(await this.checkUntil(page, gameId, { property: prop }))
          break
        case 'next':
          results.push(await this.checkNext(page, gameId, { property: prop }))
          break
      }
    }
    return { gameId, total: results.length, passed: results.filter(r => r.passed).length, results }
  }

  static scoreEventuallyAbove(threshold) {
    return {
      type: 'eventually',
      name: `score_above_${threshold}`,
      description: `Score eventually reaches ${threshold}`,
      check: () => {
        const s = window.score ?? window.puntuacion ?? -1
        return s >= threshold
      }
    }
  }

  static gameOverEventually() {
    return {
      type: 'eventually',
      name: 'game_over',
      description: 'Game over state is eventually reached',
      check: () => {
        const gs = window.gameState ?? window.state ?? ''
        return gs === 'gameover' || gs === 'game_over' || gs === 'over'
      }
    }
  }

  static canvasNeverBlank() {
    return {
      type: 'always',
      name: 'canvas_not_blank',
      description: 'Canvas is never completely blank',
      check: () => {
        const c = document.querySelector('canvas')
        if (!c) return false
        const ctx = c.getContext('2d')
        const d = ctx.getImageData(0, 0, c.width, c.height).data
        return d.some(v => v !== 0)
      }
    }
  }
}
