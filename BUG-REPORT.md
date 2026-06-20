# Bug Report - Saulche Arcade Games

## Date: $(date)
## Author: Automated Codebase Diagnosis

## Summary

During a systematic codebase diagnosis, three significant bugs were identified and fixed:

1. **Flappy Grizzy Pipe Generation Bug** - Pipes could spawn outside valid screen boundaries
2. **Come Cocos Power Pellet Bug** - Fewer power pellets were placed than intended
3. **MENTIS Z-Index Bug** - Canvas was covering all app content, showing only dark blue screen

## Bug Details

### Bug 1: Flappy Grizzy Pipe Generation

**File:** `flappygrizzy.html`
**Function:** `addPipe()`
**Severity:** Medium (could cause unfair gameplay)

**Description:**
When the `lastGapCenter` variable was near the bottom of the screen, the pipe generation logic could produce invalid pipe positions. The `minCenter` value could become greater than `maxCenter`, resulting in negative range values that caused pipes to spawn outside the valid screen area.

**Root Cause:**
The pipe generation logic didn't properly handle edge cases where the previous pipe's gap center was too close to the screen boundaries.

**Reproduction:**
1. Play Flappy Grizzy until reaching a high level
2. When pipes spawn near the bottom of the screen
3. The next pipe could spawn with an invalid gap position

**Fix:**
Added a fallback mechanism to reset to the full valid range when `minCenter > maxCenter`:

```javascript
if (minCenter > maxCenter) {
  minCenter = minH + gap / 2
  maxCenter = maxH - gap / 2
}
```

**Testing:**
- Verified with automated tests
- All generated pipe positions now stay within valid bounds
- Tested with extreme edge cases (lastGapCenter at screen edges)

### Bug 2: Come Cocos Power Pellet Placement

**File:** `comecocos.html`
**Function:** `initPellets()`
**Severity:** Low (gameplay balance issue)

**Description:**
Power pellets were not being placed at the player's starting position (1,1) because the initialization logic excluded this position before placing power pellets. This resulted in fewer power pellets than intended, affecting game balance.

**Root Cause:**
The pellet initialization logic excluded the player's starting position before placing power pellets, causing the power pellet at (1,1) to be skipped.

**Reproduction:**
1. Start a new game of Come Cocos
2. Check the maze for power pellets
3. Only 3 power pellets would appear instead of 4

**Fix:**
Modified the initialization logic to place power pellets first, then fill empty cells with normal pellets:

```javascript
// First place power pellets
for (let i = 0; i < powerCount; i++) {
  const [pr, pc] = corners[i]
  if (map[pr] && map[pr][pc] === E) {
    pellets[pr][pc] = 2
    pelletCount++
  }
}

// Then fill empty cells with normal pellets
for (let r = 0; r < ROWS; r++) {
  for (let c = 0; c < COLS; c++) {
    if (map[r][c] === E && pellets[r][c] === 0 && !(c === 1 && r === 1)) {
      pellets[r][c] = 1
      pelletCount++
    }
  }
}
```

**Testing:**
- Verified with automated tests
- All 4 power pellets now appear correctly
- Normal pellet count remains accurate

### Bug 3: MENTIS Z-Index Issue

**File:** `mentis/css/layout.css`
**Severity:** High (game completely unplayable)

**Description:**
The MENTIS game was showing only a dark blue screen. The canvas element had a higher z-index than the app container, causing the canvas to cover all UI content.

**Root Cause:**
The CSS had incorrect z-index values:
- `#app` had `z-index: 1`
- `#game-canvas` had `z-index: 2`

The canvas was being filled with a dark gradient (`#0a0a1a` → `#1a0a2e`) in the `drawBackground()` function, which covered the entire screen.

**Reproduction:**
1. Open MENTIS from the game menu
2. Only a dark blue screen appears
3. No UI elements are visible

**Fix:**
Swapped the z-index values:
- `#app` now has `z-index: 10`
- `#game-canvas` now has `z-index: 1`

**Testing:**
- Verified the fix by opening MENTIS
- UI content now renders on top of the canvas
- Game is now playable

## Additional Observations

### Code Quality Issues

1. **Missing Semicolons:** Several files have missing semicolons after return statements
2. **Potential Null References:** Many files access properties on potentially null objects
3. **Magic Numbers:** Some files use hardcoded magic numbers in conditions

### Recommendations

1. **Add Input Validation:** Validate all user inputs and game parameters
2. **Add Bounds Checking:** Ensure all canvas operations stay within bounds
3. **Clean Up Timers:** Ensure all setTimeout/setInterval calls are properly cleaned up
4. **Add Error Handling:** Add try-catch blocks for localStorage operations
5. **Use Constants:** Replace magic numbers with named constants

## Files Modified

- `flappygrizzy.html` - Fixed pipe generation logic
- `comecocos.html` - Fixed power pellet placement logic
- `mentis/css/layout.css` - Fixed z-index layering issue

## Testing

Both fixes were verified with:
1. Automated test scripts
2. Edge case testing
3. Manual verification

## Conclusion

Two significant bugs were identified and fixed during the codebase diagnosis. The fixes improve game fairness and balance. Additional code quality improvements are recommended for future updates.