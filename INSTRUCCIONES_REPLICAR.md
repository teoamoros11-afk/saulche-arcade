# INSTRUCCIONES COMPLETAS — Replicar Grizzy's Arcade (58 Juegos)

> **Objetivo:** Crear desde cero un arcade de 58 juegos HTML5 funcionales, con estética "Grizzy and the Lemmings", PWA, guardado automático, y tests. Cada juego debe ser completamente funcional, con controles táctiles y de teclado, sonido, partículas, y progreso guardado.

---

## FASE 0: ESTRUCTURA DEL PROYECTO

Crear la siguiente estructura de carpetas:

```
proyecto/
├── index.html              ← Menú principal con grid de 58 juegos
├── manifest.json           ← PWA manifest
├── service-worker.js       ← Cache offline
├── package.json            ← Scripts de test y lint
├── eslint.config.mjs       ← Config ESLint
├── .prettierrc             ← Config Prettier
├── .gitignore
├── assets/
│   ├── icon.svg            ← Icono vectorial de oso
│   ├── icon-192.png        ← Icono 192x192
│   └── icon-512.png        ← Icono 512x512
├── js/
│   ├── audio.js            ← Sistema de sonido (Web Audio API)
│   ├── save.js             ← Guardado en localStorage
│   ├── canvas.js           ← Polyfill roundRect
│   ├── particles.js        ← Sistema de partículas + hojas
│   ├── grizzy.js           ← Dibuja al personaje Grizzy en canvas
│   └── back.js             ← Botón "← Menú" flotante
├── tetris.html             ← Cada juego es un HTML autocontenido
├── snake.html
├── pong.html
├── breakout.html
├── tictactoe.html
├── simon.html
├── minesweeper.html
├── donkey.html
├── kingkong.html
├── submarino.html
├── comecocos.html
├── hundirlaflota.html
├── flappygrizzy.html
├── juego01.html a juego40.html  ← 40 juegos custom
├── mentis/                 ← Subcarpeta con juego MENTIS
│   └── index.html
├── tests/                  ← Tests Playwright
│   └── playwright.config.js
└── verificacion-total/     ← Sistema de verificación exhaustiva
```

---

## FASE 1: ARCHIVOS BASE (js/)

### 1.1 js/audio.js — Sistema de Sonido

Crear un módulo de sonido que:
- Use Web Audio API (AudioContext)
- Exponga función global `sfx(frecuencia, duracion, tipo, volumen)` que genere tonos simples
- Tipos de onda: 'triangle' (default), 'square', 'sawtooth', 'sine'
- Default: duracion=0.12, tipo='triangle', volumen=0.07
- Exponga `sfxMelody(notas)` que reproduzca una secuencia de notas
- Cada nota es un array: [frecuencia, duracion, tipo, volumen, delay]
- Envolver todo en IIFE para no contaminar scope
- Manejar errores silenciosamente (try/catch vacío)

### 1.2 js/save.js — Sistema de Guardado

Crear módulo con estas funciones globales:
- `loadProgress(key, def)` — Carga progreso (nivel), limita entre 1-40
- `saveProgress(key, val)` — Guarda progreso
- `loadBest(key, def)` — Carga mejor puntuación
- `saveBest(key, val)` — Guarda mejor puntuación
- `loadJSON(key, def)` — Carga objeto JSON del localStorage
- `saveJSON(key, val)` — Guarda objeto JSON
- Todas con try/catch para manejar localStorage no disponible
- Todas parsean a Integer, devuelven def si NaN

### 1.3 js/canvas.js — Polyfill roundRect

- Verificar si `CanvasRenderingContext2D.prototype.roundRect` existe
- Si no, implementarlo con quadraticCurveTo
- IIFE autoejecutable

### 1.4 js/particles.js — Sistema de Partículas

