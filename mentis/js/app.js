import { store } from './core/Store.js'
import { events } from './core/EventBus.js'
import GameLoop from './core/GameLoop.js'
import InputManager from './core/Input.js'
import AudioManager from './core/Audio.js'
import SaveManager from './core/Save.js'
import { TowerManager } from './tower/Tower.js'
import { AdaptiveDifficulty } from './tower/Difficulty.js'
import { ProgressionSystem } from './systems/Progression.js'
import { AchievementSystem } from './systems/Achievements.js'
import { StreakSystem } from './systems/Streaks.js'
import { StatsTracker } from './systems/Stats.js'
import { HintSystem } from './systems/Hints.js'
import { DailyChallenge } from './systems/Daily.js'
import { ScreenManager } from './ui/ScreenManager.js'
import { HUD } from './ui/HUD.js'
import { ParticleEngine } from './ui/Particles.js'
import { ModalManager, NotificationSystem } from './ui/Modal.js'
import { TransitionEngine } from './ui/Transitions.js'
import { getEngine, getRandomCategory, CATEGORIES } from './puzzles/Registry.js'

const canvas = document.getElementById('game-canvas')
const ctx = canvas.getContext('2d')
const VW = 400, VH = 600
canvas.width = VW
canvas.height = VH

const COLORS = {
  textPrimary: '#ffffff',
  textSecondary: '#a090b0',
  textMuted: '#605070',
  gold: '#ffd700',
  bgDark: '#0a0a1a',
  bgMid: '#0f0f2a',
  bgLight: '#1a0a2e',
}

function resize() {
  const ww = window.innerWidth, wh = window.innerHeight
  const s = Math.min(ww / VW, wh / VH)
  canvas.style.width = Math.round(VW * s) + 'px'
  canvas.style.height = Math.round(VH * s) + 'px'
}
window.addEventListener('resize', resize)
resize()

const input = new InputManager()
export const audio = new AudioManager()
const loop = new GameLoop({ fps: 60 })
const particles = new ParticleEngine(canvas)
const transitions = new TransitionEngine(canvas)
const tower = new TowerManager()
const difficulty = new AdaptiveDifficulty()
const progression = new ProgressionSystem()
const achievements = new AchievementSystem()
const streaks = new StreakSystem()
const stats = new StatsTracker()
const hints = new HintSystem()
const daily = new DailyChallenge()
const screens = new ScreenManager(document.getElementById('app'))
const hud = new HUD(document.getElementById('app'), tower)
const modal = new ModalManager(document.getElementById('app'))
const notify = new NotificationSystem(document.getElementById('app'))

let currentPuzzles = []
let currentFloorData = null
let solvedCount = 0
let floorStartStars = 0

function loadSave() {
  const data = SaveManager.load()
  if (data) {
    Object.keys(data).forEach(k => {
      if (k !== 'settings') store.set(k, data[k])
    })
    if (data.settings) store.set('settings', data.settings)
  }
}

function saveGame() {
  SaveManager.save(store.snapshot())
}

store.observe('*', () => saveGame())

events.on('puzzle:solved', (result) => {
  if (result.correct) {
    solvedCount++
    const floor = store.get('tower.currentFloor')
    events.emit('tower:puzzleSolved', { floor, solvedCount, total: 3, stars: result.stars })
  }
})

function loadFloor(num) {
  const floor = tower.getFloor(num)
  currentFloorData = floor
  currentPuzzles = []
  solvedCount = 0
  floorStartStars = floor.stars || 0
  const engine = getEngine(floor.category)
  for (let i = 0; i < 3; i++) {
    const puzzle = engine.generate(floor.difficulty)
    currentPuzzles.push({ puzzle, solved: false, index: i })
  }
  hints.reset()
  hud.show()
  hud.update()
  renderFloor()
}

