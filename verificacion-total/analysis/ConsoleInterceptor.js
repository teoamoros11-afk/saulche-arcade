export class ConsoleInterceptor {
  constructor(page) {
    this.page = page
    this.errors = []
    this.warnings = []
    this.logs = []
    this._setup()
  }

  _setup() {
    this.page.on('console', msg => {
      const text = msg.text()
      const type = msg.type()
      const loc = msg.location()
      const entry = {
        type,
        text,
        url: loc?.url || '',
        line: loc?.lineNumber || 0,
        column: loc?.columnNumber || 0,
        timestamp: Date.now()
      }
      if (type === 'error') this.errors.push(entry)
      else if (type === 'warning') this.warnings.push(entry)
      else this.logs.push(entry)
    })

    this.page.on('pageerror', err => {
      this.errors.push({
        type: 'pageerror',
        text: err.message,
        stack: err.stack,
        url: '',
        line: 0,
        column: 0,
        timestamp: Date.now()
      })
    })
  }

  getErrors() { return [...this.errors] }

  getWarnings() { return [...this.warnings] }

  getAll() { return { errors: this.getErrors(), warnings: this.getWarnings(), logs: [...this.logs] } }

  hasErrors() { return this.errors.length > 0 }

  hasWarnings() { return this.warnings.length > 0 }

  getCriticalErrors() {
    return this.errors.filter(e => {
      const critical = ['TypeError', 'ReferenceError', 'SyntaxError', 'RangeError', 'URIError', 'SecurityError', 'InternalError', 'OutOfMemory']
      return critical.some(c => e.text.includes(c) || e.stack?.includes(c))
    })
  }

  getJSErrors() {
    return this.errors.filter(e => e.type === 'pageerror')
  }

  getNetworkErrors() {
    return this.errors.filter(e => e.text.includes('404') || e.text.includes('500') || e.text.includes('Failed to load') || e.text.includes('net::'))
  }

  clear() {
    this.errors = []
    this.warnings = []
    this.logs = []
  }

  summary() {
    return {
      totalErrors: this.errors.length,
      totalWarnings: this.warnings.length,
      totalLogs: this.logs.length,
      criticalErrors: this.getCriticalErrors().length,
      jsErrors: this.getJSErrors().length,
      networkErrors: this.getNetworkErrors().length,
      errorMessages: this.errors.map(e => `[${e.type}] ${e.text.slice(0, 200)}`),
      hasCriticalIssues: this.getCriticalErrors().length > 0
    }
  }
}
