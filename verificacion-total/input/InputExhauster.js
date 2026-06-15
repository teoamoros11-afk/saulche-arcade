export class InputExhauster {
  constructor(page) {
    this.page = page
    this.Keys = {
      arrows: ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'],
      wasd: ['KeyW', 'KeyA', 'KeyS', 'KeyD'],
      actions: ['Space', 'Enter', 'Escape', 'KeyR', 'KeyP'],
      numbers: ['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6', 'Digit7', 'Digit8', 'Digit9', 'Digit0'],
      modifiers: ['ShiftLeft', 'ShiftRight', 'ControlLeft', 'ControlRight', 'AltLeft', 'AltRight'],
      all: () => [...this.arrows, ...this.wasd, ...this.actions, ...this.numbers]
    }
  }

  async pressAllKeys() {
    const results = []
    for (const key of this.Keys.all()) {
      try {
        await this.page.keyboard.down(key)
        await this.page.waitForTimeout(30)
        await this.page.keyboard.up(key)
        results.push({ key, ok: true })
      } catch (e) {
        results.push({ key, ok: false, error: e.message })
      }
    }
    return results
  }

  async pressAllModifiers() {
    const results = []
    for (const mod of this.Keys.modifiers) {
      try {
        await this.page.keyboard.down(mod)
        await this.page.waitForTimeout(50)
        for (const key of ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space']) {
          await this.page.keyboard.press(key)
          await this.page.waitForTimeout(20)
        }
        await this.page.keyboard.up(mod)
        results.push({ modifier: mod, ok: true })
      } catch (e) {
        results.push({ modifier: mod, ok: false })
      }
    }
    return results
  }

  async rapidFire(key = 'Space', count = 100, interval = 16) {
    const results = []
    const start = Date.now()
    for (let i = 0; i < count; i++) {
      try {
        await this.page.keyboard.press(key)
        await this.page.waitForTimeout(interval)
        results.push({ i, ok: true })
      } catch (e) {
        results.push({ i, ok: false })
        break
      }
    }
    return { key, count: results.length, all_ok: results.every(r => r.ok), timeMs: Date.now() - start, fps: Math.round((results.length / (Date.now() - start)) * 1000) }
  }

  async allClicks() {
    const positions = [
      [400, 300], [200, 150], [600, 450], [100, 50], [700, 550],
      [400, 100], [400, 500], [100, 300], [700, 300], [400, 50]
    ]
    const results = []
    for (const [x, y] of positions) {
      try {
        await this.page.mouse.click(x, y)
        await this.page.waitForTimeout(50)
        results.push({ x, y, ok: true })
      } catch (e) {
        results.push({ x, y, ok: false })
      }
    }
    return results
  }

  async doubleClick(x = 400, y = 300) {
    try {
      await this.page.mouse.dblclick(x, y)
      return { x, y, ok: true }
    } catch (e) {
      return { x, y, ok: false, error: e.message }
    }
  }

  async rightClick(x = 400, y = 300) {
    try {
      await this.page.mouse.click(x, y, { button: 'right' })
      return { x, y, ok: true }
    } catch {
      return { x, y, ok: false }
    }
  }

  async mouseDrag(x1 = 200, y1 = 300, x2 = 600, y2 = 300) {
    try {
      await this.page.mouse.move(x1, y1)
      await this.page.mouse.down()
      await this.page.mouse.move(x2, y2, { steps: 20 })
      await this.page.mouse.up()
      return { from: { x: x1, y: y1 }, to: { x: x2, y: y2 }, ok: true }
    } catch {
      return { from: { x: x1, y: y1 }, to: { x: x2, y: y2 }, ok: false }
    }
  }

  async allCombinations() {
    const baseKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'Enter', 'Escape']
    const combinations = []
    for (const k1 of baseKeys) {
      for (const k2 of baseKeys) {
        if (k1 === k2) continue
        try {
          await this.page.keyboard.down(k1)
          await this.page.keyboard.press(k2)
          await this.page.waitForTimeout(20)
          await this.page.keyboard.up(k1)
          combinations.push({ keys: [k1, k2], ok: true })
        } catch {
          combinations.push({ keys: [k1, k2], ok: false })
        }
      }
    }
    return { total: combinations.length, ok: combinations.filter(c => c.ok).length, failed: combinations.filter(c => !c.ok).length }
  }

  async allMouseButtons() {
    const buttons = ['left', 'middle', 'right']
    const results = []
    for (const btn of buttons) {
      try {
        await this.page.mouse.click(400, 300, { button: btn })
        results.push({ button: btn, ok: true })
      } catch {
        results.push({ button: btn, ok: false })
      }
    }
    return results
  }

  async touchTap(x = 400, y = 300) {
    try {
      await this.page.touchscreen.tap(x, y)
      return { x, y, ok: true }
    } catch (e) {
      return { x, y, ok: false, error: e.message }
    }
  }
}