function renderFloor() {
  const f = currentFloorData
  if (!f) return
  ctx.clearRect(0, 0, VW, VH)
  drawBackground()
  const total = 3
  const solved = solvedCount
  const zone = tower.getZone(f.num)
  ctx.fillStyle = 'rgba(255,255,255,0.05)'
  roundRect(ctx, 10, 10, VW - 20, 70, 12)
  ctx.fill()
  ctx.fillStyle = zone?.color || '#ffd700'
  ctx.font = 'bold 14px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(`${zone?.icon || '🏗️'} PISO ${f.num}: ${zone?.name || 'Torre'}`, VW / 2, 28)
  ctx.fillStyle = COLORS.textSecondary
  ctx.font = '12px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(`${CATEGORIES[f.category]?.icon || '🧩'} ${CATEGORIES[f.category]?.name || 'Mixto'} · Dificultad ${f.difficulty}/10`, VW / 2, 52)
  for (let i = 0; i < total; i++) {
    const bx = 16 + i * ((VW - 32) / 3 + 4)
    const bw = (VW - 32) / 3
    const by = 95
    const isSolved = i < solved
    ctx.fillStyle = isSolved ? 'rgba(76,175,80,0.2)' : 'rgba(255,255,255,0.05)'
    roundRect(ctx, bx, by, bw, 30, 6)
    ctx.fill()
    if (isSolved) {
      ctx.strokeStyle = 'rgba(76,175,80,0.4)'
      ctx.lineWidth = 1
      ctx.stroke()
    }
    ctx.fillStyle = isSolved ? '#4caf50' : COLORS.textMuted
    ctx.font = 'bold 12px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(isSolved ? '✓' : `${i + 1}`, bx + bw / 2, by + 15)
  }
  if (solved >= 2) {
    const p = 0.5 + Math.sin(Date.now() * 0.005) * 0.5
    ctx.globalAlpha = p
    ctx.fillStyle = '#ffd700'
    ctx.font = 'bold 14px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('⬆ ¡TOCA PARA SUBIR AL SIGUIENTE PISO! ⬆', VW / 2, 150)
    ctx.globalAlpha = 1
  } else if (solved < 2) {
    ctx.fillStyle = COLORS.textMuted
    ctx.font = '11px sans-serif'
    ctx.fillText('Resuelve al menos 2 puzzles para avanzar', VW / 2, 150)
  }
  currentPuzzles.forEach((p, i) => {
    if (p.solved || i < solved) return
    const bx = 16, by = 170 + (i - solved) * 130
    const bw = VW - 32
    ctx.fillStyle = 'rgba(255,255,255,0.04)'
    roundRect(ctx, bx, by, bw, 120, 10)
    ctx.fill()
    ctx.strokeStyle = 'rgba(255,255,255,0.06)'
    ctx.lineWidth = 1
    ctx.stroke()
    ctx.fillStyle = COLORS.textPrimary
    ctx.font = '12px sans-serif'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'
    const lines = p.puzzle.text.split('\n')
    for (let li = 0; li < Math.min(4, lines.length); li++) {
      ctx.fillText(lines[li].substring(0, 35), bx + 12, by + 10 + li * 16)
    }
    ctx.fillStyle = '#7c4dff'
    ctx.font = 'bold 11px sans-serif'
    ctx.fillText('🔹 TOCA PARA RESOLVER', bx + 12, by + 90)
  })
}

function showPuzzle(index) {
  const actualIndex = currentPuzzles.findIndex((p, i) => !p.solved && i >= solvedCount)
  if (actualIndex < 0) return
  const p = currentPuzzles[actualIndex]
  if (!p) return
  renderPuzzle(p, actualIndex)
}

let puzzleAnswered = false
let puzzleSelectHandler = null

