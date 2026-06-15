export class AudioAnalyzer {
  constructor(page) {
    this.page = page
  }

  async checkAudioContext() {
    return this.page.evaluate(() => {
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)()
        const state = ctx.state
        ctx.close()
        return { supported: true, state, isBlocked: state === 'suspended' }
      } catch (e) {
        return { supported: false, error: e.message }
      }
    })
  }

  async checkSfxFunction() {
    return this.page.evaluate(() => {
      const checks = {}
      for (const name of ['sfx', 'window.sfx', 'tone', 'playTone', 'playSound', 'beep', 'blip']) {
        const fnName = name.replace('window.', '')
        try {
          checks[name] = typeof (fnName === 'sfx' ? sfx : window[fnName]) === 'function'
        } catch {
          checks[name] = false
        }
      }
      return checks
    })
  }

  async callSfxNoCrash() {
    return this.page.evaluate(() => {
      const results = []
      const sfxFunctions = []
      try { if (typeof sfx === 'function') sfxFunctions.push({ name: 'sfx', fn: sfx }) } catch {}
      try { if (typeof window.sfx === 'function') sfxFunctions.push({ name: 'window.sfx', fn: window.sfx }) } catch {}
      try { if (typeof window.sfxMelody === 'function') sfxFunctions.push({ name: 'window.sfxMelody', fn: window.sfxMelody }) } catch {}
      for (const { name, fn } of sfxFunctions) {
        try {
          if (name.includes('Melody')) {
            fn([[440, 0.05, 'sine', 0.01]])
          } else {
            fn(440, 0.05)
            fn(880, 0.05, 'triangle', 0.01)
            fn(220, 0.1, 'square', 0.01)
          }
          results.push({ name, ok: true })
        } catch (e) {
          results.push({ name, ok: false, error: e.message })
        }
      }
      return results.length > 0 ? results : [{ name: 'none', ok: true, note: 'No sfx functions found — not an error' }]
    })
  }

  async detectSoundDefines() {
    return this.page.evaluate(() => {
      const soundDefs = []
      const scripts = document.querySelectorAll('script')
      for (const s of scripts) {
        const text = s.textContent || ''
        const lines = text.split('\n')
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].includes('sfx') || lines[i].includes('AudioContext') || lines[i].includes('OscillatorNode')) {
            soundDefs.push({ line: i + 1, code: lines[i].trim().slice(0, 120) })
            if (soundDefs.length > 20) break
          }
        }
      }
      return { totalSoundLines: soundDefs.length, samples: soundDefs }
    })
  }
}
