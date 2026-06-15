import fs from 'fs'
import path from 'path'

export class SnapshotManager {
  constructor({ snapDir = './snapshots' } = {}) {
    this.goldenDir = path.join(snapDir, 'golden')
    this.actualDir = path.join(snapDir, 'actual')
    this.diffDir = path.join(snapDir, 'diffs')
    for (const d of [this.goldenDir, this.actualDir, this.diffDir]) {
      if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true })
    }
  }

  goldenPath(gameId, snapshotName) {
    return path.join(this.goldenDir, gameId, `${snapshotName}.png`)
  }

  actualPath(gameId, snapshotName) {
    return path.join(this.actualDir, gameId, `${snapshotName}.png`)
  }

  diffPath(gameId, snapshotName) {
    return path.join(this.diffDir, gameId, `${snapshotName}-diff.png`)
  }

  async saveSnapshot(page, gameId, snapshotName) {
    const canvasCount = await page.evaluate(() => document.querySelectorAll('canvas').length)
    if (!canvasCount) return null
    const dir = path.join(this.actualDir, gameId)
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    const dataUrl = await page.evaluate(() => {
      const c = document.querySelector('canvas')
      return c ? c.toDataURL('image/png') : null
    })
    if (!dataUrl) return null
    const base64 = dataUrl.replace(/^data:image\/png;base64,/, '')
    const filePath = this.actualPath(gameId, snapshotName)
    fs.writeFileSync(filePath, base64, 'base64')
    return filePath
  }

  goldenExists(gameId, snapshotName) {
    return fs.existsSync(this.goldenPath(gameId, snapshotName))
  }

  async loadGoldenSnapshot(gameId, snapshotName) {
    const fp = this.goldenPath(gameId, snapshotName)
    if (!fs.existsSync(fp)) return null
    return fs.readFileSync(fp)
  }

  async saveAsGolden(page, gameId, snapshotName) {
    const dataUrl = await page.evaluate(() => {
      const c = document.querySelector('canvas')
      return c ? c.toDataURL('image/png') : null
    })
    if (!dataUrl) return null
    const base64 = dataUrl.replace(/^data:image\/png;base64,/, '')
    const dir = path.join(this.goldenDir, gameId)
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    const filePath = this.goldenPath(gameId, snapshotName)
    fs.writeFileSync(filePath, base64, 'base64')
    return filePath
  }

  getGameList() {
    if (!fs.existsSync(this.goldenDir)) return []
    return fs.readdirSync(this.goldenDir).filter(f =>
      fs.statSync(path.join(this.goldenDir, f)).isDirectory()
    )
  }

  getSnapshotsForGame(gameId) {
    const dir = path.join(this.goldenDir, gameId)
    if (!fs.existsSync(dir)) return []
    return fs.readdirSync(dir).filter(f => f.endsWith('.png')).map(f => f.replace('.png', ''))
  }

  listAllActual() {
    if (!fs.existsSync(this.actualDir)) return {}
    const result = {}
    for (const game of fs.readdirSync(this.actualDir)) {
      const gameDir = path.join(this.actualDir, game)
      if (fs.statSync(gameDir).isDirectory()) {
        result[game] = fs.readdirSync(gameDir).filter(f => f.endsWith('.png'))
      }
    }
    return result
  }
}