function renderPuzzle(p, idx) {
  const cats = CATEGORIES[p.puzzle.data?.category] || { icon: '🧩', name: 'Puzzle' }
  ctx.clearRect(0, 0, VW, VH)
  drawBackground()
  ctx.fillStyle = 'rgba(255,255,255,0.04)'
  roundRect(ctx, 10, 10, VW - 20, 70, 12)
  ctx.fill()
  ctx.fillStyle = COLORS.textMuted
  ctx.font = '11px sans-serif'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'
  ctx.fillText(`${cats.icon} ${cats.name} · Puzzle ${solvedCount + 1}/3`, 20, 18)
  ctx.fillStyle = COLORS.textSecondary
  ctx.font = '10px sans-serif'
  ctx.fillText(`Piso ${store.get('tower.currentFloor')}`, 20, 36)
  const timer = Math.floor((Date.now() - (p._startTime || Date.now())) / 1000)
  ctx.fillStyle = timer > 20 ? '#ef5350' : COLORS.textMuted
  ctx.textAlign = 'right'
  ctx.fillText(`${timer}s`, VW - 20, 18)
  if (puzzleAnswered) {
    ctx.fillStyle = COLORS.gold
    ctx.font = 'bold 13px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('✓ Continuando...', VW / 2, 55)
  }
  const lines = p.puzzle.text.split('\n')
  ctx.fillStyle = COLORS.textPrimary
  ctx.font = '14px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'
  let ty = 95
  for (const line of lines) {
    if (ctx.measureText(line).width > VW - 40) {
      const mid = Math.floor(line.length / 2)
      let split = mid
      for (let s = mid; s < line.length; s++) { if (line[s] === ' ') { split = s; break } }
      ctx.fillText(line.substring(0, split), VW / 2, ty)
      ty += 20
      ctx.fillText(line.substring(split + 1), VW / 2, ty)
    } else {
      ctx.fillText(line, VW / 2, ty)
    }
    ty += 20
  }
  const opts = p.puzzle.options || []
  const totalOpts = opts.length
  const cols = totalOpts <= 4 ? 2 : 2
  const rows = Math.ceil(totalOpts / cols)
  const bw = (VW - 40) / cols
  const bh = 44
  const startY = Math.max(ty + 20, 280)
  for (let i = 0; i < totalOpts; i++) {
    const col = i % cols, row = Math.floor(i / cols)
    const bx = 14 + col * (bw + 6)
    const by = startY + row * (bh + 6)
    let bg = 'rgba(255,255,255,0.06)'
    let tc = COLORS.textPrimary
    if (puzzleAnswered) {
      if (i === p.puzzle.answer) { bg = 'rgba(76,175,80,0.25)'; tc = '#4caf50' }
      else if (i === p._selected) { bg = 'rgba(239,83,80,0.25)'; tc = '#ef5350' }
    }
    ctx.fillStyle = bg
    roundRect(ctx, bx, by, bw, bh, 8)
    ctx.fill()
    ctx.fillStyle = tc
    ctx.font = 'bold 13px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    const label = String.fromCharCode(65 + i)
    ctx.fillText(`${label}. ${opts[i]}`, bx + bw / 2, by + bh / 2)
  }
  if (puzzleAnswered) {
    const isCorrect = p._selected === p.puzzle.answer
    ctx.fillStyle = isCorrect ? '#4caf50' : '#ef5350'
    ctx.font = 'bold 14px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(isCorrect ? '✓ ¡Correcto!' : '✗ Incorrecto', VW / 2, startY + rows * (bh + 6) + 30)
    const timeTaken = Math.floor((Date.now() - p._startTime) / 1000)
    if (isCorrect) {
      ctx.fillStyle = COLORS.gold
      ctx.font = '11px sans-serif'
      ctx.fillText(`+${25 + Math.max(0, 15 - timeTaken) * 2} XP · ${timeTaken}s`, VW / 2, startY + rows * (bh + 6) + 52)
    }
  }
  if (!puzzleAnswered) {
    ctx.fillStyle = 'rgba(255,255,255,0.2)'
    ctx.font = '10px sans-serif'
    ctx.fillText('Toca una opción o presiona 1-4 / A-D', VW / 2, startY + rows * (bh + 6) + 26)
  }
  particles.render(ctx)
}

function drawBackground() {
  const grad = ctx.createLinearGradient(0, 0, 0, VH)
  grad.addColorStop(0, '#0a0a1a')
  grad.addColorStop(0.5, '#0f0f2a')
  grad.addColorStop(1, '#1a0a2e')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, VW, VH)
  ctx.fillStyle = 'rgba(124,77,255,0.04)'
  for (let i = 0; i < 5; i++) {
    const x = (Math.sin(Date.now() * 0.0001 + i * 1.5) * 0.5 + 0.5) * VW
    const y = (Math.cos(Date.now() * 0.00008 + i * 2) * 0.5 + 0.5) * VH
    ctx.beginPath()
    ctx.arc(x, y, 30 + i * 10, 0, Math.PI * 2)
    ctx.fill()
  }
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, r)
}

