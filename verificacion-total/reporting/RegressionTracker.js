import fs from 'fs'
import path from 'path'

export class RegressionTracker {
  constructor({ dataDir = './reports/regression' } = {}) {
    this.dataDir = dataDir
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true })
    this.baselines = this._loadBaselines()
    this.history = this._loadHistory()
  }

  _baselinePath() {
    return path.join(this.dataDir, 'baselines.json')
  }

  _historyPath() {
    return path.join(this.dataDir, 'history.jsonl')
  }

  _loadBaselines() {
    try {
      return JSON.parse(fs.readFileSync(this._baselinePath(), 'utf-8'))
    } catch {
      return {}
    }
  }

  _loadHistory() {
    try {
      const content = fs.readFileSync(this._historyPath(), 'utf-8').trim()
      if (!content) return []
      return content.split('\n').map(l => JSON.parse(l))
    } catch {
      return []
    }
  }

  _saveBaselines() {
    fs.writeFileSync(this._baselinePath(), JSON.stringify(this.baselines, null, 2), 'utf-8')
  }

  _appendHistory(entry) {
    this.history.push(entry)
    fs.appendFileSync(this._historyPath(), JSON.stringify(entry) + '\n', 'utf-8')
  }

  setBaseline(runId, results) {
    this.baselines[runId] = {
      runId,
      timestamp: Date.now(),
      results: this._summarizeResults(results)
    }
    this._saveBaselines()
  }

  getBaseline(runId) {
    return this.baselines[runId] || null
  }

  getLatestBaseline() {
    const ids = Object.keys(this.baselines)
    if (!ids.length) return null
    return this.baselines[ids.sort((a, b) => (this.baselines[b].timestamp || 0) - (this.baselines[a].timestamp || 0))[0]]
  }

  recordRun(runData) {
    const entry = {
      runId: runData.runId || `run-${Date.now()}`,
      timestamp: Date.now(),
      duration: runData.duration || 0,
      results: this._summarizeResults(runData.results || {}),
      commitHash: runData.commitHash || null,
      branch: runData.branch || null
    }
    this._appendHistory(entry)
    return entry
  }

  detectRegressions(currentResults, baselineId) {
    const baseline = baselineId
      ? this.getBaseline(baselineId)
      : this.getLatestBaseline()

    if (!baseline) return { hasRegression: false, error: 'No baseline available', regressions: [] }

    const current = this._summarizeResults(currentResults)
    const previous = baseline.results
    const regressions = []

    if (current.totalGames > 0 && previous.totalGames > 0) {
      if (current.passRate < previous.passRate) {
        regressions.push({
          type: 'pass_rate_drop',
          description: `Pass rate dropped from ${previous.passRate}% to ${current.passRate}%`,
          previous: previous.passRate,
          current: current.passRate,
          delta: current.passRate - previous.passRate,
          severity: current.passRate < previous.passRate * 0.9 ? 'critical' : 'warning'
        })
      }
    }

    if (previous.perGame) {
      for (const [gameId, prev] of Object.entries(previous.perGame)) {
        const curr = current.perGame?.[gameId]
        if (!curr) {
          regressions.push({
            type: 'game_missing',
            description: `Game '${gameId}' no longer has results`,
            severity: 'critical'
          })
          continue
        }
        if (curr.passRate < prev.passRate) {
          regressions.push({
            type: 'game_pass_rate_drop',
            gameId,
            description: `'${gameId}' pass rate dropped from ${prev.passRate}% to ${curr.passRate}%`,
            previous: prev.passRate,
            current: curr.passRate,
            delta: curr.passRate - prev.passRate,
            severity: curr.passRate < prev.passRate * 0.9 ? 'critical' : 'warning'
          })
        }
      }
    }

    return {
      hasRegression: regressions.length > 0,
      baselineId: baseline.runId,
      baselineTimestamp: baseline.timestamp,
      regressions,
      regressionsCount: regressions.length,
      critical: regressions.filter(r => r.severity === 'critical').length,
      warnings: regressions.filter(r => r.severity === 'warning').length
    }
  }

  getHistory({ limit = 10, gameId } = {}) {
    let entries = this.history
    if (gameId) {
      entries = entries.filter(e => e.results?.perGame?.[gameId])
    }
    return entries.slice(-limit)
  }

  getTrend(gameId, metric = 'passRate') {
    const relevant = this.history.filter(e => e.results?.perGame?.[gameId])
    return relevant.map(e => ({
      timestamp: e.timestamp,
      runId: e.runId,
      value: e.results.perGame[gameId][metric]
    }))
  }

  getOverallTrend() {
    return this.history.map(e => ({
      timestamp: e.timestamp,
      runId: e.runId,
      passRate: e.results.passRate,
      totalTests: e.results.totalTests,
      failed: e.results.failed
    }))
  }

  _summarizeResults(results) {
    let totalGames = 0, totalTests = 0, passed = 0, failed = 0, skipped = 0

    const perGame = {}

    for (const [gameId, gameResult] of Object.entries(results)) {
      totalGames++
      const tests = gameResult.results || [gameResult]
      let gPassed = 0, gFailed = 0, gSkipped = 0
      for (const t of tests) {
        totalTests++
        if (t.passed) { passed++; gPassed++ }
        else if (t.skipped) { skipped++; gSkipped++ }
        else { failed++; gFailed++ }
      }
      perGame[gameId] = {
        totalTests: tests.length,
        passed: gPassed,
        failed: gFailed,
        skipped: gSkipped,
        passRate: tests.length > 0 ? ((gPassed / tests.length) * 100).toFixed(1) : 0
      }
    }

    return {
      totalGames,
      totalTests,
      passed,
      failed,
      skipped,
      passRate: totalTests > 0 ? ((passed / totalTests) * 100).toFixed(1) : 0,
      perGame
    }
  }
}
