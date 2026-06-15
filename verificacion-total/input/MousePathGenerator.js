export class MousePathGenerator {
  constructor(page) {
    this.page = page
  }

  async moveTo(x, y, steps = 10) {
    await this.page.mouse.move(x, y, { steps })
  }

  async clickAt(x, y) {
    await this.page.mouse.click(x, y)
    return { x, y }
  }

  async clickCenter() {
    const vp = this.page.viewportSize()
    return this.clickAt(vp.width / 2, vp.height / 2)
  }

  async dragAcross(x1, y1, x2, y2) {
    await this.page.mouse.move(x1, y1)
    await this.page.mouse.down()
    await this.page.mouse.move(x2, y2, { steps: 30 })
    await this.page.mouse.up()
    return { from: { x: x1, y: y1 }, to: { x: x2, y: y2 } }
  }

  async circlePath(cx = 400, cy = 300, radius = 150, points = 36) {
    for (let i = 0; i <= points; i++) {
      const angle = (i / points) * Math.PI * 2
      const x = cx + Math.cos(angle) * radius
      const y = cy + Math.sin(angle) * radius
      await this.page.mouse.move(x, y)
      await this.page.waitForTimeout(20)
    }
    return { cx, cy, radius, points }
  }

  async scanPattern() {
    const results = []
    for (let y = 100; y <= 500; y += 100) {
      for (let x = 100; x <= 700; x += 100) {
        await this.page.mouse.move(x, y)
        await this.page.waitForTimeout(10)
        results.push({ x, y })
      }
    }
    return { clicks: results.length }
  }

  async borderBounce() {
    const vp = this.page.viewportSize()
    const borderSequence = [
      [0, 0], [vp.width - 1, 0], [vp.width - 1, vp.height - 1],
      [0, vp.height - 1], [0, 0], [vp.width / 2, vp.height / 2]
    ]
    for (const [x, y] of borderSequence) {
      await this.page.mouse.move(x, y, { steps: 5 })
      await this.page.waitForTimeout(20)
    }
    return { points: borderSequence }
  }
}
