export class RuleEngine {
  constructor({ history } = {}) {
    this.history = history
    this.ruleRegistry = new Map()
  }

  registerRule(gameId, rule) {
    if (!this.ruleRegistry.has(gameId)) this.ruleRegistry.set(gameId, [])
    this.ruleRegistry.get(gameId).push({
      ...rule,
      id: rule.id || `${gameId}:${rule.name}:${Date.now()}`
    })
  }

  getRules(gameId) {
    return this.ruleRegistry.get(gameId) || []
  }

  async evaluateRules(page, gameId, { state, context } = {}) {
    const rules = this.getRules(gameId)
    const results = { gameId, passed: true, ruleResults: [], errors: [] }

    for (const rule of rules) {
      try {
        const passed = rule.check
          ? await page.evaluate(rule.check)
          : rule.checkState
            ? rule.checkState(state)
            : false
        const result = {
          id: rule.id, name: rule.name, category: rule.category || 'general',
          passed, description: rule.description, severity: rule.severity || 'error'
        }
        results.ruleResults.push(result)
        if (!passed && rule.severity !== 'warning') {
          results.passed = false
          results.errors.push(`Rule '${rule.name}': ${rule.description}`)
        }
        if (this.history) {
          await this.history.record('rule', { gameId, rule: rule.name, passed, timestamp: Date.now() })
        }
      } catch (e) {
        const result = {
          id: rule.id, name: rule.name, category: rule.category || 'general',
          passed: false, description: rule.description, error: e.message, severity: rule.severity || 'error'
        }
        results.ruleResults.push(result)
        results.passed = false
        results.errors.push(`Rule '${rule.name}' threw: ${e.message}`)
      }
    }
    return results
  }

  async evaluateAll(page, specs) {
    const allResults = {}
    for (const [gameId] of specs) {
      allResults[gameId] = await this.evaluateRules(page, gameId)
    }
    return allResults
  }

  getFailedRules(page, gameId) {
    return this.evaluateRules(page, gameId).then(r =>
      r.ruleResults.filter(rr => !rr.passed)
    )
  }

  getSummary(results) {
    let total = 0, passed = 0, failed = 0, warnings = 0
    for (const r of Object.values(results)) {
      for (const rr of r.ruleResults) {
        total++
        if (rr.passed) passed++
        else if (rr.severity === 'warning') warnings++
        else failed++
      }
    }
    return { total, passed, failed, warnings, passRate: total > 0 ? ((passed / total) * 100).toFixed(1) + '%' : '0%' }
  }

  loadRuleFile(ruleModule) {
    if (ruleModule.rules) {
      for (const [gameId, rules] of Object.entries(ruleModule.rules)) {
        for (const rule of rules) {
          this.registerRule(gameId, rule)
        }
      }
    }
  }
}
