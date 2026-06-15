export class StateExplorer {
  constructor({ maxStates = 1000, maxDepth = 100, timeout = 30000 } = {}) {
    this.maxStates = maxStates
    this.maxDepth = maxDepth
    this.timeout = timeout
    this.visited = new Set()
    this.queue = []
    this.results = { explored: 0, terminal: 0, errors: 0, transitions: [], states: [] }
    this.startTime = null
  }

  async explore(page, adapter, { inputs = null, initialAction = null } = {}) {
    this.reset()
    this.startTime = Date.now()
    const initialState = await this._captureState(page, adapter)

    if (!initialState) {
      return { error: 'No se pudo capturar estado inicial', ...this.results }
    }

    this.queue.push({ state: initialState, depth: 0, path: [] })

    if (initialAction) {
      await adapter.startGame(page)
      await page.waitForTimeout(300)
      const gameState = await this._captureState(page, adapter)
      if (gameState) {
        this.queue.push({ state: gameState, depth: 1, path: ['start'] })
      }
    }

    while (this.queue.length > 0 && !this._shouldStop()) {
      const current = this.queue.shift()
      const stateKey = this._stateKey(current.state)

      if (this.visited.has(stateKey)) continue
      this.visited.add(stateKey)

      this.results.states.push(current.state)
      this.results.explored++

      if (current.state.terminal || current.state.gameOver || current.state.phase === 'gameover' || current.state.phase === 'end') {
        this.results.terminal++
        continue
      }

      const availableInputs = inputs || this._getDefaultInputs(adapter)

      for (const input of availableInputs) {
        if (this._shouldStop()) break

        try {
          const beforeState = await this._captureState(page, adapter)
          await this._applyInput(page, input, adapter)

          if (current.depth < this.maxDepth) {
            await page.waitForTimeout(50)
            const afterState = await this._captureState(page, adapter)
            if (afterState && this._stateKey(afterState) !== stateKey) {
              this.results.transitions.push({ from: stateKey, to: this._stateKey(afterState), input, depth: current.depth })
              this.queue.push({ state: afterState, depth: current.depth + 1, path: [...current.path, input] })
            }
          }

          await this._restoreState(page, adapter, beforeState, current.state)
        } catch (err) {
          this.results.errors++
        }
      }
    }

    this.results.timeMs = Date.now() - this.startTime
    return this.results
  }

  async _captureState(page, adapter) {
    try {
      const state = await adapter.getState(page)
      const canvasStats = await page.evaluate(() => {
        const c = document.querySelector('canvas')
        if (!c) return null
        try {
          const ctx = c.getContext('2d')
          if (!ctx) return { width: c.width, height: c.height }
          const d = ctx.getImageData(0, 0, c.width, c.height).data
          return { width: c.width, height: c.height, pixelHash: this._simpleHash(d) }
        } catch { return { width: c.width, height: c.height } }
      })
      const url = page.url()
      return {
        ...(state || {}),
        canvasStats,
        url,
        timestamp: Date.now()
      }
    } catch {
      return null
    }
  }

  async _restoreState(page, adapter, targetState, fallback) {
    try {
      if (targetState && targetState.level !== undefined) {
        await page.evaluate((l) => {
          if (typeof level !== 'undefined') window.level = l
          if (typeof window.setLevel === 'function') window.setLevel(l)
        }, targetState.level)
      }
    } catch {}
  }

  async _applyInput(page, input, adapter) {
    if (typeof input === 'string') {
      if (input.startsWith('click_')) {
        const parts = input.split('_')
        const x = parseInt(parts[1]) || 400
        const y = parseInt(parts[2]) || 300
        await page.mouse.click(x, y)
      } else if (input.startsWith('key_')) {
        await page.keyboard.press(input.replace('key_', ''))
      } else {
        await page.keyboard.press(input)
      }
    } else if (typeof input === 'object') {
      if (input.type === 'click') await page.mouse.click(input.x || 400, input.y || 300)
      else if (input.type === 'key') await page.keyboard.press(input.key || 'Space')
      else if (input.type === 'swipe') {
        const vp = page.viewportSize()
        const sx = input.sx || vp.width / 2, sy = input.sy || vp.height / 2
        const ex = input.ex || sx + (input.dx || 100), ey = input.ey || sy + (input.dy || 0)
        await page.mouse.move(sx, sy)
        await page.mouse.down()
        await page.mouse.move(ex, ey, { steps: 10 })
        await page.mouse.up()
      }
    }
  }

  _getDefaultInputs(adapter) {
    const inputs = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'Enter']
    if (adapter.inputTypes && adapter.inputTypes.includes('mouse')) {
      inputs.push('click_200_300', 'click_400_300', 'click_600_300')
    }
    if (adapter.inputTypes && adapter.inputTypes.includes('touch')) {
      inputs.push({ type: 'swipe', dx: 0, dy: -100 })
      inputs.push({ type: 'swipe', dx: 0, dy: 100 })
    }
    return inputs
  }

  _stateKey(state) {
    if (!state) return 'null'
    const parts = []
    if (state.level !== undefined) parts.push(`l${state.level}`)
    if (state.score !== undefined) parts.push(`s${state.score}`)
    if (state.phase) parts.push(`p${state.phase}`)
    if (state.gameState) parts.push(`g${state.gameState}`)
    if (state.board) parts.push(`b${JSON.stringify(state.board)}`)
    if (state.canvasStats && state.canvasStats.pixelHash) parts.push(`ph${state.canvasStats.pixelHash}`)
    return parts.join('_') || 'unknown'
  }

  _simpleHash(data) {
    let hash = 0
    const step = Math.max(1, Math.floor(data.length / 1000))
    for (let i = 0; i < data.length; i += step) {
      hash = ((hash << 5) - hash) + data[i]
      hash |= 0
    }
    return hash
  }

  _shouldStop() {
    if (this.results.explored >= this.maxStates) return true
    if (this.startTime && (Date.now() - this.startTime) >= this.timeout) return true
    return false
  }

  reset() {
    this.visited = new Set()
    this.queue = []
    this.results = { explored: 0, terminal: 0, errors: 0, transitions: [], states: [] }
    this.startTime = null
  }
}
