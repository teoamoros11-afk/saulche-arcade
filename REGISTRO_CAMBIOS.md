# Registro de Cambios - Saulche Arcade

## Fecha: 15 Junio 2026

---

## 🐻 Juegos Corregidos

### 1. Donkey Kong (donkey.html)
- **Bug:** Jugador invisible por `ctx.scale(SCALE, SCALE)` duplicando escalado CSS
- **Fix:** Eliminado `ctx.save()`, `ctx.scale(SCALE, SCALE)` y `ctx.restore()` de `draw()`
- **Mapas temáticos añadidos:**
  - 🟢 El Bosque (Nv 1-10): tocones y troncos
  - 🟡 La Cabaña (Nv 11-20): plataformas de madera
  - 🔴 La Cueva (Nv 21-30): rocas, estalactitas, cristales
  - 🟣 El Árbol Gigante (Nv 31-40): ramas orgánicas, dosel
- **Transiciones de fade** al cruzar niveles de tier

### 2. King Kong (kingkong.html)
- **Bug:** Mismo bug de escalado que Donkey Kong
- **Fix:** Eliminado `ctx.scale(SCALE, SCALE)` de `draw()`
- **Verificación:** Jugador visible en posición correcta (test Playwright)

### 3. Flappy Grizzy (flappygrizzy.html)
- **Bug:** Mismo bug de escalado
- **Fix:** Eliminado `ctx.scale(SCALE, SCALE)` de `draw()`

### 4. Submarino Grizzy (submarino.html)
- **Problema:** Juego demasiado fácil + combo no se reseteaba al fallar
- **Cambios:**
  - Combo se resetea cuando un tiro sale del canvas sin impactar
  - Timer de combo con barra visual de decadencia (3 segundos)
  - Sistema de munición: 5 balas máximo, recarga automática (1 bala/0.5s)
  - Dificultad aumentada en todos los tiers:
    - Playa: velocidad 1.0→1.4, spawn +20%
    - Muelle: velocidad 1.6→2.2, spawn +25%
    - Acantilado: velocidad 2.3→3.0, spawn +30%
    - Tormenta: velocidad 3.2→4.0, spawn +35%
  - Invencibilidad reducida: 120→80 frames
  - Cooldown de disparo: 15→18 frames
  - Escalado por nivel: +0.08→+0.12 por nivel

### 5. Come Cocos (comecocos.html)
- **Bug:** Temblor y bloqueo de movimiento por sistema de movimiento continuo
- **Fix:** Reescrito completamente (~120 líneas JS, antes 1000+)
- **Sistema nuevo:** Grid-based movement (posición = entero × CELL)
- **Características:** Solo Grizzy + laberinto, sin decoración

---

## 🐻 Nuevas Correcciones (16 Junio 2026)

### 6. Flappy Grizzy - Bug de Generación de Tuberías
- **Bug:** Las tuberías podían aparecer fuera de los límites válidos de la pantalla
- **Causa:** Cuando `lastGapCenter` estaba cerca del borde inferior, `minCenter` podía ser mayor que `maxCenter`
- **Fix:** Añadido mecanismo de respaldo para restablecer el rango completo válido
- **Verificación:** Tests automatizados confirman que todas las posiciones están dentro de límites

### 7. Come Cocos - Bug de Colocación de Power Pellets
- **Bug:** Menos power pellets de los previstos (3 en lugar de 4)
- **Causa:** La lógica de inicialización excluía la posición inicial del jugador antes de colocar power pellets
- **Fix:** Modificada la lógica para colocar power pellets primero, luego rellenar con pellets normales
- **Verificación:** Tests automatizados confirman 4 power pellets correctamente colocados

### 8. Come Cocos - Sistema de Pellets Añadido
- **Características:**
  - Pellets normales (+10 puntos) llenan celdas vacías
  - Power pellets (+50 puntos) en 4 esquinas, cantidad disminuye por nivel (4→3→2→1)
  - Modo asustado: enemigos se azul durante 5 segundos al comer power pellet
  - Comer enemigos asustados: +200 puntos, reaparecen en centro después de 3s
  - Efecto de parpadeo en últimos 2 segundos del modo asustado
  - Progresión: limpiar todos los pellets → siguiente nivel
  - Condición de victoria: completar nivel 40

