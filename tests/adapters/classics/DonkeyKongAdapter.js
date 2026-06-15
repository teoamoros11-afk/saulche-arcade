import { GameAdapter } from '../../framework/GameAdapter.js'

export class DonkeyKongAdapter extends GameAdapter {
  get file() { return 'donkey.html' }
  get title() { return 'Donkey Kong' }
  get type() { return 'platform' }
  get saveKey() { return 'donkey_grizzy' }
  get hasAI() { return true }
  get hasLevels() { return true }
  get inputTypes() { return ['keyboard'] }
  get usesCanvas() { return true }
  get canvasId() { return 'game' }

  async getState(page) {
    return page.evaluate(() => {
      const s = {}
      if (typeof score !== 'undefined') s.score = score
      if (typeof level !== 'undefined') s.level = level
      if (typeof lives !== 'undefined') s.lives = lives
      if (typeof gameOver !== 'undefined') s.gameOver = gameOver
      if (typeof win !== 'undefined') s.win = win
      return Object.keys(s).length ? s : null
    })
  }

  async startGame(page) {
    await page.keyboard.press('Enter')
    await page.waitForTimeout(500)
  }
}
