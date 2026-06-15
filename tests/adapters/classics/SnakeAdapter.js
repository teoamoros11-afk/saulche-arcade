import { GameAdapter } from '../../framework/GameAdapter.js'

export class SnakeAdapter extends GameAdapter {
  get file() { return 'snake.html' }
  get title() { return 'Snake' }
  get type() { return 'grid' }
  get saveKey() { return 'snake_grizzy' }
  get hasAI() { return false }
  get hasLevels() { return true }
  get inputTypes() { return ['keyboard'] }
  get usesCanvas() { return true }
  get canvasId() { return 'game' }

  async getState(page) {
    return page.evaluate(() => {
      const s = {}
      if (typeof score !== 'undefined') s.score = score
      if (typeof level !== 'undefined') s.level = level
      if (typeof over !== 'undefined') s.over = over
      if (typeof win !== 'undefined') s.win = win
      if (typeof foodEaten !== 'undefined') s.foodEaten = foodEaten
      if (typeof needed !== 'undefined') s.needed = needed
      return Object.keys(s).length ? s : null
    })
  }

  async startGame(page) {
    await page.keyboard.press('Enter')
    await page.waitForTimeout(500)
  }
}