---

## 🧩 MENTIS (Puzzle Game) — 8 Bugs Críticos Corregidos

### Bugs Corregidos
1. **Pantalla negra** al abrir desde menú Saulche — eliminado `sw.js` que causaba conflicto
2. **Click no funcionaba** ("TOCA PARA COMENZAR" no respondía) — handlers corruptos
3. **COLORS undefined** — variable referenciada pero no declarada
4. **Eventos duplicados** — listeners se registraban múltiples veces
5. **Stats perfectFloor** — contaba pisos perfectos incorrectamente
6. **HUD XP_TABLE** — import faltante
7. **Canvas z-index** — cubierto por otros elementos
8. **Screen null** — pantalla principal no se inicializaba

### GitHub Pages
- Creado repo `saulche-arcade` (no se pudo push workflows por limitación OAuth)
- Activado GitHub Pages vía API (`gh api`)

### Menú Saulche
- Añadida sección MENTIS en `index.html` con estilo especial púrpura/dorado
- Actualizado conteo de juegos: 54→55

---

## 🔧 Análisis de Errores (7 bugs, 12 mejoras de estilo)

### Bugs Críticos Corregidos
1. **index.html** — Memory leak en `setInterval(createLeaf, 400)`
   - Límite de 50 hojas máximo
   - `clearInterval` en `beforeunload`
2. **snake.html** — Loop infinito en posición de lemmings
   - Añadido `break` después de reposicionar
   - Límite de 50 intentos máximo
3. **tetris.html** — `roundRect()` sin polyfill
   - Polyfill completo añadido antes del uso
4. **index.html** — `localStorage` sin validación null
   - Check `value !== null` antes de `parseInt`
   - Base 10 explícita
5. **tetris.html** — Variables globales sin inicializar
   - 13 variables inicializadas con valores por defecto
6. **index.html** — CSS `will-change: transform` en animación
7. **index.html** — Prefijo `background-clip: text` estándar añadido

---

## 📁 Archivos Modificados
- `index.html` — Memory leak fix, localStorage, CSS, menú MENTIS
- `snake.html` — Lemmings loop fix
- `tetris.html` — roundRect polyfill, variable init
- `donkey.html` — Escalado fix + mapas temáticos
- `kingkong.html` — Escalado fix
- `flappygrizzy.html` — Escalado fix
- `submarino.html` — Dificultad, combo, munición
- `comecocos.html` — Reescritura completa
- `mentis/index.html` — CSS fixes, z-index
- `mentis/js/app.js` — Handlers, eventos, COLORS
- `mentis/js/core/GameLoop.js` — Update/render getters
- `mentis/js/core/Store.js` — Nested update notifications
- `mentis/js/systems/Stats.js` — PerfectFloor counting
- `mentis/js/ui/HUD.js` — XP_TABLE import
- `mentis/css/layout.css` — z-index for canvas

---

## 🚀 Commits
1. `Fix King Kong: remove double-scaling that hid player off-canvas`
2. `Fix Flappy Grizzy: remove double-scaling that hid content off-canvas`
3. `Improve Submarino difficulty and fix combo system`
4. `Add ammo system to Submarino: max 5 bullets, auto-reload`
5. `Fix Comecocos jitter and movement freeze`
6. `Rewrite Comecocos from scratch: minimal maze + Grizzy only`
7. `Fix 7 bugs found in codebase analysis`
8. `Add roundRect polyfill and initialize global variables in tetris.html`
9. MENTIS: 8 critical bugs fixed (handlers, events, COLORS, stats, HUD, canvas)
10. MENTIS: Enabled GitHub Pages via API
11. Saulche menu: Added MENTIS section + updated game count to 55
