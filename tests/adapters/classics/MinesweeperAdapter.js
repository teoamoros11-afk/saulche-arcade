import { GameAdapter } from '../../framework/GameAdapter.js'

export class MinesweeperAdapter extends GameAdapter {
  get file() { return 'minesweeper.html' }
  get title() { return 'Buscaminas (Minesweeper)' }
  get type() { return 'board' }
  get saveKey() { return 'minesweeper_grizzy' }
  get hasAI() { return false }
  get hasLevels() { return true }
  get inputTypes() { return ['mouse'] }
  get usesCanvas() { return false }

  async getState(page) {
    return page.evaluate(() => {
      const s = {}
      if (typeof grid !== 'undefined') s.grid = true
      if (typeof level !== 'undefined') s.level = level
      if (typeof revealed !== 'undefined') s.revealed = true
      return Object.keys(s).length ? s : null
    })
  }
}