function handleCanvasClick(nx, ny) {
  const screen = screens.getCurrent()
  if (screen === 'title' || screen === null) {
    screens.show('menu')
    audio.click()
    return
  }
  if (screen === 'menu') {
    const opt = getMenuOption(nx, ny)
    if (opt === 'play') { screens.show('tower'); hud.show() }
    else if (opt === 'daily') { screens.show('daily') }
    else if (opt === 'achievements') { screens.show('achievements') }
    else if (opt === 'stats') { screens.show('stats') }
    else if (opt === 'settings') { screens.show('settings') }
    if (opt) audio.click()
    return
  }
  if (screen === 'tower') {
    loadFloor(store.get('tower.currentFloor'))
    screens.show('floor')
    return
  }
  if (screen === 'floor') {
    if (solvedCount >= 2) {
      tower.advance()
      setTimeout(() => loadFloor(store.get('tower.currentFloor')), 100)
      return
    }
    const actualIdx = currentPuzzles.findIndex((p, i) => !p.solved && i >= solvedCount)
    if (actualIdx >= 0) {
      const p = currentPuzzles[actualIdx]
      p._startTime = Date.now()
      p._selected = -1
      puzzleAnswered = false
      screens.show('puzzle')
    }
    return
  }
  if (screen === 'puzzle') {
    if (puzzleAnswered) {
      puzzleAnswered = false
      const actualIdx = currentPuzzles.findIndex((p, i) => !p.solved && i >= solvedCount)
      if (actualIdx >= 0) {
        const p = currentPuzzles[actualIdx]
        if (p._selected === p.puzzle.answer) {
          p.solved = true
          const cat = p.puzzle.data?.category
          const time = (Date.now() - p._startTime) / 1000
          const floor = store.get('tower.currentFloor')
          events.emit('puzzle:solved', { correct: true, category: cat, time, xp: 25 + Math.max(0, 15 - Math.floor(time)) * 2, stars: time < 8 ? 3 : time < 15 ? 2 : 1, floor })
          particles.emitCorrect(VW / 2, VH / 2)
        } else {
          const floor = store.get('tower.currentFloor')
          events.emit('puzzle:solved', { correct: false, category: p.puzzle.data?.category, time: (Date.now() - p._startTime) / 1000, xp: 0, stars: 0, floor })
          particles.emitWrong(VW / 2, VH / 2)
        }
      }
      screens.show('floor')
      return
    }
    const actualIdx = currentPuzzles.findIndex((p, i) => !p.solved && i >= solvedCount)
    if (actualIdx < 0) return
    const p = currentPuzzles[actualIdx]
    const opts = p.puzzle.options || []
    const totalOpts = opts.length
    const cols = 2, rows = Math.ceil(totalOpts / cols)
    const lines = p.puzzle.text.split('\n')
    let ty = 95
    for (const line of lines) {
      if (ctx.measureText(line).width > VW - 40) ty += 20
      ty += 20
    }
    const bw = (VW - 40) / cols, bh = 44
    const startY = Math.max(ty + 20, 280)
    for (let i = 0; i < totalOpts; i++) {
      const col = i % cols, row = Math.floor(i / cols)
      const bx = 14 + col * (bw + 6)
      const by = startY + row * (bh + 6)
      if (nx >= bx && nx <= bx + bw && ny >= by && ny <= by + bh) {
        p._selected = i
        puzzleAnswered = true
        audio.click()
        return
      }
    }
  }
}

function getMenuOption(nx, ny) {
  const opts = [
    { id: 'play', x: 20, y: 200, w: VW - 40, h: 60 },
    { id: 'daily', x: 20, y: 275, w: VW - 40, h: 50 },
    { id: 'achievements', x: 20, y: 338, w: (VW - 50) / 2, h: 44 },
    { id: 'stats', x: VW / 2 + 5, y: 338, w: (VW - 50) / 2, h: 44 },
    { id: 'settings', x: 20, y: 395, w: VW - 40, h: 44 },
  ]
  for (const o of opts) {
    if (nx >= o.x && nx <= o.x + o.w && ny >= o.y && ny <= o.y + o.h) return o.id
  }
  return null
}

