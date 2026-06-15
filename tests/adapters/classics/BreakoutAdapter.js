import { GameAdapter } from '../../framework/GameAdapter.js'

export class BreakoutAdapter extends GameAdapter {
  get file() { return 'breakout.html' }
  get title() { return 'Breakout' }
  get type() { return 'physics' }
  get saveKey() { return 'breakout_grizzy' }
  get hasAI() { return false }
  get hasLevels() { return true }
  get inputTypes() { return ['keyboard'] }
  get usesCanvas() { return true }
  get canvasId() { return 'c' }

  async getState(page) {
    return page.evaluate(() => {
      const s = {}
      if (typeof level !== 'undefined') s.level = level
      return Object.keys(s).length ? s : null
    })
  }

  reset(page) {
    return page.locator('#rst').click()
  }

  async startGame(page) {
    await page.keyboard.press('Enter')
    await page.waitForTimeout(500)
  }
}
