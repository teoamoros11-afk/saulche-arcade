export class StatsAggregator {
  constructor() {
    this.data = {
      runs: [],
      games: new Map()
    }
  }

  recordRun(runData) {
    this.data.runs.push({
      ...runData,
      timestamp: runData.timestamp || Date.now()
    })
  }

  recordGameResult(gameId, result) {
    if (!this.data.games.has(gameId)) this.data.games.set(gameId, [])
    this.data.games.get(gameId).push({
      ...result,
      timestamp: Date.now()
    })
  }

  getRuns({ limit = 10, since } = {}) {
    let runs = this.data.runs
    if (since) runs = runs.filter(r => r.timestamp >= since)
    return runs.slice(-limit)
  }

  getGameHistory(gameId) {
    return this.data.games.get(gameId) || []
  }

  getOverallStats() {
    const allResults = this.data.runs.flatMap(r => r.results || [])
    const total = allResults.length
    const passed = allResults.filter(r => r.passed).length
    const failed = allResults.filter(r => !r.passed && !r.skipped).length
    const skipped = allResults.filter(r => r.skipped).length

    return {
      totalRuns: this.data.runs.length,
      totalTests: total,
      passed,
      failed,
      skipped,
      passRate: total > 0 ? ((passed / total) * 100).toFixed(1) : 0,
      averageDuration: this._avg(this.data.runs, 'duration'),
      totalDuration: this.data.runs.reduce((s, r) => s + (r.duration || 0), 0)
    }
  }

  getGameStats(gameId) {
    const history = this.getGameHistory(gameId)
    if (!history.length) return null

    const total = history.length
    const passed = history.filter(h => h.passed).length
    const failed = history.filter(h => !h.passed).length

    return {
      gameId,
      totalRuns: total,
      passed,
      failed,
      passRate: ((passed / total) * 100).toFixed(1),
      lastRun: history[history.length - 1],
      firstRun: history[0],
      averageDuration: this._avg(history, 'duration')
    }
  }

  getCategoryStats(category) {
    const results = this.data.runs.flatMap(r => (r.results || []).filter(res => res.category === category))
    const total = results.length
    const passed = results.filter(r => r.passed).length

    return {
      category,
      total,
      passed,
      failed: total - passed,
      passRate: total > 0 ? ((passed / total) * 100).toFixed(1) : 0
    }
  }

  getPerGameStats() {
    const stats = {}
    for (const [gameId] of this.data.games) {
      stats[gameId] = this.getGameStats(gameId)
    }
    return stats
  }

  getTopFailures(limit = 10) {
    const failures = []
    for (const [gameId, history] of this.data.games) {
      const failed = history.filter(h => !h.passed)
      for (const f of failed) {
        failures.push({ gameId, ...f })
      }
    }
    return failures.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)).slice(0, limit)
  }

  getSlowestGames(limit = 5) {
    const withAvg = Object.entries(this.getPerGameStats())
      .filter(([, s]) => s.averageDuration > 0)
      .sort(([, a], [, b]) => b.averageDuration - a.averageDuration)
    return withAvg.slice(0, limit).map(([id, s]) => ({ gameId: id, avgDuration: s.averageDuration }))
  }

  getAllGameSummaries() {
    const summaries = []
    for (const [gameId] of this.data.games) {
      const stats = this.getGameStats(gameId)
      if (stats) summaries.push(stats)
    }
    return summaries
  }

  toJSON() {
    return {
      overall: this.getOverallStats(),
      perGame: this.getPerGameStats(),
      topFailures: this.getTopFailures(),
      slowestGames: this.getSlowestGames(),
      totalRuns: this.data.runs.length
    }
  }

  _avg(arr, field) {
    const vals = arr.filter(a => typeof a[field] !== 'undefined')
    if (!vals.length) return 0
    return vals.reduce((s, v) => s + v[field], 0) / vals.length
  }

  reset() {
    this.data.runs = []
    this.data.games.clear()
  }

  merge(other) {
    this.data.runs.push(...other.data.runs)
    for (const [gameId, history] of other.data.games) {
      if (!this.data.games.has(gameId)) this.data.games.set(gameId, [])
      this.data.games.get(gameId).push(...history)
    }
  }
}
