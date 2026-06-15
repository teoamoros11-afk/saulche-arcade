export class GameAdapter {
  constructor() {
    if (new.target === GameAdapter) throw new Error('GameAdapter is abstract')
  }

  get file() { throw new Error('abstract') }
  get title() { throw new Error('abstract') }
  get type() { return 'unknown' }
  get saveKey() { return null }
  get hasAI() { return false }
  get hasLevels() { return false }
  get inputTypes() { return ['keyboard'] }
  get usesCanvas() { return false }
  get canvasId() { return null }

  async load(page) {
    const { gameUrl } = await import('../setup.js')
    await page.goto(gameUrl(this.file), { waitUntil: 'networkidle' })
    await page.waitForTimeout(500)
  }

  async startGame(page) {
    const state = await this.getState(page)
    if (state && state.phase === 'playing') return
    if (state && state.gameState && state.gameState !== 'playing') {
      await page.keyboard.press('Enter')
      await page.waitForTimeout(300)
    }
  }

  async reset(page) {
    if (await page.locator('#restartBtn').isVisible({ timeout: 500 }).catch(() => false)) {
      await page.click('#restartBtn')
      await page.waitForTimeout(300)
    }
  }

  async getState(page) {
    return page.evaluate(() => {
      const s = {}
      if (typeof level !== 'undefined') s.level = level
      if (typeof score !== 'undefined') s.score = score
      if (typeof gameState !== 'undefined') s.gameState = gameState
      if (typeof state !== 'undefined') {
        if (typeof state === 'object' && state !== null) {
          if (state.level !== undefined) s.level = state.level
          if (state.score !== undefined) s.score = state.score
          if (state.phase !== undefined) s.phase = state.phase
          if (state.gameState !== undefined) s.gameState = state.gameState
          if (state.playerTurn !== undefined) s.playerTurn = state.playerTurn
        } else if (typeof state === 'string') {
          s.gameState = state
        }
      }
      if (typeof over !== 'undefined') s.over = over
      if (typeof win !== 'undefined') s.win = win
      if (typeof gameActive !== 'undefined') s.gameActive = gameActive
      if (typeof gameOver !== 'undefined') s.gameOver = gameOver
      if (typeof playing !== 'undefined') s.playing = playing
      if (typeof lives !== 'undefined') s.lives = lives
      if (typeof st !== 'undefined') s.gameState = st
      return Object.keys(s).length ? s : null
    })
  }

  async pressKey(page, key) {
    await page.keyboard.press(key)
  }

  async click(page, x, y) {
    await page.mouse.click(x, y)
  }

  async swipe(page, dx, dy) {
    const vp = page.viewportSize()
    const sx = vp.width / 2
    const sy = vp.height / 2
    await page.mouse.move(sx, sy)
    await page.mouse.down()
    await page.mouse.move(sx + dx, sy + dy, { steps: 5 })
    await page.mouse.up()
  }

  getRules() { return [] }

  getWinConditions() { return [] }

  getEdgeCases() { return [] }
}
