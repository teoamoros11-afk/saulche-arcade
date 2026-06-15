export class InvariantChecker {
  constructor({ history } = {}) {
    this.history = history
    this.invariants = new Map()
  }

  registerInvariant(gameId, invariant) {
    if (!this.invariants.has(gameId)) this.invariants.set(gameId, [])
    this.invariants.get(gameId).push({
      ...invariant,
      id: invariant.id || `${gameId}:inv:${invariant.name}:${Date.now()}`
    })
  }

  getInvariants(gameId) {
    return this.invariants.get(gameId) || []
  }

  async checkAll(page, gameId, { state, context } = {}) {
    const invs = this.getInvariants(gameId)
    const results = { gameId, allHold: true, checks: [], violations: [] }

    for (const inv of invs) {
      try {
        const holds = inv.check
          ? await page.evaluate(inv.check, state)
          : inv.checkState
            ? inv.checkState(state, context)
            : false
        const result = {
          id: inv.id, name: inv.name, holds,
          description: inv.description, severity: inv.severity || 'error'
        }
        results.checks.push(result)
        if (!holds) {
          results.allHold = false
          results.violations.push({
            invariant: inv.name,
            description: inv.description,
            state: state ? { ...state } : null,
            timestamp: Date.now()
          })
          if (this.history) {
            await this.history.record('invariant-violation', {
              gameId, invariant: inv.name, description: inv.description, state, timestamp: Date.now()
            })
          }
        }
      } catch (e) {
        const result = {
          id: inv.id, name: inv.name, holds: false,
          description: inv.description, error: e.message, severity: inv.severity || 'error'
        }
        results.checks.push(result)
        results.allHold = false
        results.violations.push({
          invariant: inv.name,
          error: e.message,
          timestamp: Date.now()
        })
      }
    }
    return results
  }

  async monitorOverTime(page, gameId, { intervalMs = 500, maxSamples = 20, state } = {}) {
    const snapshots = []
    for (let i = 0; i < maxSamples; i++) {
      const result = await this.checkAll(page, gameId, { state })
      snapshots.push({
        sample: i + 1,
        timestamp: Date.now(),
        allHold: result.allHold,
        violations: result.violations
      })
      if (result.violations.length > 0) break
      await new Promise(r => setTimeout(r, intervalMs))
    }
    return {
      gameId,
      samples: snapshots.length,
      intervalMs,
      snapshots,
      everViolated: snapshots.some(s => !s.allHold)
    }
  }

  static alwaysPositive(keys) {
    return (state) => {
      for (const k of keys) {
        if (typeof state[k] !== 'undefined' && state[k] < 0) return false
      }
      return true
    }
  }

  static scoreNonDecreasing(previousState) {
    return (currentState) => {
      const prevScore = previousState?.score ?? previousState?.puntuacion ?? -1
      const currScore = currentState?.score ?? currentState?.puntuacion ?? -1
      return currScore >= prevScore
    }
  }

  static livesInRange(maxLives) {
    return () => {
      if (typeof window.vidas !== 'undefined') return window.vidas >= 0 && window.vidas <= maxLives
      if (typeof window.lives !== 'undefined') return window.lives >= 0 && window.lives <= maxLives
      return true
    }
  }

  static levelInRange(maxLevel) {
    return () => {
      if (typeof window.level !== 'undefined') return window.level >= 0 && window.level <= maxLevel
      if (typeof window.nivel !== 'undefined') return window.nivel >= 0 && window.nivel <= maxLevel
      return true
    }
  }

  static canvasSizeStable() {
    return () => {
      const c = document.querySelector('canvas')
      if (!c) return true
      return c.width > 0 && c.height > 0 && !isNaN(c.width) && !isNaN(c.height)
    }
  }
}