document.addEventListener('keydown', (e) => {
  const k = e.key
  const screen = screens.getCurrent()
  if ((screen === 'title' || screen === null) && (k === 'Enter' || k === ' ')) {
    screens.show('menu'); audio.click(); return
  }
  if (screen === 'puzzle' && !puzzleAnswered) {
    const m = { '1': 0, '2': 1, '3': 2, '4': 3, 'a': 0, 'b': 1, 'c': 2, 'd': 3 }
    if (k in m) {
      const actualIdx = currentPuzzles.findIndex((p, i) => !p.solved && i >= solvedCount)
      if (actualIdx >= 0) {
        const p = currentPuzzles[actualIdx]
        p._selected = m[k]
        puzzleAnswered = true
        audio.click()
      }
    }
  }
  if (k === 'Escape' && screen !== 'title' && screen !== 'menu' && screen !== null) {
    screens.show('menu')
  }
})

function renderTitle() {
  ctx.clearRect(0, 0, VW, VH)
  drawBackground()
  ctx.fillStyle = '#ffd700'
  ctx.font = 'bold 32px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  const p = 0.5 + Math.sin(Date.now() * 0.003) * 0.5
  ctx.fillText('🧠 MENTIS', VW / 2, 180)
  ctx.fillStyle = '#a090b0'
  ctx.font = '16px sans-serif'
  ctx.fillText('El Desafío del Saber', VW / 2, 225)
  ctx.fillStyle = 'rgba(124,77,255,0.5)'
  ctx.font = '12px sans-serif'
  ctx.fillText('100 pisos de puzzles · 5 categorías', VW / 2, 260)
  ctx.globalAlpha = p
  ctx.fillStyle = '#ffd700'
  ctx.font = 'bold 15px sans-serif'
  ctx.fillText('TOCA PARA COMENZAR', VW / 2, 350)
  ctx.globalAlpha = 1
  ctx.fillStyle = 'rgba(255,255,255,0.15)'
  ctx.font = '10px sans-serif'
  ctx.fillText('v1.0 · Hecho con ❤️ para mentes curiosas', VW / 2, 550)
  const best = store.get('player.xp') || 0
  if (best > 0) {
    ctx.fillStyle = '#ffd700'
    ctx.font = '12px sans-serif'
    ctx.fillText(`🏆 ${store.get('player.level') || 1} · ${store.get('stats')?.puzzlesSolved || 0} puzzles`, VW / 2, 400)
  }
}

function renderMenu() {
  ctx.clearRect(0, 0, VW, VH)
  drawBackground()
  hud.update()
  ctx.fillStyle = '#ffd700'
  ctx.font = 'bold 24px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('🧠 MENTIS', VW / 2, 50)
  const streak = streaks.getStreak()
  if (streak > 0) {
    ctx.fillStyle = '#ff9800'
    ctx.font = '12px sans-serif'
    ctx.fillText(`🔥 Racha: ${streak} días · ×${streaks.getStreakBonus()} XP`, VW / 2, 82)
  }
  const towerData = store.get('tower')
  const completed = towerData?.floors ? Object.values(towerData.floors).filter(f => f.completed).length : 0
  ctx.fillStyle = '#a090b0'
  ctx.font = '13px sans-serif'
  ctx.fillText(`Torre: Piso ${towerData?.currentFloor || 1} · ${completed} completados`, VW / 2, 112)
  const buttons = [
    { text: '▶  JUGAR', sub: `Piso ${towerData?.currentFloor || 1}`, y: 200, h: 60, color: '#7c4dff' },
    { text: '📅  Puzzle Diario', sub: 'Un puzzle nuevo cada día', y: 275, h: 50, color: '#448aff' },
    { text: '🏆  Logros', sub: '', y: 338, w: (VW - 50) / 2, color: '#ffd700' },
    { text: '📊  Estadísticas', sub: '', y: 338, x: VW / 2 + 5, w: (VW - 50) / 2, color: '#00bcd4' },
    { text: '⚙️  Ajustes', sub: '', y: 395, h: 44, color: '#a090b0' },
  ]
  for (const b of buttons) {
    const bx = b.x || 20
    const bw = b.w || (VW - 40)
    ctx.fillStyle = b.color + '22'
    roundRect(ctx, bx, b.y, bw, b.h || 50, 10)
    ctx.fill()
    ctx.strokeStyle = b.color + '44'
    ctx.lineWidth = 1
    ctx.stroke()
    ctx.fillStyle = b.color
    ctx.font = 'bold ' + (b.h > 50 ? '16' : '14') + 'px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(b.text, bx + bw / 2, b.y + (b.h || 50) / 2 - (b.sub ? 6 : 0))
    if (b.sub) {
    ctx.fillStyle = COLORS.textMuted
      ctx.font = '10px sans-serif'
      ctx.fillText(b.sub, bx + bw / 2, b.y + (b.h || 50) / 2 + 12)
    }
  }
  ctx.fillStyle = 'rgba(255,255,255,0.1)'
  ctx.font = '10px sans-serif'
  ctx.fillText('[ESC] Menú  ·  Pulsa 1-4 o toca para responder', VW / 2, VH - 20)
}

