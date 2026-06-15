export class KeyboardSequencer {
  constructor(page) {
    this.page = page
  }

  async pressSequence(keys, interval = 100) {
    const results = []
    for (const key of keys) {
      try {
        await this.page.keyboard.press(key)
        await this.page.waitForTimeout(interval)
        results.push({ key, ok: true })
      } catch (e) {
        results.push({ key, ok: false, error: e.message })
      }
    }
    return results
  }

  async holdAndRelease(key, durationMs = 500) {
    try {
      await this.page.keyboard.down(key)
      await this.page.waitForTimeout(durationMs)
      await this.page.keyboard.up(key)
      return { key, durationMs, ok: true }
    } catch (e) {
      return { key, durationMs, ok: false, error: e.message }
    }
  }

  async multiKeyPress(keys, interval = 50) {
    for (const k of keys) {
      await this.page.keyboard.down(k)
    }
    await this.page.waitForTimeout(interval)
    const reversed = [...keys].reverse()
    for (const k of reversed) {
      await this.page.keyboard.up(k)
    }
    return { keys, ok: true }
  }

  async arrowPattern() {
    return this.pressSequence(['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight'], 80)
  }

  async wasdPattern() {
    return this.pressSequence(['KeyW', 'KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyW'], 80)
  }

  async spaceEnterPattern() {
    return this.pressSequence(['Space', 'Space', 'Space', 'Enter', 'Space', 'Enter', 'Enter', 'Escape', 'Enter', 'Space'], 100)
  }

  async repeatPress(key, times, interval = 50) {
    return this.pressSequence(new Array(times).fill(key), interval)
  }

  async rapidAlternating(key1, key2, times = 30, interval = 50) {
    const seq = []
    for (let i = 0; i < times; i++) {
      seq.push(i % 2 === 0 ? key1 : key2)
    }
    return this.pressSequence(seq, interval)
  }

  async allDirections() {
    return this.pressSequence(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowLeft', 'ArrowDown', 'ArrowRight'], 100)
  }

  async diagonalInputs() {
    return this.multiKeyPress(['ArrowUp', 'ArrowRight'], 50)
  }

  async startGameSequence() {
    return this.pressSequence(['Enter', 'Space', 'Enter', 'Space'], 200)
  }
}
