export class TouchGestureGenerator {
  constructor(page) {
    this.page = page
  }

  async tap(x, y) {
    try {
      await this.page.touchscreen.tap(x, y)
      return { x, y, ok: true }
    } catch { return { x, y, ok: false } }
  }

  async swipe(x1, y1, x2, y2) {
    try {
      await this.page.mouse.move(x1, y1)
      await this.page.mouse.down()
      await this.page.mouse.move(x2, y2, { steps: 15 })
      await this.page.mouse.up()
      return { from: { x: x1, y: y1 }, to: { x: x2, y: y2 }, ok: true }
    } catch { return { from: { x: x1, y: y1 }, to: { x: x2, y: y2 }, ok: false } }
  }

  async swipeUp() {
    const vp = this.page.viewportSize()
    return this.swipe(vp.width / 2, vp.height * 0.7, vp.width / 2, vp.height * 0.3)
  }

  async swipeDown() {
    const vp = this.page.viewportSize()
    return this.swipe(vp.width / 2, vp.height * 0.3, vp.width / 2, vp.height * 0.7)
  }

  async swipeLeft() {
    const vp = this.page.viewportSize()
    return this.swipe(vp.width * 0.7, vp.height / 2, vp.width * 0.3, vp.height / 2)
  }

  async swipeRight() {
    const vp = this.page.viewportSize()
    return this.swipe(vp.width * 0.3, vp.height / 2, vp.width * 0.7, vp.height / 2)
  }

  async allDirections() {
    return {
      up: await this.swipeUp(),
      down: await this.swipeDown(),
      left: await this.swipeLeft(),
      right: await this.swipeRight()
    }
  }

  async longPress(x, y, durationMs = 1000) {
    try {
      await this.page.mouse.move(x, y)
      await this.page.mouse.down()
      await this.page.waitForTimeout(durationMs)
      await this.page.mouse.up()
      return { x, y, durationMs, ok: true }
    } catch { return { x, y, durationMs, ok: false } }
  }

  async rapidTaps(x, y, count = 10) {
    const results = []
    for (let i = 0; i < count; i++) {
      const r = await this.tap(x + (Math.random() - 0.5) * 20, y + (Math.random() - 0.5) * 20)
      results.push(r)
      await this.page.waitForTimeout(30)
    }
    return { count: results.length, ok: results.filter(r => r.ok).length }
  }

  async cornerSwipes() {
    const vp = this.page.viewportSize()
    return {
      topLeft: await this.swipe(0, 0, vp.width * 0.3, vp.height * 0.3),
      topRight: await this.swipe(vp.width - 1, 0, vp.width * 0.7, vp.height * 0.3),
      bottomLeft: await this.swipe(0, vp.height - 1, vp.width * 0.3, vp.height * 0.7),
      bottomRight: await this.swipe(vp.width - 1, vp.height - 1, vp.width * 0.7, vp.height * 0.7),
    }
  }
}
