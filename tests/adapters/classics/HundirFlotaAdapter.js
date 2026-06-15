import { GameAdapter } from '../../framework/GameAdapter.js'

export class HundirFlotaAdapter extends GameAdapter {
  get file() { return 'hundirlaflota.html' }
  get title() { return 'Hundir la Flota (Battleship)' }
  get type() { return 'board' }
  get saveKey() { return 'hundirlaflota_grizzy' }
  get hasAI() { return true }
  get hasLevels() { return true }
  get inputTypes() { return ['mouse'] }
  get usesCanvas() { return false }

  async getState(page) {
    return page.evaluate(() => {
      const s = {}
      if (typeof state !== 'undefined' && state) {
        if (state.score !== undefined) s.score = state.score
        if (state.level !== undefined) s.level = state.level
        if (state.phase !== undefined) s.phase = state.phase
        if (state.playerTurn !== undefined) s.playerTurn = state.playerTurn
      }
      return Object.keys(s).length ? s : null
    })
  }

  async startGame(page) {
    const state = await this.getState(page)
    if (state && state.phase === 'playing') return
    if (state && state.phase === 'menu') {
      await page.waitForTimeout(1000)
    }
  }
}
