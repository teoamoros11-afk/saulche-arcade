const CACHE = 'mentis-v1'
const FILES = [
  '/',
  '/index.html',
  '/css/variables.css',
  '/css/base.css',
  '/css/layout.css',
  '/css/components.css',
  '/css/tower.css',
  '/css/puzzles.css',
  '/css/animations.css',
  '/js/app.js',
  '/js/core/Store.js',
  '/js/core/EventBus.js',
  '/js/core/GameLoop.js',
  '/js/core/Input.js',
  '/js/core/Audio.js',
  '/js/core/Save.js',
  '/js/tower/Tower.js',
  '/js/tower/Floor.js',
  '/js/tower/Difficulty.js',
  '/js/puzzles/Engine.js',
  '/js/puzzles/MathPuzzle.js',
  '/js/puzzles/LogicPuzzle.js',
  '/js/puzzles/VisualPuzzle.js',
  '/js/puzzles/StrategyPuzzle.js',
  '/js/puzzles/MemoryPuzzle.js',
  '/js/puzzles/Registry.js',
  '/js/systems/Progression.js',
  '/js/systems/Achievements.js',
  '/js/systems/Streaks.js',
  '/js/systems/Stats.js',
  '/js/systems/Hints.js',
  '/js/systems/Daily.js',
  '/js/ui/ScreenManager.js',
  '/js/ui/HUD.js',
  '/js/ui/Particles.js',
  '/js/ui/Modal.js',
  '/js/ui/Transitions.js',
  '/manifest.json',
]
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)))
  self.skipWaiting()
})
self.addEventListener('activate', (e) => {
  e.waitUntil(clients.claim())
})
self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request).catch(() => new Response('', { status: 200 })))
  )
})
