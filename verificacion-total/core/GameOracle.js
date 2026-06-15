export class GameOracle {
  constructor(specs) {
    this.specs = specs || {}
  }

  getExpectedInitialState(gameId) {
    const spec = this.specs[gameId]
    if (!spec) return null
    return spec.initialState || null
  }

  getExpectedBoard(gameId, boardState) {
    const spec = this.specs[gameId]
    if (!spec || !spec.boardValidator) return null
    return spec.boardValidator(boardState)
  }

  async validateAgainstSpec(page, gameId, adapter) {
    const spec = this.specs[gameId]
    if (!spec) return { valid: false, error: `No spec for ${gameId}` }

    const results = { valid: true, checks: [], errors: [] }

    const state = await adapter.getState(page)

    if (spec.initialState && spec.checkInitial) {
      const initOk = spec.checkInitial(state)
      results.checks.push({ name: 'initialState', passed: initOk, state })
      if (!initOk) { results.valid = false; results.errors.push('Initial state mismatch') }
    }

    if (spec.rules) {
      for (const rule of spec.rules) {
        try {
          const passed = await page.evaluate(rule.check)
          results.checks.push({ name: rule.name, passed, description: rule.description })
          if (!passed) { results.valid = false; results.errors.push(`Rule failed: ${rule.name}`) }
        } catch (e) {
          results.checks.push({ name: rule.name, passed: false, error: e.message })
          results.valid = false
          results.errors.push(`Rule error: ${rule.name}: ${e.message}`)
        }
      }
    }

    if (spec.invariants) {
      for (const inv of spec.invariants) {
        try {
          const passed = await page.evaluate(inv.check)
          results.checks.push({ name: `invariant:${inv.name}`, passed, description: inv.description })
          if (!passed) { results.valid = false; results.errors.push(`Invariant violated: ${inv.name}`) }
        } catch (e) {
          results.checks.push({ name: `invariant:${inv.name}`, passed: false, error: e.message })
          results.valid = false
        }
      }
    }

    if (spec.canvasChecks && spec.canvasChecks.length) {
      const canvasData = await page.evaluate(() => {
        const c = document.querySelector('canvas')
        if (!c) return null
        const ctx = c.getContext('2d')
        if (!ctx) return null
        return { width: c.width, height: c.height, fillStyle: ctx.fillStyle, strokeStyle: ctx.strokeStyle, font: ctx.font }
      })
      for (const check of spec.canvasChecks) {
        try {
          const passed = check(canvasData)
          results.checks.push({ name: `canvas:${check.name || 'unnamed'}`, passed })
          if (!passed) { results.valid = false; results.errors.push(`Canvas check failed: ${check.name}`) }
        } catch (e) {
          results.checks.push({ name: `canvas:${check.name}`, passed: false, error: e.message })
          results.valid = false
        }
      }
    }

    return results
  }

  async checkGameInvariants(page, gameId) {
    const spec = this.specs[gameId]
    if (!spec || !spec.invariants) return []

    const results = []
    for (const inv of spec.invariants) {
      try {
        const passed = await page.evaluate(inv.check)
        results.push({ name: inv.name, passed, description: inv.description })
      } catch (e) {
        results.push({ name: inv.name, passed: false, error: e.message })
      }
    }
    return results
  }

  registerSpec(gameId, spec) {
    this.specs[gameId] = spec
  }

  getSpec(gameId) {
    return this.specs[gameId] || null
  }
}