function renderAchievements() {
  ctx.clearRect(0, 0, VW, VH)
  drawBackground()
  ctx.fillStyle = '#ffd700'
  ctx.font = 'bold 20px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  const all = achievements.getAll()
  const unlocked = achievements.getUnlocked()
  ctx.fillText(`🏆 Logros (${unlocked.length}/${all.length})`, VW / 2, 30)
  ctx.fillStyle = COLORS.textMuted
  ctx.font = '10px sans-serif'
  ctx.fillText('Toca cualquier parte para volver', VW / 2, 56)
  const startY = 75
  const visible = all.slice(0, 14)
  for (let i = 0; i < visible.length; i++) {
    const a = visible[i]
    const isUnlocked = unlocked.includes(a.id)
    const y = startY + i * 35
    ctx.fillStyle = isUnlocked ? 'rgba(255,215,0,0.08)' : 'rgba(255,255,255,0.03)'
    roundRect(ctx, 10, y, VW - 20, 30, 6)
    ctx.fill()
    ctx.fillStyle = isUnlocked ? '#ffd700' : COLORS.textMuted
    ctx.font = '14px sans-serif'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'
    ctx.fillText(`${a.icon} ${a.name}`, 20, y + 15)
    ctx.textAlign = 'right'
    ctx.font = '9px sans-serif'
    ctx.fillText(isUnlocked ? '✓' : `+${a.xp} XP`, VW - 18, y + 15)
  }
  if (all.length > 14) {
    ctx.fillStyle = COLORS.textMuted
    ctx.font = '10px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('... y más logros por descubrir', VW / 2, startY + 14 * 35 + 10)
  }
}

