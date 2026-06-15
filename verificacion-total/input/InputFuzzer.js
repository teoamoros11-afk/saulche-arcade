export class InputFuzzer {
  constructor(page) {
    this.page = page
  }

  async fuzzKeys(count = 200) {
    const keyPool = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'Enter', 'Escape', 'KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyR', 'KeyP', 'ShiftLeft', 'ControlLeft', 'AltLeft', 'Tab', 'Backspace', 'Delete', 'Home', 'End', 'PageUp', 'PageDown']
    const results = []
    for (let i = 0; i < count; i++) {
      const key = keyPool[Math.floor(Math.random() * keyPool.length)]
      try {
        await this.page.keyboard.press(key)
        await this.page.waitForTimeout(10 + Math.random() * 40)
        results.push({ key, ok: true })
      } catch {
        results.push({ key, ok: false })
      }
      if (results.filter(r => !r.ok).length > 5) break
    }
    return { total: results.length, ok: results.filter(r => r.ok).length, failed: results.filter(r => !r.ok).length, keys: results.map(r => r.key) }
  }

  async fuzzClicks(count = 100) {
    const results = []
    for (let i = 0; i < count; i++) {
      const x = Math.floor(Math.random() * 800)
      const y = Math.floor(Math.random() * 600)
      try {
        await this.page.mouse.click(x, y, { button: ['left', 'middle', 'right'][Math.floor(Math.random() * 3)] })
        await this.page.waitForTimeout(5 + Math.random() * 20)
        results.push({ x, y, ok: true })
      } catch {
        results.push({ x, y, ok: false })
      }
    }
    return { total: results.length, ok: results.filter(r => r.ok).length, failed: results.filter(r => !r.ok).length }
  }

  async fuzzMixed(iterations = 150) {
    const actions = ['key', 'click', 'swipe', 'scroll']
    const results = []
    for (let i = 0; i < iterations; i++) {
      const action = actions[Math.floor(Math.random() * actions.length)]
      try {
        switch (action) {
          case 'key': {
            const keys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'Enter', 'Escape', 'KeyW', 'KeyA', 'KeyS', 'KeyD']
            await this.page.keyboard.press(keys[Math.floor(Math.random() * keys.length)])
            break
          }
          case 'click': {
            await this.page.mouse.click(Math.floor(Math.random() * 800), Math.floor(Math.random() * 600))
            break
          }
          case 'swipe': {
            const sx = Math.random() * 800, sy = Math.random() * 600
            await this.page.mouse.move(sx, sy)
            await this.page.mouse.down()
            await this.page.mouse.move(sx + (Math.random() - 0.5) * 400, sy + (Math.random() - 0.5) * 400, { steps: 5 })
            await this.page.mouse.up()
            break
          }
          case 'scroll': {
            await this.page.evaluate(() => window.scrollBy(0, Math.random() * 200 - 100))
            break
          }
        }
        results.push({ action, ok: true })
      } catch {
        results.push({ action, ok: false })
      }
      if (results.filter(r => !r.ok).length > 5) break
    }
    return { total: results.length, ok: results.filter(r => r.ok).length, failed: results.filter(r => !r.ok).length }
  }

  async fuzzWithErrorInjection(iterations = 100) {
    const errorInjectors = [
      () => this.page.evaluate(() => { throw new Error('FUZZ_ERROR') }),
      () => this.page.evaluate(() => JSON.parse('{invalid json}')),
      () => this.page.evaluate(() => { null.method() }),
      () => this.page.evaluate(() => undefined.variable.another),
      () => this.page.evaluate(() => { while (true) { if (Math.random() > 0.999) break } }),
    ]
    const results = []
    for (const inject of errorInjectors) {
      try {
        await inject()
        results.push({ error: inject.toString().slice(0, 50), caught: true })
      } catch {
        results.push({ error: inject.toString().slice(0, 50), caught: true })
      }
    }
    return results
  }

  async timedFuzz(durationMs = 5000) {
    const start = Date.now()
    let count = 0, errors = 0
    while (Date.now() - start < durationMs) {
      try {
        const r = Math.random()
        if (r < 0.3) {
          await this.page.keyboard.press(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'][Math.floor(Math.random() * 5)])
        } else if (r < 0.6) {
          await this.page.mouse.click(Math.floor(Math.random() * 800), Math.floor(Math.random() * 600))
        } else {
          await this.page.evaluate(() => document.querySelector('canvas')?.getContext('2d')?.clearRect(0, 0, 9999, 9999))
        }
        count++
      } catch { errors++ }
      await this.page.waitForTimeout(1 + Math.random() * 10)
    }
    return { durationMs, count, errors, rate: Math.round(count / (durationMs / 1000)) + '/s' }
  }
}
