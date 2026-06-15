import fs from 'fs'
import path from 'path'

export class ReportGenerator {
  constructor({ reportDir = './reports', history } = {}) {
    this.reportDir = reportDir
    this.history = history
    if (!fs.existsSync(reportDir)) fs.mkdirSync(reportDir, { recursive: true })
  }

  generateSummary(allResults) {
    const summary = {
      timestamp: new Date().toISOString(),
      totalGames: 0,
      totalTests: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      warnings: 0,
      passRate: 0,
      categories: {},
      gameResults: {}
    }

    for (const [gameId, gameResult] of Object.entries(allResults)) {
      summary.totalGames++
      summary.gameResults[gameId] = { passed: 0, failed: 0, skipped: 0, warnings: 0, total: 0 }

      for (const result of (gameResult.results || [gameResult])) {
        summary.totalTests++
        summary.gameResults[gameId].total++
        const status = result.passed ? 'passed' : result.skipped ? 'skipped' : 'failed'
        summary[status]++
        summary.gameResults[gameId][status]++
        if (result.warnings?.length) {
          summary.warnings += result.warnings.length
          summary.gameResults[gameId].warnings += result.warnings.length
        }
      }
    }

    summary.passRate = summary.totalTests > 0
      ? ((summary.passed / summary.totalTests) * 100).toFixed(1)
      : 0

    return summary
  }

  generateMarkdownReport(allResults, { title = 'Verification Report' } = {}) {
    const summary = this.generateSummary(allResults)
    const lines = [
      `# ${title}`,
      '',
      `**Date:** ${summary.timestamp}`,
      `**Games:** ${summary.totalGames} | **Tests:** ${summary.totalTests}`,
      `**Passed:** ${summary.passed} | **Failed:** ${summary.failed} | **Skipped:** ${summary.skipped} | **Warnings:** ${summary.warnings}`,
      `**Pass Rate:** ${summary.passRate}%`,
      '',
      '---',
      '',
      '## Results by Game',
      '',
      '| Game | Total | Passed | Failed | Skipped | Warnings | Pass Rate |',
      '|------|-------|--------|--------|---------|----------|-----------|',
    ]

    for (const [gameId, gr] of Object.entries(summary.gameResults)) {
      const rate = gr.total > 0 ? ((gr.passed / gr.total) * 100).toFixed(1) + '%' : 'N/A'
      lines.push(`| ${gameId} | ${gr.total} | ${gr.passed} | ${gr.failed} | ${gr.skipped} | ${gr.warnings} | ${rate} |`)
    }

    lines.push('', '---', '', '## Failed Tests', '')
    for (const [gameId, gameResult] of Object.entries(allResults)) {
      for (const result of (gameResult.results || [gameResult])) {
        if (!result.passed) {
          lines.push(`### ${gameId}: ${result.name || 'unnamed'}`, '')
          if (result.error) lines.push(`**Error:** ${result.error}`, '')
          if (result.errors?.length) {
            lines.push('**Errors:**', '')
            for (const e of result.errors) lines.push(`- ${e}`)
          }
          lines.push('')
        }
      }
    }

    lines.push('---', '', '## Warnings', '')
    let warnCount = 0
    for (const [gameId, gameResult] of Object.entries(allResults)) {
      for (const result of (gameResult.results || [gameResult])) {
        if (result.warnings?.length) {
          for (const w of result.warnings) {
            lines.push(`- **${gameId}:** ${w}`)
            warnCount++
          }
        }
      }
    }
    if (warnCount === 0) lines.push('No warnings.')

    return lines.join('\n')
  }

  generateJSON(allResults) {
    return JSON.stringify(this.generateSummary(allResults), null, 2)
  }

  saveReport(allResults, { format = 'md', filename } = {}) {
    const ts = new Date().toISOString().replace(/[:.]/g, '-')
    const name = filename || `report-${ts}`
    const ext = format === 'json' ? 'json' : 'md'
    const fp = path.join(this.reportDir, `${name}.${ext}`)

    const content = format === 'json'
      ? this.generateJSON(allResults)
      : this.generateMarkdownReport(allResults)

    fs.writeFileSync(fp, content, 'utf-8')
    return fp
  }

  async saveFullReport(allResults, { title } = {}) {
    const baseName = `report-full-${new Date().toISOString().replace(/[:.]/g, '-')}`
    const mdPath = this.saveReport(allResults, { format: 'md', filename: baseName, title })
    const jsonPath = this.saveReport(allResults, { format: 'json', filename: baseName })
    return { mdPath, jsonPath }
  }

  generateHTMLReport(allResults, { title = 'Verification Report' } = {}) {
    const summary = this.generateSummary(allResults)
    const gameRows = Object.entries(summary.gameResults).map(([gameId, gr]) => {
      const rate = gr.total > 0 ? ((gr.passed / gr.total) * 100).toFixed(1) : 0
      const color = rate >= 90 ? '#4caf50' : rate >= 70 ? '#ff9800' : '#f44336'
      return `
        <tr>
          <td>${gameId}</td>
          <td>${gr.total}</td>
          <td style="color:#4caf50">${gr.passed}</td>
          <td style="color:#f44336">${gr.failed}</td>
          <td>${gr.skipped}</td>
          <td>${gr.warnings}</td>
          <td style="color:${color};font-weight:bold">${rate}%</td>
        </tr>`
    }).join('')

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
<style>
  body { background:#0f0f1a; color:#e0e0e0; font-family:monospace; padding:2rem; }
  h1 { color:#fff; border-bottom:2px solid #333; }
  .summary { background:#1a1a2e; padding:1.5rem; border-radius:12px; border:1px solid #333; margin:1rem 0; }
  .summary span { margin-right:2rem; }
  .pass { color:#4caf50 } .fail { color:#f44336 } .warn { color:#ff9800 } .skip { color:#9e9e9e }
  table { width:100%; border-collapse:collapse; margin:1rem 0; }
  th, td { padding:0.75rem; text-align:left; border-bottom:1px solid #333; }
  th { background:#1a1a2e; color:#fff; }
  tr:hover { background:#1a1a2e; }
  .error { color:#f44336; }
</style>
</head>
<body>
<h1>${title}</h1>
<div class="summary">
  <span>Games: <strong>${summary.totalGames}</strong></span>
  <span>Tests: <strong>${summary.totalTests}</strong></span>
  <span class="pass">Passed: ${summary.passed}</span>
  <span class="fail">Failed: ${summary.failed}</span>
  <span class="skip">Skipped: ${summary.skipped}</span>
  <span class="warn">Warnings: ${summary.warnings}</span>
  <span>Pass Rate: <strong>${summary.passRate}%</strong></span>
</div>
<h2>Results by Game</h2>
<table>
  <tr><th>Game</th><th>Total</th><th>Passed</th><th>Failed</th><th>Skipped</th><th>Warnings</th><th>Pass Rate</th></tr>
  ${gameRows}
</table>
</body>
</html>`
  }

  saveHTMLReport(allResults, { title, filename } = {}) {
    const ts = new Date().toISOString().replace(/[:.]/g, '-')
    const name = filename || `report-${ts}`
    const fp = path.join(this.reportDir, `${name}.html`)
    fs.writeFileSync(fp, this.generateHTMLReport(allResults, { title }), 'utf-8')
    return fp
  }
}
