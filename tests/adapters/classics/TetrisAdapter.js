import { GameAdapter } from '../../framework/GameAdapter.js'

export class TetrisAdapter extends GameAdapter {
  get file() { return 'tetris.html' }
  get title() { return 'Tetris' }
  get type() { return 'grid' }
  get saveKey() { return 'tetris_grizzy' }
  get hasAI() { return false }
  get hasLevels() { return true }
  get inputTypes() { return ['keyboard'] }
  get usesCanvas() { return true }
  get canvasId() { return 'board' }

  async getState(page) {
    return page.evaluate(() => {
      const s = {}
      if (typeof score !== 'undefined') s.score = score
      if (typeof level !== 'undefined') s.level = level
      if (typeof over !== 'undefined') s.gameOver = over
      if (typeof lines !== 'undefined') s.lines = lines
      if (typeof paused !== 'undefined') s.paused = paused
      return Object.keys(s).length ? s : null
    })
  }

  async startGame(page) {
    await page.keyboard.press('Enter')
    await page.waitForTimeout(500)
  }
}
