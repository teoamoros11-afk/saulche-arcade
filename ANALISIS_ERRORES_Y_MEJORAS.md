# 🐛 Análisis de Errores Lógicos y Mejoras de Estilo

## 📋 Resumen
- **7 Errores lógicos encontrados**
- **12 Problemas de estilo/optimización**
- **Prioritarios: 4**

---

## 🔴 ERRORES CRÍTICOS

### 1. **Snake.html - Toque diagonal inválido (Línea 797-798)**
**Ubicación:** `snake.html:797-798`

**Error:**
```javascript
if (dy > 0 && dir !== 'up') nextDir = 'down'      // ❌ Lógica invertida
else if (dy < 0 && dir !== 'down') nextDir = 'up'
```

**Problema:** La dirección está invertida. Si `dy > 0`, la pantalla se mueve HACIA ABAJO, lo que significa que el dedo se mueve HACIA ARRIBA, así que debería ir `up`.

**Corrección:**
```javascript
if (dy > 0 && dir !== 'up') nextDir = 'up'        // ✅ Correcto
else if (dy < 0 && dir !== 'down') nextDir = 'down'
```

---

### 2. **Tetris.html - Polyfill faltante (Línea 637)**
**Ubicación:** `tetris.html:637`

**Error:**
```javascript
c.roundRect(33, 48, 14, 12, 2)  // ❌ roundRect no existe en todos los navegadores
c.fill()
```

**Problema:** `roundRect()` es una característica reciente y no está soportada en navegadores antiguos. El código comenta sobre el polyfill pero no lo implementa.

**Corrección:**
```javascript
// Polyfill para roundRect
if (!CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r) {
    this.beginPath();
    this.moveTo(x + r, y);
    this.lineTo(x + w - r, y);
    this.quadraticCurveTo(x + w, y, x + w, y + r);
    this.lineTo(x + w, y + h - r);
    this.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    this.lineTo(x + r, y + h);
    this.quadraticCurveTo(x, y + h, x, y + h - r);
    this.lineTo(x, y + r);
    this.quadraticCurveTo(x, y, x + r, y);
    this.closePath();
  };
}
```

---

### 3. **Tetris.html - Variable global perdida (Línea 356, 537)**
**Ubicación:** `tetris.html:356`

**Error:**
```javascript
let grid, cur, curIdx, nxt, nxtIdx, px, py, score, level, lines, over, paused, loop, linesThis
```

Estas variables son globales pero no se inicializan hasta `newGame()`. Si accedes antes (unlikely pero posible en edge cases), causarán errores.

**Corrección:**
```javascript
let grid = null,
    cur = null,
    curIdx = 0,
    nxt = null,
    nxtIdx = 0,
    px = 0,
    py = 0,
    score = 0,
    level = 1,
    lines = 0,
    over = false,
    paused = false,
    loop = null,
    linesThis = 0
```

---

### 4. **Index.html - Race condition en localStorage (Línea 763-771)**
**Ubicación:** `index.html:763-771`

**Error:**
```javascript
function countCompleted() {
  let c = 0
  document.querySelectorAll('[data-save]').forEach(function (el) {
    try {
      var v = parseInt(localStorage.getItem(el.dataset.save))  // ❌ No valida null
      if (!isNaN(v) && v > 0) c++
    } catch (e) {}
  })
  document.getElementById('completedCount').textContent = c
}
```

**Problema:** `localStorage.getItem()` retorna `null` si la clave no existe. `parseInt(null)` retorna `NaN`, que pasa por `isNaN()` pero es ineficiente.

**Corrección:**
```javascript
function countCompleted() {
  let c = 0
  document.querySelectorAll('[data-save]').forEach(function (el) {
    try {
      const value = localStorage.getItem(el.dataset.save)
      if (value !== null) {
        const v = parseInt(value, 10)  // ✅ Base 10 explícito
        if (!isNaN(v) && v > 0) c++
      }
    } catch (e) {}
  })
  document.getElementById('completedCount').textContent = c
}
```

---

### 5. **Snake.html - Infinite recursión posible (Línea 356-361)**
**Ubicación:** `snake.html:356-361`

**Error:**
```javascript
for (const l of lemmings)
  for (const s of snake)
    if (s.x === l.x && s.y === l.y) {
      l.x = (l.x + 5) % COLS   // ❌ Si todas las posiciones están ocupadas, loop infinito
      l.y = (l.y + 5) % ROWS
    }
```

**Problema:** Si la cuadrícula está muy llena, el lemming nunca encuentra una posición libre.

**Corrección:**
```javascript
function isCellOccupied(x, y) {
  return snake.some(s => s.x === x && s.y === y) ||
         lemmings.some(l => l.x === x && l.y === y && l !== this)
}

for (let i = 0; i < lemmings.length; i++) {
  const l = lemmings[i]
  let attempts = 0
  while ((snake.some(s => s.x === l.x && s.y === l.y) ||
          lemmings.slice(0, i).some(ll => ll.x === l.x && ll.y === l.y)) && 
         attempts < 50) {
    l.x = (l.x + 5) % COLS
    l.y = (l.y + 5) % ROWS
    attempts++
  }
}
```

---

### 6. **Tetris.html - Garbage lines sin validación (Línea 456-462)**
**Ubicación:** `tetris.html:456-462`

**Error:**
```javascript
const g = getGarbageLines(level)
for (let i = 0; i < g && linesThis >= 5; i++) {
  grid.shift()  // ❌ Puede dejar el grid vacío o inválido
  grid.push(Array(COLS).fill(0))
```

