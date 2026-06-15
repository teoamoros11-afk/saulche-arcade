const KEY = 'mentis_save'
export default class SaveManager {
  static save(data) {
    try {
      const str = JSON.stringify(data)
      localStorage.setItem(KEY, str)
      return true
    } catch (e) { return false }
  }
  static load() {
    try {
      const str = localStorage.getItem(KEY)
      return str ? JSON.parse(str) : null
    } catch (e) { return null }
  }
  static clear() {
    localStorage.removeItem(KEY)
  }
  static backup() {
    const data = this.load()
    if (data) {
      try {
        localStorage.setItem(KEY + '_backup_' + Date.now(), JSON.stringify(data))
      } catch {}
    }
  }
  static exportJSON() {
    return JSON.stringify(this.load(), null, 2)
  }
  static importJSON(str) {
    try {
      const data = JSON.parse(str)
      if (data && data.player) {
        this.save(data)
        return true
      }
    } catch {}
    return false
  }
}
