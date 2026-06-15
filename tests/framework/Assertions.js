import { expect } from '@playwright/test'

export async function expectNoConsoleErrors(page) {
  const errors = []
  const handler = msg => { if (msg.type() === 'error') errors.push(msg.text()) }
  page.on('console', handler)
  await page.waitForTimeout(200)
  page.off('console', handler)
  expect(errors).toEqual([])
}

export async function expectCanvasExists(page, canvasId) {
  const canvas = canvasId
    ? page.locator(`#${canvasId}`)
    : page.locator('canvas').first()
  await expect(canvas).toBeVisible()
  const valid = await page.evaluate((id) => {
    const c = id ? document.getElementById(id) : document.querySelector('canvas')
    if (!c) return false
    const ctx = c.getContext('2d')
    return !!(ctx && c.width > 0 && c.height > 0)
  }, canvasId)
  expect(valid).toBe(true)
}

export async function expectGlobalFunction(page, fnName) {
  const exists = await page.evaluate((n) => typeof window[n] === 'function', fnName)
  expect(exists).toBe(true)
}

export async function expectLocalStorageKey(page, key) {
  const val = await page.evaluate((k) => {
    try { return localStorage.getItem(k) } catch { return null }
  }, key)
  expect(val).not.toBeNull()
}

export async function expectGameState(page, expected) {
  const state = await page.evaluate(() => {
    const s = {}
    if (typeof gameState !== 'undefined') s.gameState = gameState
    if (typeof state !== 'undefined') {
      if (typeof state === 'object' && state.phase) s.phase = state.phase
      else if (typeof state === 'string') s.gameState = state
    }
    return s
  })
  for (const [k, v] of Object.entries(expected)) {
    expect(state[k]).toBe(v)
  }
}

export async function expectScore(page, min) {
  const score = await page.evaluate(() => {
    if (typeof score !== 'undefined') return score
    return null
  })
  if (score !== null) expect(score).toBeGreaterThanOrEqual(min)
}
