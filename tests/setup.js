import { chromium } from '@playwright/test'

const GAMES_DIR = process.cwd()

export function gameUrl(filename) {
  return `file://${GAMES_DIR}/${filename}`
}

export async function createPage(browser) {
  const context = await browser.newContext({
    viewport: { width: 800, height: 600 },
    permissions: [],
  })
  const page = await context.newPage()
  page.on('console', () => {})
  page.on('pageerror', err => { throw err })
  return page
}

export function collectConsoleErrors(page) {
  const errors = []
  page.on('pageerror', err => {
    if (!err.message.includes('register a ServiceWorker')) errors.push(err.message)
  })
  page.on('console', msg => {
    if (msg.type() === 'error' && !msg.text().includes('register a ServiceWorker')) errors.push(msg.text())
  })
  return errors
}
