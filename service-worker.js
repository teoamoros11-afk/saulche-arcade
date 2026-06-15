var CACHE = 'grizzy-v1'
var GAMES = []
for (var i = 1; i <= 40; i++) GAMES.push('juego' + (i < 10 ? '0' : '') + i + '.html')
;[
  'tetris',
  'snake',
  'pong',
  'breakout',
  'tictactoe',
  'simon',
  'minesweeper',
  'donkey',
  'kingkong',
  'submarino',
  'comecocos',
  'hundirlaflota',
  'flappygrizzy',
].forEach(function (n) {
  GAMES.push(n + '.html')
})

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches
      .open(CACHE)
      .then(function (c) {
        return c.addAll(
          [].concat(
            [
              './',
              'index.html',
              'manifest.json',
              'assets/icon.svg',
              'assets/icon-192.png',
              'assets/icon-512.png',
              'js/audio.js',
              'js/save.js',
              'js/canvas.js',
              'js/particles.js',
              'js/grizzy.js',
            ],
            GAMES,
          ),
        )
      })
      .then(function () {
        return self.skipWaiting()
      }),
  )
})

self.addEventListener('activate', function (e) {
  e.waitUntil(self.clients.claim())
})

self.addEventListener('fetch', function (e) {
  e.respondWith(
    caches.match(e.request).then(function (r) {
      return r || fetch(e.request)
    }),
  )
})
