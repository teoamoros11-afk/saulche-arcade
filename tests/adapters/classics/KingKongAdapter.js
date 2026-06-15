import { GameAdapter } from '../../framework/GameAdapter.js'

export class KingKongAdapter extends GameAdapter {
  get file() { return 'kingkong.html' }
  get title() { return 'King Kong' }
  get type() { return 'platform' }
  get saveKey() { return 'kingkong_grizzy' }
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
      if (typeof levelWin !== 'undefined') s.win = levelWin
      if (typeof bananaCount !== 'undefined') s.bananaCount = bananaCount
      if (typeof needed !== 'undefined') s.needed = needed
      return Object.keys(s).length ? s : null
    })
  }

  async startGame(page) {
    await page.keyboard.press('Enter')
    await page.waitForTimeout(500)
  }
}
