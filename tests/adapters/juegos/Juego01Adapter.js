import { createJuegoAdapter } from './Juego00Base.js'

const _adapter = createJuegoAdapter('juego01.html', 'Saltador Nubes', 'grizzy_clouds_best')

export class Juego01Adapter {
  get file() { return _adapter.file }
  get title() { return _adapter.title }
  get type() { return _adapter.type }
  get saveKey() { return _adapter.saveKey }
  get hasAI() { return _adapter.hasAI }
  get hasLevels() { return _adapter.hasLevels }
  get inputTypes() { return _adapter.inputTypes }
  get usesCanvas() { return _adapter.usesCanvas }
  get canvasId() { return _adapter.canvasId }
  async load(page) { return _adapter.load(page) }
  async startGame(page) { return _adapter.startGame(page) }
  async reset(page) { return _adapter.reset(page) }
  async getState(page) { return _adapter.getState(page) }
  async pressKey(page, key) { return _adapter.pressKey(page, key) }
  async click(page, x, y) { return _adapter.click(page, x, y) }
  getRules() { return _adapter.getRules() }
  getWinConditions() { return _adapter.getWinConditions() }
  getEdgeCases() { return _adapter.getEdgeCases() }
}
