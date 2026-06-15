import { store } from '../core/Store.js'
import { events } from '../core/EventBus.js'

const XP_TABLE = [
  0, 100, 250, 450, 700, 1000, 1350, 1750, 2200, 2700,
  3250, 3850, 4500, 5200, 5950, 6750, 7600, 8500, 9450, 10450,
  11500, 12600, 13750, 14950, 16200, 17500, 18850, 20250, 21700, 23200,
  24750, 26350, 28000, 29700, 31450, 33250, 35100, 37000, 38950, 40950,
  43000, 45100, 47250, 49450, 51700, 54000, 56350, 58750, 61200, 63700,
]

export class HUD {
  constructor(container, towerManager) {
    this._el = null
    this._tower = towerManager
    this._visible = false
    container.insertAdjacentHTML('beforeend', `
      <div id="hud" style="display:none;position:fixed;top:0;left:0;right:0;z-index:100;padding:10px 16px;background:linear-gradient(180deg,rgba(10,10,26,0.9),transparent);pointer-events:none">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:12px">
          <div id="hud-floor" style="font-size:12px;color:#a090b0;font-weight:600">PISO 1</div>
          <div id="hud-xp" style="flex:1;margin:0 8px">
            <div style="display:flex;justify-content:space-between;font-size:10px;color:#605070;margin-bottom:2px">
              <span id="hud-xp-text">0 XP</span>
              <span id="hud-level-text">Nv. 1</span>
            </div>
            <div class="progress-bar"><div id="hud-xp-bar" class="progress-fill" style="width:0%"></div></div>
          </div>
          <div id="hud-stars" style="font-size:16px;color:#ffd700">⭐ 0</div>
          <button id="hud-menu-btn" style="background:none;border:none;color:#a090b0;font-size:18px;cursor:pointer;pointer-events:auto;padding:4px">☰</button>
        </div>
      </div>
    `)
    this._el = document.getElementById('hud')
    this._floorEl = document.getElementById('hud-floor')
    this._xpText = document.getElementById('hud-xp-text')
    this._levelText = document.getElementById('hud-level-text')
    this._xpBar = document.getElementById('hud-xp-bar')
    this._starsEl = document.getElementById('hud-stars')
    document.getElementById('hud-menu-btn').onclick = () => events.emit('screen:change', 'menu')
    store.observe('player', () => this.update())
    store.observe('tower.currentFloor', () => this.update())
    store.observe('tower.floors', () => this.update())
  }

  show() { if (this._el) this._el.style.display = 'block'; this._visible = true }
  hide() { if (this._el) this._el.style.display = 'none'; this._visible = false }

  update() {
    if (!this._visible) return
    const floor = store.get('tower.currentFloor') || 1
    const player = store.get('player')
    const tower = store.get('tower')
    this._floorEl.textContent = `PISO ${floor}`
    this._starsEl.textContent = `⭐ ${tower.floors ? Object.values(tower.floors).reduce((s,f) => s+(f.stars||0),0) : 0}`
    const zone = this._tower?.getZone(floor)
    if (zone) this._floorEl.textContent = `PISO ${floor} · ${zone.name}`
    this._xpText.textContent = `${player.xp} XP`
    this._levelText.textContent = `Nv. ${player.level}`
    const progress = this._getXPProgress()
    this._xpBar.style.width = `${Math.min(100, progress)}%`
  }

  _getXPProgress() {
    const player = store.get('player')
    const xp = player.xp
    const level = player.level
    const prevReq = level <= 1 ? 0 : this._xpForLevel(level - 1)
    const nextReq = this._xpForLevel(level)
    return ((xp - prevReq) / (nextReq - prevReq)) * 100
  }

  _xpForLevel(l) {
    return XP_TABLE[Math.min(l, XP_TABLE.length - 1)]
  }
}