function renderStats() {
  ctx.clearRect(0, 0, VW, VH)
  drawBackground()
  ctx.fillStyle = '#00bcd4'
  ctx.font = 'bold 20px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('📊 Estadísticas', VW / 2, 30)
  ctx.fillStyle = COLORS.textMuted
  ctx.font = '10px sans-serif'
  ctx.fillText('Toca para volver', VW / 2, 55)
  const st = store.get('stats')
  const player = store.get('player')
  const items = [
    ['🧩 Puzzles resueltos', st.puzzlesSolved],
    ['⭐ XP total', st.totalXP],
    ['⬆️ Nivel', player.level],
    ['🗼 Pisos completados', Object.values(store.get('tower')?.floors || {}).filter(f => f.completed).length],
    ['🔥 Mejor racha', `${st.bestStreak} días`],
    ['⏱️ Tiempo total', `${Math.floor((st.totalTime || 0) / 60)} min`],
    ['🎯 Mejor combo', st.bestCombo || 0],
    ['⚡ Más rápido', st.fastestSolve ? `${st.fastestSolve.toFixed(1)}s` : '—'],
    ['💡 Pistas usadas', st.hintsUsed || 0],
  ]
  const startY = 80
  for (let i = 0; i < items.length; i++) {
    const y = startY + i * 34
    ctx.fillStyle = 'rgba(255,255,255,0.04)'
    roundRect(ctx, 20, y, VW - 40, 28, 6)
    ctx.fill()
    ctx.fillStyle = COLORS.textSecondary
    ctx.font = '12px sans-serif'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'
    ctx.fillText(items[i][0], 30, y + 14)
    ctx.fillStyle = COLORS.textPrimary
    ctx.textAlign = 'right'
    ctx.font = 'bold 12px sans-serif'
    ctx.fillText(String(items[i][1]), VW - 28, y + 14)
  }
  const radarY = startY + items.length * 34 + 10
  ctx.fillStyle = COLORS.textMuted
  ctx.font = '11px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('Fortalezas por categoría', VW / 2, radarY)
  const cats = st.byCategory || {}
  const max = Math.max(1, ...Object.values(cats))
  const catColors = { math: '#448aff', logic: '#7c4dff', visual: '#00bcd4', strategy: '#ff9800', memory: '#e91e63' }
  const catLabels = { math: '🧮', logic: '🧠', visual: '👁️', strategy: '♟️', memory: '🔄' }
  let cx = 30
  for (const [key, val] of Object.entries(cats)) {
    const pct = Math.min(100, Math.round(val / max * 100))
    const color = catColors[key] || '#fff'
    ctx.fillStyle = color + '33'
    roundRect(ctx, cx, radarY + 20, 60, 60, 6)
    ctx.fill()
    ctx.fillStyle = color
    ctx.font = 'bold 20px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(catLabels[key] || key, cx + 30, radarY + 40)
    ctx.fillStyle = COLORS.textSecondary
    ctx.font = '10px sans-serif'
    ctx.fillText(`${val}`, cx + 30, radarY + 62)
    cx += 68
  }
}

function renderSettings() {
  ctx.clearRect(0, 0, VW, VH)
  drawBackground()
  ctx.fillStyle = '#a090b0'
  ctx.font = 'bold 20px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('⚙️ Ajustes', VW / 2, 40)
  ctx.fillStyle = COLORS.textMuted
  ctx.font = '10px sans-serif'
  ctx.fillText('Toca para alternar · Toca fuera para volver', VW / 2, 65)
  const settings = store.get('settings')
  const items = [
    { id: 'sound', label: '🔊 Sonido', value: settings.sound },
    { id: 'music', label: '🎵 Música ambiente', value: settings.music },
    { id: 'particles', label: '✨ Partículas', value: settings.particles },
  ]
  for (let i = 0; i < items.length; i++) {
    const y = 100 + i * 50
    ctx.fillStyle = 'rgba(255,255,255,0.04)'
    roundRect(ctx, 20, y, VW - 40, 40, 8)
    ctx.fill()
    ctx.fillStyle = COLORS.textPrimary
    ctx.font = '14px sans-serif'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'
    ctx.fillText(items[i].label, 32, y + 20)
    ctx.fillStyle = items[i].value ? '#4caf50' : COLORS.textMuted
    ctx.textAlign = 'right'
    ctx.font = 'bold 13px sans-serif'
    ctx.fillText(items[i].value ? '✓ ON' : '○ OFF', VW - 30, y + 20)
  }
}

function renderDaily() {
  ctx.clearRect(0, 0, VW, VH)
  drawBackground()
  ctx.fillStyle = '#448aff'
  ctx.font = 'bold 18px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('📅 Puzzle Diario', VW / 2, 40)
  const dailyData = daily.generate()
  const prevScore = daily.getScore()
  if (prevScore) {
    ctx.fillStyle = '#ffd700'
    ctx.font = '14px sans-serif'
    ctx.fillText(`✓ Completado: ${prevScore.correct ? '✅' : '❌'}`, VW / 2, 80)
    ctx.fillStyle = COLORS.textMuted
    ctx.font = '11px sans-serif'
    ctx.fillText(`Tiempo: ${Math.floor(prevScore.time)}s`, VW / 2, 105)
  } else {
    ctx.fillStyle = COLORS.textSecondary
    ctx.font = '13px sans-serif'
    ctx.fillText('Un puzzle especial para hoy', VW / 2, 80)
    ctx.fillStyle = 'rgba(255,255,255,0.04)'
    roundRect(ctx, 20, 110, VW - 40, 120, 10)
    ctx.fill()
    ctx.fillStyle = COLORS.textPrimary
    ctx.font = '13px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'
    const lines = dailyData.puzzle.text.split('\n')
    let ty = 125
    for (const line of lines) {
      ctx.fillText(line, VW / 2, ty)
      ty += 18
    }
    ctx.fillStyle = '#7c4dff'
    ctx.font = 'bold 13px sans-serif'
    ctx.textBaseline = 'middle'
    ctx.fillText('🔹 Toca para resolver', VW / 2, ty + 20)
  }
}

