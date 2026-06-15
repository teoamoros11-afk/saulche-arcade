import { readFileSync } from 'fs'
import { join } from 'path'

const GAMES_DIR = process.cwd()

export function readGameHTML(filename) {
  return readFileSync(join(GAMES_DIR, filename), 'utf-8')
}

export function extractGameInfo(filename) {
  const html = readGameHTML(filename)
  return {
    title: extractTitle(html),
    saveKeys: extractSaveKeys(html),
    usesCanvas: /<canvas/i.test(html),
    canvasId: extractCanvasId(html),
    hasAI: /\b(?:AI|ai|computerMove|enemyAI|makeMove|aiPaddle)\s*(?:\(|\s*=\s*function)/i.test(html),
    hasLevels: /\blevel\b|\bnivel\b/i.test(html),
    hasRestart: /function\s+(?:restartGame|resetGame|restart|reset)/.test(html),
    scripts: extractScripts(html),
  }
}

function extractTitle(html) {
  const m = html.match(/<title>([^<]+)<\/title>/)
  return m ? m[1] : 'Unknown'
}

function extractSaveKeys(html) {
  const keys = new Set()
  for (const m of html.matchAll(/(?:saveBest|loadBest|saveProgress|loadProgress|saveJSON|loadJSON)\s*\(\s*['"]([^'"]+)['"]/g)) keys.add(m[1])
  for (const m of html.matchAll(/localStorage\.(?:setItem|getItem)\s*\(\s*['"]([^'"]+)['"]/g)) keys.add(m[1])
  return [...keys]
}

function extractCanvasId(html) {
  const m = html.match(/<canvas\s+[^>]*id\s*=\s*['"](\w+)['"]/)
  return m ? m[1] : null
}

function extractScripts(html) {
  return [...html.matchAll(/<script\s+src="([^"]+)"><\/script>/g)].map(m => m[1])
}
