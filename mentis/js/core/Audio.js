export default class AudioManager {
  constructor() {
    this._ctx = null
    this._enabled = true
    this._masterGain = null
    this._musicGain = null
    this._sfxGain = null
    this._musicOsc = null
    this._musicPlaying = false
  }
  _init() {
    if (this._ctx) return
    try {
      this._ctx = new (window.AudioContext || window.webkitAudioContext)()
      this._masterGain = this._ctx.createGain()
      this._masterGain.gain.value = 0.5
      this._masterGain.connect(this._ctx.destination)
      this._musicGain = this._ctx.createGain()
      this._musicGain.gain.value = 0.08
      this._musicGain.connect(this._masterGain)
      this._sfxGain = this._ctx.createGain()
      this._sfxGain.gain.value = 0.15
      this._sfxGain.connect(this._masterGain)
    } catch (e) { this._enabled = false }
  }
  enable(v = true) { this._enabled = v; if (!v) this.stopMusic() }
  sfx(freq, dur = 0.1, type = 'triangle', vol = 0.12) {
    if (!this._enabled || !this._ctx) return
    this._init()
    const o = this._ctx.createOscillator(), g = this._ctx.createGain()
    o.type = type; o.frequency.value = freq
    g.gain.setValueAtTime(vol, this._ctx.currentTime)
    g.gain.exponentialRampToValueAtTime(0.001, this._ctx.currentTime + dur)
    o.connect(g); g.connect(this._sfxGain)
    o.start(); o.stop(this._ctx.currentTime + dur)
  }
  sfxMelody(notes) {
    notes.forEach((n, i) => setTimeout(() => this.sfx(n[0], n[1], n[2], n[3]), n[4] || i * 80))
  }
  correct() { this.sfxMelody([[660, 0.08, 'sine', 0.1],[880, 0.1, 'sine', 0.1],[1100, 0.12, 'sine', 0.12]]) }
  wrong() { this.sfx(200, 0.3, 'sawtooth', 0.08) }
  click() { this.sfx(440, 0.04, 'sine', 0.06) }
  levelUp() { this.sfxMelody([[523, 0.1, 'sine', 0.1],[659, 0.1, 'sine', 0.1],[784, 0.1, 'sine', 0.1],[1047, 0.2, 'sine', 0.15]]) }
  achieve() { this.sfxMelody([[880, 0.08, 'sine', 0.12],[1100, 0.08, 'sine', 0.12],[1320, 0.15, 'sine', 0.15]]) }
  complete() {
    this.sfxMelody([[523, 0.1, 'sine', 0.1],[659, 0.1, 'sine', 0.1],[784, 0.15, 'sine', 0.12],[1047, 0.25, 'triangle', 0.15],[1319, 0.4, 'triangle', 0.12]])
  }
  startMusic() {
    if (!this._enabled || this._musicPlaying) return
    this._init()
    this._musicPlaying = true
    this._playAmbient()
  }
  stopMusic() {
    this._musicPlaying = false
    if (this._musicOsc) try { this._musicOsc.forEach(o => o.stop()) } catch {}
    this._musicOsc = null
  }
  _playAmbient() {
    if (!this._musicPlaying || !this._ctx) return
    const notes = [220, 247, 262, 294, 330, 349, 392]
    const oscs = []
    for (let i = 0; i < 3; i++) {
      const o = this._ctx.createOscillator()
      const g = this._ctx.createGain()
      o.type = 'sine'; o.frequency.value = notes[Math.floor(Math.random() * notes.length)] * (0.5 + Math.random() * 0.5)
      g.gain.setValueAtTime(0, this._ctx.currentTime)
      g.gain.linearRampToValueAtTime(0.02 + Math.random() * 0.03, this._ctx.currentTime + 2)
      g.gain.linearRampToValueAtTime(0, this._ctx.currentTime + 4 + Math.random() * 3)
      o.connect(g); g.connect(this._musicGain)
      o.start(); o.stop(this._ctx.currentTime + 5 + Math.random() * 3)
      oscs.push(o)
    }
    this._musicOsc = oscs
    setTimeout(() => this._playAmbient(), 2000 + Math.random() * 3000)
  }
  setVolume(v) { if (this._masterGain) this._masterGain.gain.value = Math.max(0, Math.min(1, v)) }
}