Crear clase `ParticleSystem` con:
- Constructor que inicializa array de partículas
- `add(x, y, opts)` — Añade partículas con opciones: count, color, speed, gravity, life, lifeVar, minR, maxR
- `update(ctx)` — Actualiza posición, gravedad (0.12), vida, y dibuja si ctx proporcionado
- Cada partícula tiene: x, y, vx, vy, life, maxLife, color, r

Crear función global `createLeaves(ctx, w, h, count)`:
- Crea array de hojas flotantes con: x, y, s (tamaño), vy, vx, rot, dr, color, a (alpha)
- Colores: '#4CAF50', '#FF9800', '#8B5E3C', '#FFC107', '#6B4226'
- Retorna objeto con `draw()` y `resize(nw, nh)`
- Las hojas caen lento y rotan, se reciclan al salir del canvas

### 1.5 js/grizzy.js — Dibujo del Personaje

Crear función global `drawGrizzy(ctx, w, h)` que dibuje un oso antropomórfico:
- Cuerpo marrón (#8B5E3C) con hombros
- Suéter amarillo (#FFC107) con raya naranja (#FF9800)
- Cabeza redonda con orejas (círculos marrón oscuro #6b4226)
- Ojos blancos con pupila negra
- Nariz marrón oscuro
- Mejillas más claras (#A67C52)
- Escala automática basada en w,h
- Usar beginPath/arc/ellipse/fill

### 1.6 js/back.js — Botón Volver

- Si no estamos en index.html, crear elemento `<a>` fijo arriba a la izquierda
- Texto: "← Menú", href a index.html
- Estilo: fondo semi-transparente, bordes redondeados, blur
- Hover: oscurecer fondo
- No usar inline styles crudos, usar Object.assign con style

---

## FASE 2: ARCHIVOS DE CONFIGURACIÓN

### 2.1 manifest.json

```json
{
  "name": "Grizzy's Arcade - 58 Juegos",
  "short_name": "Grizzy Arcade",
  "description": "58 juegos para Grizzy y los Lemmings",
  "start_url": "/index.html",
  "display": "standalone",
  "orientation": "any",
  "background_color": "#2D1B0E",
  "theme_color": "#FF9800",
  "icons": [
    { "src": "assets/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "assets/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any maskable" }
  ]
}
```

### 2.2 service-worker.js

- Crear cache בשם 'grizzy-v1'
- Precachear: index.html, manifest.json, iconos, todos los js/ y todos los .html de juegos
- install: open cache → addAll → skipWaiting
- activate: clients.claim()
- fetch: responder con cache primero, fallback a network

### 2.3 package.json

```json
{
  "name": "saulche",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "lint": "eslint .",
    "format": "prettier --write .",
    "test": "npx playwright test"
  },
  "devDependencies": {
    "@playwright/test": "^1.60.0",
    "eslint": "^9.0.0",
    "prettier": "^3.0.0"
  }
}
```

### 2.4 .gitignore

```
node_modules/
test-results/
.vercel/
```

### 2.5 .prettierrc

```json
{
  "semi": false,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "all"
}
```

### 2.6 eslint.config.mjs

Configuración ESLint flat config con reglas básicas.

---

## FASE 3: ICONOS (assets/)

Crear 3 iconos:
1. **icon.svg** — Oso simple (Grizzy) en SVG, colores marrón #8B5E3C, suéter #FFC107
2. **icon-192.png** — Renderizar el SVG a 192x192
3. **icon-512.png** — Renderizar el SVG a 512x512

Si no se pueden generar PNGs, usar placeholder de color sólido con texto "G".

---

## FASE 4: INDEX.HTML — Menú Principal

Crear un index.html con:

### Estructura HTML:
- DOCTYPE html, lang="es"
- Meta viewport, theme-color, apple-mobile-web-app
- Link a manifest.json y icon.svg
- Estilos CSS inline (todo en el head)

### Diseño Visual:
- Fondo: gradiente vertical #2d1b0e → #4a2f1a → #1b3a2d → #0f281c
- Fuente: 'Segoe UI', 'Comic Sans MS', cursive
- Color texto: #fff8e1
- Header con dos iconos de oso (CSS puro) y título "🐻 Grizzy's Arcade"
- Subtítulo: "★ & the Lemmings ★"
- Stats bar: 58 Juegos, Completados (localStorage), Auto-guardado ✓, Offline ✓
- Badge PWA "📲 Instalar en tu dispositivo"

### Grid de Juegos:
- CSS Grid responsive: `repeat(auto-fill, minmax(clamp(120px, 15vmin, 170px), 1fr))`
- Cada juego es un `<a>` con class="game-btn" y data-save="key_guardado"
- Cada botón tiene: icono emoji, nombre, número (para juegoXX)
- Hover: escala, borde naranja, sombra
- Organizado en secciones:
  - "🌟 Clásicos Grizzy" (13 juegos: tetris, snake, pong, breakout, tictactoe, simon, minesweeper, donkey, kingkong, submarino, comecocos, hundirlaflota, flappygrizzy)
  - "🎈 Aventuras Vol. 1" (3 juegos: juego01, juego04, juego19)
  - "🌈 Aventuras Vol. 2" (1 juego: juego21)
  - "🧠 MENTIS" (1 juego)

### JavaScript del Index:
- Hojas cayendo (animación CSS + JS): máximo 50 hojas, colores variados, caída suave
- Contador de completados: leer data-save del localStorage, contar los que tengan valor > 0
- Botón "volver arriba" que aparece al scrollear 600px
- Service Worker registration
- PWA install prompt: beforeinstallprompt → mostrar botón

---

## FASE 5: JUEGOS CLÁSICOS (13 archivos HTML)

Cada juego clásico debe ser un archivo HTML autocontenido (CSS + JS inline) que use los módulos de js/ via script tags.

### Estilo Común de Todos los Juegos:
- Fondo: #2d1b0e
- Centro: flexbox centrado
- Fuente: 'Segoe UI', sans-serif
- Color: #fff8e1
- Canvas de hojas de fondo (#leafCanvas)
- Wrapper del juego con z-index:1
- Sidebar con info (puntuación, nivel, mejor, controles)
- Estilo de sidebar: fondo rgba(45,27,14,0.9), borde 2px solid #ff9800, border-radius 16px
- Colores del juego: amarillo #FFC107, naranja #FF9800, marrón #8B5E3C

### 5.1 tetris.html — Tetris
- **Juego:** Rotar y colocar piezas en un tablero 10x20
- **Piezas:** I, O, T, S, Z, J, L (7 piezas clásicas con colores)
- **Controles:** Flechas izq/der para mover, Flecha arriba para rotar, Flecha abajo para bajar rápido, Espacio para hard drop
- **Touch:** Botones en pantalla (← → △ ▼)
- **Lógica:** Tablero como array 2D, colisión, líneas completas → eliminar + puntos
- **Puntuación:** 1 línea=100, 2=300, 3=500, 4=800 × nivel
- **Nivel:** Aumenta cada 10 líneas, velocidad aumenta
- **Guardado:** saveProgress con key "tetris_grizzy" (nivel), saveBest con "tetris_best" (mejor puntos)
- **Game Over:** Cuando nueva pieza no cabe arriba del tablero

### 5.2 snake.html — Snake
- **Juego:** Serpiente come manzanas, crece, no chocar bordes ni consigo misma
- **Tablero:** Grid en canvas
- **Controles:** Flechas o WASD
- **Touch:** 4 botones direccionales
- **Lógica:** Array de segmentos, dirección actual, manzana aleatoria, crecer al comer
- **Puntuación:** +10 por manzana
- **Velocidad:** Aumenta cada 5 manzanas
- **Guardado:** saveProgress "snake_grizzy", saveBest "snake_best"

### 5.3 pong.html — Pong
- **Juego:** 2 paletas y pelota, primer jugador en llegar a 11 gana
- **Controles:** W/S ( jugador 1 ) o Flechas (jugador 2) — o contra CPU
- **Touch:** Mover paleta arriba/abajo con toque en pantalla
- **Lógica:** Pelota rebota en techos y paletas, velocidad aumenta con cada rebote
- **CPU:** IA simple que sigue la pelota con retardo
- **Guardado:** "pong_grizzy", "pong_best"

### 5.4 breakout.html — Breakout
- **Juego:** Romper ladrillos con pelota y paleta
- **Niveles:** Múltiples niveles con patrones de ladrillos diferentes
- **Controles:** Flechas o mouse para mover paleta
- **Touch:** Mover paleta con toque
- **Puntuación:** Cada ladrillo vale puntos, filas superiores más
- **Vidas:** 3 vidas, perder pelota = -1 vida
- **Guardado:** "breakout_grizzy", "breakout_best"

### 5.5 tictactoe.html — Tres en Raya
- **Juego:** Tablero 3x3, X vs O, primero en línea gana
- **Modos:** vs CPU o 2 jugadores
- **Controles:** Click/touch en celda
- **CPU:** IA minimax o heuristic simple
- **Animación:** Ganador resaltado con animación
- **Guardado:** "tictactoe_grizzy", "tictactoe_best"

### 5.6 simon.html — Simon
- **Juego:** Secuencia de colores, repetirla
- **Colores:** 4 colores (rojo, azul, amarillo, verde) en círculo
- **Controles:** Click en colores
- **Touch:** Funciona en móvil
- **Lógica:** Mostrar secuencia → jugador repite → siguiente nivel = +1 color
- **Sonido:** Cada color tiene frecuencia diferente
- **Guardado:** "simon_grizzy", "simon_best"

### 5.7 minesweeper.html — Buscaminas
- **Juego:** Tablero con minas ocultas, revelar celdas seguras
- **Tamaño:** 9x9 con 10 minas (principiante)
- **Controles:** Click izquierdo = revelar, Click derecho = bandera
- **Touch:** Long press = bandera
- **Lógica:** BFS para revelar celdas vacías, números = minas adyacentes
- **Guardado:** "minesweeper_grizzy", "minesweeper_best"

### 5.8 donkey.html — Donkey Kong
- **Juego:** Plataformas, saltar entre niveles, esquivar barriles
- **Controles:** Flechas mover, Espacio saltar
- **Touch:** Botones en pantalla
- **Lógica:** Gravedad, colisión con plataformas, barriles que ruedan
- **Niveles:** 3 niveles con dificultad creciente
- **Guardado:** "donkey_grizzy", "donkey_best"

### 5.9 kingkong.html — King Kong
- **Juego:** Escalar edificio evitando obstáculos
- **Controles:** Flechas
- **Touch:** Botones
- **Lógica:** Plataformas, enemigos,Items coleccionables
- **Guardado:** "kingkong_grizzy", "kingkong_best"

### 5.10 submarino.html — Submarino
- **Juego:** Navegar submarino, esquivar minas y enemigos
- **Controles:** Flechas mover, Espacio disparar
- **Touch:** Botones
- **Lógica:** Movimiento fluido, disparos, colisiones
- **Guardado:** "submarino_grizzy", "submarino_best"

### 5.11 comecocos.html — Pac-Man
- **Juego:** Laberinto con puntos, fantasma, power pellets
- **Controles:** Flechas
- **Touch:** Swipe o botones
- **Lógica:** Laberinto predefinido, IA fantasmas, power pellets = perseguir
- **Guardado:** "comecocos_grizzy", "comecocos_best"

### 5.12 hundirlaflota.html — Hundir la Flota
- **Juego:** Battleship, colocar barcos y hundir los del rival
- **Controles:** Click para disparar
- **Touch:** Funciona
- **Lógica:** Tablero doble, colocación de barcos, IA del rival
- **Guardado:** "hundirlaflota_grizzy"

### 5.13 flappygrizzy.html — Flappy Bird
- **Juego:** Grizzy vuela entre tubos, no tocar
- **Controles:** Espacio o Click para saltar
- **Touch:** Tocar pantalla
- **Lógica:** Gravedad, tubos generados, colisión
- **Puntuación:** +1 por tubo superado
- **Guardado:** "flappy_grizzy", "flappy_best"

---

## FASE 6: JUEGOS CUSTOM (juego01.html a juego40.html)

Crear 40 juegos variados. Cada uno debe ser un HTML autocontenido con:
- Canvas para dibujar
- Game loop con requestAnimationFrame
- Controles keyboard + touch
- Sonido con sfx()
- Partículas con ParticleSystem
- Guardado con saveProgress/saveBest
- Estética Grizzy (colores marrón/amarillo/naranja)

### Lista de Juegos Sugeridos:

| # | Nombre | Tipo | Descripción |
|---|--------|------|-------------|
| 01 | Saltador Nubes | Platformer | Saltar entre nubes, evitar caer |
| 02 | Puzzler | Puzzle | Encajar piezas |
| 03 | Runner | Endless runner | Correr esquivando obstáculos |
| 04 | Laberinto Feliz | Maze | Encontrar salida del laberinto |
| 05 | Bubble Shooter | Shooter | Disparar burbujas, combinar colores |
| 06 | Memory | Memory | Encontrar pares de cartas |
| 07 | Whack-a-Mole | Arcade | Martillar topos |
| 08 | Pinball | Arcade | Pinball con bola y flippers |
| 09 | Arkanoid | Breakout | Breakout con power-ups |
| 10 | Brick Builder | Puzzle | Construir con bloques |
| 11 | Color Match | Reflexión | Repetir secuencia de colores |
| 12 | Word Scramble | Palabras | Desordenar y adivinar palabras |
| 13 | Tic Tac Toe 3D | Strategy | Tres en raya en tablero 4x4x4 |
| 14 | Checkers | Board | Damas inglesas |
| 15 | Chess Puzzle | Puzzle | Resolver problemas de ajedrez |
| 16 | Sudoku | Logic | Sudoku 9x9 |
| 17 | Nonogram | Logic | Puzzles de imagen por números |
| 18 | Sliding Puzzle | Puzzle | Puzzle deslizante 15 |
| 19 | Aventura Submarina | Adventure | Explorar fondo del mar |
| 20 | Space Invaders | Shooter | Invasores espaciales |
| 21 | Caracol Veloz | Racing | Carrera de caracoles |
| 22 | Jump Stack | Arcade | Apilar bloques saltando |
| 23 | Arrow Dodge | Reflexión | Esquivar flechas |
| 24 | Catch Fruits | Arcade | Capturar frutas cayendo |
| 25 | Maze Runner 3D | Maze | Laberinto en pseudo-3D |
| 26 | Connect Four | Board | Cuatro en línea |
| 27 | Reversi | Board | Othello/Reversi |
| 28 | Pipe Puzzle | Puzzle | Conectar tuberías |
| 29 | Tower Defense | Strategy | Defender torre de enemigos |
| 30 | Farm Harvest | Simulation | Cosechar cultivos |
| 31 | Temple Run | Runner | Correr en templo |
| 32 | Angry Birds | Physics | Lanzar pájaros |
| 33 | Cut the Rope | Physics | Cortar cuerdas |
| 34 | Doodle Jump | Platformer | Saltar en plataforma |
| 35 | Fruit Ninja | Arcade | Cortar frutas |
| 36 | Guitar Hero | Rhythm | Golpear notas al ritmo |
| 37 | Typing Speed | Skill | Escribir palabras rápido |
| 38 | Math Quiz | Education | Resolver operaciones |
| 39 | Trivia Quiz | Knowledge | Preguntas de cultura general |
| 40 | Drawing App | Creative | App de dibujo libre |

---

## FASE 7: JUEGO MENTIS (mentis/index.html)

Crear un juego especial "MENTIS — El Desafío del Saber":
- Trivia con múltiples categorías
- 4 opciones de respuesta
- Temporizador por pregunta
- Sistema de niveles
- Estilo premium con bordes púrpura (#7c4dff)
- Partículas especiales al acertar

---

## FASE 8: TESTS (tests/)

### 8.1 tests/playwright.config.js
- Configuración de Playwright
- Base URL: file:// o servidor local
- Timeouts: 30s
- Retries: 2
- Workers: 1

### 8.2 tests/verify-all.test.js
- Test que verifique que todos los juegos cargan sin errores
- Para cada .html, abrirlo y verificar:
  - No hay errores en consola
  - Canvas existe y tiene tamaño
  - Elementos UI presentes
  - Game loop funciona (requestAnimationFrame activo)

---

## FASE 9: VERIFICACIÓN EXHAUSTIVA (verificacion-total/)

Crear sistema de verificación con:

### 9.1 Core (verificacion-total/core/)
- **PixelMatcher.js** — Comparar screenshots pixel a pixel
- **SnapshotManager.js** — Guardar/cargar snapshots
- **HistoryRecorder.js** — Grabar historial de acciones
- **FaultInjector.js** — Inyectar errores para testing
- **StateExplorer.js** — Explorar estados del juego
- **FrameAnalyzer.js** — Analizar frames del canvas
- **GameOracle.js** — Oráculo que sabe el estado esperado

### 9.2 Input (verificacion-total/input/)
- **InputExhauster.js** — Probar todas las combinaciones de input
- **KeyboardSequencer.js** — Secuencias de teclado
- **MousePathGenerator.js** — Movimientos de ratón
- **TouchGestureGenerator.js** — Gestos táctiles
- **InputFuzzer.js** — Inputs aleatorios
- **TimingVariator.js** — Variar tiempos entre inputs

### 9.3 Analysis (verificacion-total/analysis/)
- **CanvasAnalyzer.js** — Analizar contenido del canvas
- **AudioAnalyzer.js** — Analizar sonido
- **MemoryProfiler.js** — Medir uso de memoria
- **FPSCounter.js** — Contar FPS
- **ConsoleInterceptor.js** — Interceptar console.log/err
- **ErrorBoundaryDetector.js** — Detectar errores no capturados

### 9.4 Rules (verificacion-total/rules/)
- **RuleEngine.js** — Motor de reglas
- **FormalSpecification.js** — especificaciones formales
- **InvariantChecker.js** — Verificar invariantes
- **TemporalLogicChecker.js** — Lógica temporal
- **game-specs.js** — Specs para cada uno de los 58 juegos

### 9.5 Reporting (verificacion-total/reporting/)
- **ReportGenerator.js** — Generar reporte HTML
- **PixelDiffVisualizer.js** — Visualizar diferencias pixel
- **StatsAggregator.js** — Agregar estadísticas
- **RegressionTracker.js** — Rastrear regresiones

### 9.6 Suites (verificacion-total/suites/)
14 suites de test:
1. 00-runner.js — Config central
2. 01-load/ — Tests de carga (4 tests × 58 juegos)
3. 02-canvas/ — Tests de canvas
4. 03-input/ — Tests de input (5 × 58)
5. 04-state/ — Tests de estado (6 × 58)
6. 05-rules/ — Tests de reglas (5 × 58)
7. 06-physics/ — Tests de física
8. 07-audio/ — Tests de audio (2 × 58)
9. 08-render/ — Tests de renderizado
10. 09-ai/ — Tests de IA
11. 10-persistence/ — Tests de localStorage
12. 11-performance/ — Tests de rendimiento
13. 12-edge/ — Tests edge cases
14. 13-regression/ — Tests de regresión
15. 14-exhaustive/ — Integración completa

---

## FASE 10: REGLAS DE DISEÑO

### Paleta de Colores:
- Fondo principal: #2d1b0e
- Marrón claro: #8B5E3C
- Marrón oscuro: #6b4226
- Amarillo: #FFC107
- Naranja: #FF9800
- Texto claro: #fff8e1
- Verde hoja: #4CAF50
- Púrpura (MENTIS): #7c4dff

### Tipografía:
- Principal: 'Segoe UI', sans-serif
- Títulos: 'Comic Sans MS', cursive (opcional)
- Tamaños: usar clamp() para responsive

### Responsive:
- Todos los juegos deben funcionar en móvil (320px mínimo)
- Touch controls para todos los juegos
- Viewport meta tag en cada HTML
- Medidas relativas (vmin, %, vw/vh)

### Accesibilidad:
- Contraste suficiente (texto claro sobre fondo oscuro)
- Tamaños de fuente legibles
- Focus states visibles
- ARIA labels donde sea necesario

---

## FASE 11: PROCESO DE CREACIÓN

### Para cada juego, seguir este orden:

1. **Crear HTML base** con estructura, estilos, canvas
2. **Implementar lógica del juego** (game loop, estado, colisiones)
3. **Añadir controles** (keyboard + touch)
4. **Añadir sonido** (sfx() con frecuencias apropiadas)
5. **Añadir partículas** (ParticleSystem para efectos)
6. **Añadir guardado** (saveProgress, saveBest)
7. **Añadir UI** (sidebar con puntos, nivel, mejor, controles)
8. **Probar** que funciona sin errores en consola
9. **Optimizar** que no haya memory leaks

### Patrón de cada juego:

```html
<!doctype html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>Nombre - Grizzy & the Lemmings</title>
  <style>
    /* Reset + body centrado + fondo #2d1b0e */
    /* Sidebar con stats */
    /* Canvas responsive */
    /* Touch controls */
  </style>
</head>
<body>
  <canvas id="leafCanvas"></canvas>
  <div class="game-wrapper">
    <div class="side">
      <!-- Puntos, Nivel, Mejor, Vidas -->
    </div>
    <canvas id="game"></canvas>
    <div class="side">
      <!-- Controles touch -->
    </div>
  </div>
  
  <script src="js/audio.js"></script>
  <script src="js/save.js"></script>
  <script src="js/canvas.js"></script>
  <script src="js/particles.js"></script>
  <script src="js/grizzy.js"></script>
  <script src="js/back.js"></script>
  <script>
    // === GAME CODE ===
    // 1. Constants & state
    // 2. Init function
    // 3. Game loop (requestAnimationFrame)
    // 4. Input handlers (keyboard + touch)
    // 5. Update logic
    // 6. Draw function
    // 7. Collision detection
    // 8. Save/load
    // 9. Sound effects
    // 10. Particles
  </script>
</body>
</html>
```

---

## FASE 12: PRIORIDADES

1. **Primero:** Los 13 juegos clásicos (son los más importantes)
2. **Segundo:** index.html funcional con grid
3. **Tercero:** Los 40 juegos custom
4. **Cuarto:** MENTIS
5. **Quinto:** Tests
6. **Sexto:** Sistema de verificación exhaustiva

---

## NOTAS FINALES

- Cada juego DEBE ser completamente funcional y jugable
- NO usar frameworks externos, solo vanilla JS + Canvas API
- TODOS los juegos deben tener controles táctiles para móvil
- TODOS los juegos deben guardar progreso en localStorage
- TODOS los juegos deben tener sonido
- El diseño debe ser consistente en todos los juegos (paleta Grizzy)
- Los juegos pueden ser simples pero deben FUNCIOR
- No importa si tarda horas, lo importante es que queden bien hechos
- Si un juego es muy complejo,简化 la versión pero que funcione

> **IMPORTANTE:** Cada juego individual debe poder abrirse en un navegador y ser jugable sin dependencias externas. El index.html es solo el menú de navegación.
