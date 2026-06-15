import { GameAdapter } from '../../framework/GameAdapter.js'

export class ComecocosAdapter extends GameAdapter {
  get file() { return 'comecocos.html' }
  get title() { return 'Come Cocos (Pac-Man)' }
  get type() { return 'grid' }
  get saveKey() { return 'comecocos_grizzy' }
  get hasAI() { return true }
  get hasLevels() { return true }
  get inputTypes() { return ['keyboard'] }
  get usesCanvas() { return true }
  get canvasId() { return null }

  async getState(page) {
    return page.evaluate(() => {
      const s = {}
      if (typeof score !== 'undefined') s.score = score
      if (typeof level !== 'undefined') s.level = level
      if (typeof lives !== 'undefined') s.lives = lives
      return Object.keys(s).length ? s : null
    })
  }

  async startGame(page) {
    await page.keyboard.press('Enter')
    await page.waitForTimeout(800)
  }
}
