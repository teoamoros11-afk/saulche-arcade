import { GameAdapter } from '../../framework/GameAdapter.js'

export class TicTacToeAdapter extends GameAdapter {
  get file() { return 'tictactoe.html' }
  get title() { return 'Tres en Raya (Tic Tac Toe)' }
  get type() { return 'board' }
  get saveKey() { return 'tictactoe_grizzy' }
  get hasAI() { return true }
  get hasLevels() { return true }
  get inputTypes() { return ['mouse'] }
  get usesCanvas() { return false }

  async getState(page) {
    return page.evaluate(() => {
      const s = {}
      if (typeof board !== 'undefined') s.board = board
      if (typeof over !== 'undefined') s.over = over
      if (typeof level !== 'undefined') s.level = level
      if (typeof curP !== 'undefined') s.curP = curP
      return Object.keys(s).length ? s : null
    })
  }

  async startGame(page) {
    const state = await this.getState(page)
    if (state && state.board) return
  }
}
