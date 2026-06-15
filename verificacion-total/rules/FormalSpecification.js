export class FormalSpecification {
  constructor() {
    this.specs = new Map()
  }

  define(gameId, spec) {
    const existing = this.specs.get(gameId) || {}
    this.specs.set(gameId, { ...existing, ...spec })
  }

  get(gameId) {
    return this.specs.get(gameId) || null
  }

  has(gameId) {
    return this.specs.has(gameId)
  }

  getAll() {
    return Array.from(this.specs.entries()).map(([id, spec]) => ({ id, ...spec }))
  }

  validate(spec) {
    const errors = []
    if (!spec.name) errors.push('spec.name is required')
    if (!spec.initialState && !spec.rules && !spec.invariants && !spec.transitions) {
      errors.push('spec must have at least one of: initialState, rules, invariants, transitions')
    }
    if (spec.rules) {
      for (let i = 0; i < spec.rules.length; i++) {
        if (!spec.rules[i].name) errors.push(`rules[${i}].name is required`)
        if (!spec.rules[i].check && !spec.rules[i].checkState) errors.push(`rules[${i}] must have check or checkState`)
      }
    }
    if (spec.invariants) {
      for (let i = 0; i < spec.invariants.length; i++) {
        if (!spec.invariants[i].name) errors.push(`invariants[${i}].name is required`)
        if (!spec.invariants[i].check) errors.push(`invariants[${i}].check is required`)
      }
    }
    return { valid: errors.length === 0, errors }
  }

  static stateEquals(expected) {
    return (state) => {
      if (!state) return false
      for (const [k, v] of Object.entries(expected)) {
        if (state[k] !== v) return false
      }
      return true
    }
  }

  static stateIn(validValues) {
    return (state, key) => {
      if (!state || !(key in state)) return false
      return validValues.includes(state[key])
    }
  }

  static rangeCheck(min, max) {
    return (state, key) => {
      if (!state || !(key in state)) return false
      return state[key] >= min && state[key] <= max
    }
  }

  static scoreAbove(threshold) {
    return () => {
      if (typeof window.score !== 'undefined') return window.score >= threshold
      if (typeof window.puntuacion !== 'undefined') return window.puntuacion >= threshold
      return false
    }
  }

  static canvasNotEmpty() {
    return () => {
      const c = document.querySelector('canvas')
      if (!c) return false
      const ctx = c.getContext('2d')
      if (!ctx) return false
      const d = ctx.getImageData(0, 0, c.width, c.height).data
      return d.some(v => v !== 0)
    }
  }

  static canvasContainsColor(targetColor, minPixels = 1) {
    return () => {
      const c = document.querySelector('canvas')
      if (!c) return false
      const ctx = c.getContext('2d')
      const d = ctx.getImageData(0, 0, c.width, c.height).data
      let count = 0
      for (let i = 0; i < d.length; i += 4) {
        if (Math.abs(d[i] - targetColor[0]) < 10 &&
            Math.abs(d[i + 1] - targetColor[1]) < 10 &&
            Math.abs(d[i + 2] - targetColor[2]) < 10) {
          count++
          if (count >= minPixels) return true
        }
      }
      return false
    }
  }

  static gameVariableEq(varName, expected) {
    return () => {
      if (typeof window[varName] === 'undefined') return false
      return window[varName] === expected
    }
  }
}
