export class InputSimulator {
  constructor(page) {
    this.page = page
  }

  async key(key) {
    await this.page.keyboard.press(key)
    await this.page.waitForTimeout(50)
  }

  async click(selectorOrX, y) {
    if (typeof selectorOrX === 'string') {
      await this.page.click(selectorOrX)
    } else {
      await this.page.mouse.click(selectorOrX, y)
    }
    await this.page.waitForTimeout(50)
  }

  async clickCell(boardSelector, row, col) {
    const cell = this.page.locator(`#${boardSelector} .cell[data-r="${row}"][data-c="${col}"]`)
    if (await cell.isVisible()) await cell.click()
    await this.page.waitForTimeout(100)
  }

  async type(text) {
    await this.page.keyboard.type(text)
  }

  async space() { await this.key('Space') }
  async enter() { await this.key('Enter') }
  async escape() { await this.key('Escape') }
  async arrowUp() { await this.key('ArrowUp') }
  async arrowDown() { await this.key('ArrowDown') }
  async arrowLeft() { await this.key('ArrowLeft') }
  async arrowRight() { await this.key('ArrowRight') }
  async keyW() { await this.key('w') }
  async keyA() { await this.key('a') }
  async keyS() { await this.key('s') }
  async keyD() { await this.key('d') }
}
