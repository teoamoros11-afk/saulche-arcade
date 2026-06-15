;(function () {
  window.loadProgress = function (key, def) {
    def = def !== undefined ? def : 0
    try {
      var v = parseInt(localStorage.getItem(key))
      return isNaN(v) ? def : Math.min(40, Math.max(1, v))
    } catch (e) {
      return def
    }
  }
  window.saveProgress = function (key, val) {
    try {
      localStorage.setItem(key, String(val))
      return true
    } catch (e) {
      return false
    }
  }
  window.loadBest = function (key, def) {
    def = def !== undefined ? def : 0
    try {
      var v = parseInt(localStorage.getItem(key))
      return isNaN(v) ? def : v
    } catch (e) {
      return def
    }
  }
  window.saveBest = function (key, val) {
    try {
      localStorage.setItem(key, String(val))
      return true
    } catch (e) {
      return false
    }
  }
  window.loadJSON = function (key, def) {
    def = def || null
    try {
      return JSON.parse(localStorage.getItem(key)) || def
    } catch (e) {
      return def
    }
  }
  window.saveJSON = function (key, val) {
    try {
      localStorage.setItem(key, JSON.stringify(val))
      return true
    } catch (e) {
      return false
    }
  }
})()