screens.register('title', '', () => {})
screens.register('menu', '', () => {})
screens.register('tower', '', () => {})
screens.register('floor', '', () => {})
screens.register('puzzle', '', () => {})
screens.register('daily', '', () => {})
screens.register('achievements', '', () => {})
screens.register('stats', '', () => {})
screens.register('settings', '', () => {})

let currentRenderer = 'title'
events.on('screen:change', (id) => {
  currentRenderer = id
  if (id === 'floor') hud.show()
  else if (id === 'puzzle') { puzzleAnswered = false }
  else if (id === 'title') hud.hide()
  audio.click()
})

function handleInput(nx, ny) {
  const screen = screens.getCurrent()
  if (screen !== 'puzzle') handleCanvasClick(nx, ny)
  else if (!puzzleAnswered) handleCanvasClick(nx, ny)
  else {
    puzzleAnswered = false
    const actualIdx = currentPuzzles.findIndex((p, i) => !p.solved && i >= solvedCount)
    if (actualIdx >= 0) {
      const p = currentPuzzles[actualIdx]
      if (p._selected === p.puzzle.answer) {
        p.solved = true
        const cat = p.puzzle.data?.category
        const time = Math.floor((Date.now() - p._startTime) / 1000)
        const floor = store.get('tower.currentFloor')
        events.emit('puzzle:solved', { correct: true, category: cat, time, xp: 25 + Math.max(0, 15 - time) * 2, stars: time < 8 ? 3 : time < 15 ? 2 : 1, floor })
        particles.emitCorrect(VW / 2, VH / 2)
        audio.correct()
      } else {
        const floor = store.get('tower.currentFloor')
        events.emit('puzzle:solved', { correct: false, category: p.puzzle.data?.category, time: Math.floor((Date.now() - p._startTime) / 1000), xp: 0, stars: 0, floor })
        particles.emitWrong(VW / 2, VH / 2)
        audio.wrong()
      }
    }
    screens.show('floor')
  }
}

canvas.addEventListener('click', (e) => {
  const rect = canvas.getBoundingClientRect()
  const nx = ((e.clientX - rect.left) / rect.width) * VW
  const ny = ((e.clientY - rect.top) / rect.height) * VH
  handleInput(nx, ny)
})

canvas.addEventListener('touchstart', (e) => {
  e.preventDefault()
  const t = e.changedTouches[0]
  const rect = canvas.getBoundingClientRect()
  const nx = ((t.clientX - rect.left) / rect.width) * VW
  const ny = ((t.clientY - rect.top) / rect.height) * VH
  handleInput(nx, ny)
}, { passive: false })

loop.update = (dt) => {
  particles.update(dt)
  transitions.update(performance.now())
}

loop.render = () => {
  if (currentRenderer === 'title') renderTitle()
  else if (currentRenderer === 'menu') renderMenu()
  else if (currentRenderer === 'floor') renderFloor()
  else if (currentRenderer === 'puzzle') {
    const actualIdx = currentPuzzles.findIndex((p, i) => !p.solved && i >= solvedCount)
    if (actualIdx >= 0) renderPuzzle(currentPuzzles[actualIdx], actualIdx)
    else screens.show('floor')
  }
  else if (currentRenderer === 'achievements') renderAchievements()
  else if (currentRenderer === 'stats') renderStats()
  else if (currentRenderer === 'settings') renderSettings()
  else if (currentRenderer === 'daily') renderDaily()
  transitions.render(ctx)
}

loadSave()
tower.init()
loop.start()
