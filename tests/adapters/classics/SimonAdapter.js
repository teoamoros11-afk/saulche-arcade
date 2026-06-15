import { GameAdapter } from '../../framework/GameAdapter.js'

export class SimonAdapter extends GameAdapter {
  get file() { return 'simon.html' }
  get title() { return 'Simon' }
  get type() { return 'memory' }
  get saveKey() { return 'simon_grizzy' }
  get hasAI() { return false }
  get hasLevels() { return true }
  get inputTypes() { return ['mouse'] }
  get usesCanvas() { return false }

  async getState(page) {
    return page.evaluate(() => {
      const s = {}
      if (typeof level !== 'undefined') s.level = level
      if (typeof seq !== 'undefined') s.seqLen = seq.length
      return Object.keys(s).length ? s : null
    })
  }

  async startGame(page) {
    await page.keyboard.press('Space')
    await page.waitForTimeout(500)
  }
}
