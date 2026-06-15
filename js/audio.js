;(function () {
  var actx = null
  function getCtx() {
    if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)()
    return actx
  }
  window.sfx = function (freq, dur, type, vol) {
    if (dur === undefined) dur = 0.12
    if (type === undefined) type = 'triangle'
    if (vol === undefined) vol = 0.07
    try {
      var c = getCtx(),
        o = c.createOscillator(),
        g = c.createGain()
      o.connect(g)
      g.connect(c.destination)
      o.frequency.value = freq
      o.type = type
      g.gain.setValueAtTime(vol, c.currentTime)
      g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur)
      o.start(c.currentTime)
      o.stop(c.currentTime + dur)
    } catch (e) {}
  }
  window.sfxMelody = function (notes) {
    notes.forEach(function (n, i) {
      setTimeout(
        function () {
          window.sfx(n[0], n[1], n[2], n[3])
        },
        n[4] || i * 80,
      )
    })
  }
})()
