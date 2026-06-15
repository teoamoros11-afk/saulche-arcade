import fs from 'fs'
import path from 'path'

export class HistoryRecorder {
  constructor({ historyDir = './reports/history' } = {}) {
    this.historyDir = historyDir
    if (!fs.existsSync(historyDir)) fs.mkdirSync(historyDir, { recursive: true })
    this.log = []
    this.sessionId = new Date().toISOString().replace(/[:.]/g, '-')
    this._filePath = path.join(historyDir, `${this.sessionId}.jsonl`)
  }

  record(eventType, data) {
    const entry = {
      timestamp: Date.now(),
      sessionId: this.sessionId,
      eventType,
      ...data
    }
    this.log.push(entry)
    fs.appendFileSync(this._filePath, JSON.stringify(entry) + '\n')
    return entry
  }

  recordGameTest(gameId, testName, passed, details = {}) {
    return this.record('game_test', { gameId, testName, passed, ...details })
  }

  recordPixelDiff(gameId, snapshotName, diffCount, totalPixels, details = {}) {
    return this.record('pixel_diff', { gameId, snapshotName, diffCount, totalPixels, pct: totalPixels > 0 ? (diffCount / totalPixels) * 100 : 0, ...details })
  }

  recordAssertion(gameId, ruleName, passed, expected, actual) {
    return this.record('assertion', { gameId, ruleName, passed, expected, actual })
  }

  recordConsoleError(gameId, message, source, line) {
    return this.record('console_error', { gameId, message, source, line })
  }

  recordStateTransition(gameId, fromState, toState, input) {
    return this.record('state_transition', { gameId, fromState, toState, input })
  }

  recordPerfMetric(gameId, metric, value, unit) {
    return this.record('perf_metric', { gameId, metric, value, unit })
  }

  recordCrash(gameId, error, stack, context) {
    return this.record('crash', { gameId, error, stack, context })
  }

  getAllForSession(sessionId) {
    const fp = path.join(this.historyDir, `${sessionId}.jsonl`)
    if (!fs.existsSync(fp)) return []
    return fs.readFileSync(fp, 'utf-8').split('\n').filter(Boolean).map(l => JSON.parse(l))
  }

  getAllSessions() {
    if (!fs.existsSync(this.historyDir)) return []
    return fs.readdirSync(this.historyDir)
      .filter(f => f.endsWith('.jsonl'))
      .map(f => f.replace('.jsonl', ''))
  }

  getLatestSession() {
    const sessions = this.getAllSessions()
    if (!sessions.length) return null
    return sessions.sort().pop()
  }

  getSummaryForGame(gameId, sessionId) {
    const logs = sessionId ? this.getAllForSession(sessionId) : this.log
    const gameLogs = logs.filter(l => l.gameId === gameId)
    const total = gameLogs.length
    const passed = gameLogs.filter(l => l.passed === true).length
    const failed = gameLogs.filter(l => l.passed === false).length
    const errors = gameLogs.filter(l => l.eventType === 'console_error').length
    return { gameId, total, passed, failed, errors, ratio: total > 0 ? `${passed}/${total}` : '0/0' }
  }

  getGlobalSummary(sessionId) {
    const logs = sessionId ? this.getAllForSession(sessionId) : this.log
    const games = [...new Set(logs.filter(l => l.gameId).map(l => l.gameId))]
    const summaries = games.map(g => this.getSummaryForGame(g, sessionId))
    const total = summaries.reduce((a, s) => a + s.total, 0)
    const passed = summaries.reduce((a, s) => a + s.passed, 0)
    const failed = summaries.reduce((a, s) => a + s.failed, 0)
    return { sessionId: sessionId || this.sessionId, games: summaries.length, totalTests: total, passed, failed, passRate: total > 0 ? ((passed / total) * 100).toFixed(2) + '%' : '0%' }
  }
}
