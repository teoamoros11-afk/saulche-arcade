import { store } from '../core/Store.js'
import { events } from '../core/EventBus.js'

const SCREENS = ['title', 'menu', 'tower', 'floor', 'puzzle', 'daily', 'achievements', 'stats', 'settings']

export class ScreenManager {
  constructor(container) {
    this._container = container
    this._screens = new Map()
    this._history = []
    this._current = null
    events.on('screen:change', (id) => this.show(id))
    store.observe('screen', (id) => this._transition(id))
  }

  register(id, html, initFn) {
    this._screens.set(id, { html, initFn, element: null })
  }

  show(id, ...args) {
    if (id === this._current) return
    if (this._current) this._history.push(this._current)
    store.set('screen', id)
    this._current = id
    const screen = this._screens.get(id)
    if (screen) {
      if (!screen.element) {
        const div = document.createElement('div')
        div.className = `screen ${id}-screen`
        div.innerHTML = screen.html
        this._container.appendChild(div)
        screen.element = div
      }
      document.querySelectorAll('.screen').forEach(el => el.classList.remove('active'))
      screen.element.classList.add('active')
      screen.initFn?.(...args)
    }
  }

  back() {
    const prev = this._history.pop()
    if (prev) this.show(prev)
  }

  _transition(id) {
    document.querySelectorAll('.screen').forEach(el => {
      if (el.classList.contains(`${id}-screen`)) el.classList.add('active')
      else el.classList.remove('active')
    })
  }

  getCurrent() { return this._current }
}