**Problema:** Si se agrega basura muchas veces, las líneas pueden quedar inconsistentes.

**Corrección:**
```javascript
const g = getGarbageLines(level)
for (let i = 0; i < g && linesThis >= 5 && grid.length < ROWS; i++) {  // ✅ Validar tamaño
  grid.shift()
  grid.push(Array(COLS).fill(0))
  const hole = Math.floor(Math.random() * COLS)
  for (let c2 = 0; c2 < COLS; c2++)
    if (c2 !== hole) grid[ROWS - 1][c2] = getTier(level).colors[Math.floor(Math.random() * 7)]
}
```

---

### 7. **Index.html - Memory leak en setInterval (Línea 757)**
**Ubicación:** `index.html:757`

**Error:**
```javascript
setInterval(createLeaf, 400)  // ❌ Se ejecuta indefinidamente, nunca se cancela
```

**Problema:** Las hojas se crean en un bucle infinito sin control. Los elementos DOM se acumulan en memoria.

**Corrección:**
```javascript
const leafInterval = setInterval(createLeaf, 400)

// Limpiar cuando se cierren hojas
window.addEventListener('unload', () => clearInterval(leafInterval))

// Limitar el máximo de hojas
const MAX_LEAVES = 50
function createLeaf() {
  const leaves = document.querySelectorAll('.leaf')
  if (leaves.length >= MAX_LEAVES) {
    leaves[0].remove()
  }
  // resto del código...
}
```

---

## 🟡 PROBLEMAS DE ESTILO Y OPTIMIZACIÓN

### 8. **Nombres de variables poco claros**
**Archivos:** `snake.html`, `tetris.html`, `index.html`

| Variable | Problema | Mejora |
|----------|----------|--------|
| `r()` | Demasiado corta | `rnd()` o `random()` |
| `drP()` | Acrónimo opaco | `drawParticles()` |
| `drLeaves()` | Acrónimo opaco | `drawLeaves()` |
| `doF()` | Incomprensible | `doFlash()` o `triggerFlash()` |
| `svI()` | Incomprensible | `triggerSave()` |
| `c` | Demasiado genérica | `ctx` o `context` |

**Impacto:** Dificulta el mantenimiento del código.

---

### 9. **Manejo de errores inconsistente**
**Problema:** Algunos bloques de try-catch silencian todo:

```javascript
try {
  const a = getAudio()
  // ...
} catch (e) {}  // ❌ Silencia todos los errores
```

**Mejora:**
```javascript
try {
  const a = getAudio()
  // ...
} catch (e) {
  if (process.env.NODE_ENV === 'development') {
    console.warn('Audio initialization failed:', e)
  }
}
```

---

### 10. **Duplicación de código**
**Ubicación:** `snake.html:183-215` vs `tetris.html:233-252`

Ambos archivos implementan la misma lógica de síntesis de audio. Debería estar en `js/audio.js`.

---

### 11. **Magic numbers sin constantes**
**Ejemplos:**
- `snake.html:270`: `Math.max(10, Math.floor(size / COLS))`
- `tetris.html:337`: `if (lv <= 5) return 700`

**Mejora:**
```javascript
const CANVAS_MIN_CELL_SIZE = 10
const LEVEL_SPEED_TABLE = {
  '1-5': 700,
  '6-10': 500,
  '11-15': 380,
  // ...
}
```

---

### 12. **Estilo CSS inconsistente**
**Problemas en `index.html`:**

1. **Prefijos de navegador faltantes:**
```css
/* ❌ Incompleto */
-webkit-background-clip: text
-webkit-text-fill-color: transparent

/* ✅ Completo */
-webkit-background-clip: text
-webkit-text-fill-color: transparent
background-clip: text
```

2. **Valores mágicos en media queries:**
```css
/* ✅ Usar custom properties */
:root {
  --clamp-title: clamp(1.8rem, 5vmin, 3.5rem);
  --clamp-button: clamp(8px, 1.2vmin, 16px);
}

h1 {
  font-size: var(--clamp-title);
}
```

3. **Animaciones sin `will-change`:**
```css
/* ✅ Optimizar performance */
.grizzy-header {
  will-change: transform;
  animation: pulse 3s ease-in-out infinite;
}
```

---

## 📊 Matriz de Prioridades

| # | Error | Severidad | Impacto |
|---|-------|-----------|---------|
| 1 | Toque diagonal invertido | 🔴 Alta | Gameplay roto |
| 2 | roundRect falta | 🔴 Alta | Falla en navegadores antiguos |
| 3 | Variables no inicializadas | 🟡 Media | Posibles crashes |
| 4 | Race condition localStorage | 🟡 Media | Datos inconsistentes |
| 5 | Recursión infinita | 🔴 Alta | Hang del juego |
| 6 | Garbage lines | 🟡 Media | Estado del juego corrupto |
| 7 | Memory leak | 🟡 Media | Ralentización progresiva |
| 8-12 | Estilo/optimización | 🟢 Baja | Mantenibilidad |

---

## ✅ Checklist de Correcciones

- [ ] Corregir lógica de toque en snake.html
- [ ] Implementar polyfill de roundRect
- [ ] Inicializar variables globales
- [ ] Validar localStorage correctamente
- [ ] Agregar límite de iteraciones en lemmings
- [ ] Validar tamaño del grid en garbage lines
- [ ] Implementar límite de hojas en setInterval
- [ ] Renombrar variables cortas
- [ ] Mejorar manejo de errores
- [ ] Extraer audio a módulo compartido
- [ ] Usar constantes para magic numbers
- [ ] Completar prefijos CSS

