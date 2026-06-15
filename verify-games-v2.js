/**
 * Grizzy's Arcade — Game Verification Framework v2
 * 
 * Comprehensively detects the diverse structural patterns found across 53 games.
 */

const fs = require('fs');
const path = require('path');

const GAMES_DIR = '/home/teo/Projects/games/Saulche';

function readFile(p) {
  try { return fs.readFileSync(p, 'utf-8'); } catch { return null; }
}

// ---- Comprehensive Pattern Detection ----

function analyze(html, basename) {
  const r = {
    file: basename,
    valid: true, errors: [], warnings: [],
    patterns: {}
  };

  // 1. Shared scripts
  const scripts = [...html.matchAll(/<script\s+src="js\/(audio|save|canvas|particles|grizzy|back)\.js"><\/script>/g)].map(m => m[1]);
  r.patterns.sharedScripts = scripts;
  if (scripts.length < 6) r.warnings.push('Missing shared scripts: ' + ['audio','save','canvas','particles','grizzy','back'].filter(s => !scripts.includes(s)).join(','));

  // 2. STATE MANAGEMENT — detect ANY state-like variable approach
  const statePatterns = [];

  // Pattern A: String-based state variable (gameState, state, estado, gameStatus, etc.)
  const stateVarMatch = html.match(/(?:let|var|const)\s+(gameState|game_state|gameStatus|game_stage|gamePhase|state|estado)\s*[=:]/);
  if (stateVarMatch) statePatterns.push('string:' + stateVarMatch[1]);

  // Pattern A2: Direct assignments to state-typed vars even without declaration in same file
  const stateAssigns = [...html.matchAll(/(?:^|[^$\w])(gameState|game_state|state|estado|gameStatus)\s*=\s*['"](\w+)['"]/g)];
  if (stateAssigns.length) {
    statePatterns.push('string-state-assigns:' + [...new Set(stateAssigns.map(m => m[2]))].join('|'));
  }

  // Pattern B: Boolean-based (over, win, gameActive, playing, gameOver)
  const boolOver = /\bover\s*=\s*(?:true|false)\b/.test(html);
  const boolWin = /\bwin\s*=\s*(?:true|false)\b/.test(html);
  const boolGameActive = /\bgameActive\s*=\s*(?:true|false)\b/.test(html);
  const boolPlaying = /\bplaying\s*=\s*(?:true|false)\b/.test(html);
  const boolGameOver = /\bgameOver\s*=\s*(?:true|false)\b/.test(html);
  const boolState = /\bstate\s*=\s*(?:true|false)\b/.test(html);

  if (boolOver || boolWin || boolGameActive || boolPlaying || boolGameOver || boolState) {
    const parts = [];
    if (boolOver) parts.push('over'); if (boolWin) parts.push('win');
    if (boolGameActive) parts.push('gameActive'); if (boolPlaying) parts.push('playing');
    if (boolGameOver) parts.push('gameOver'); if (boolState) parts.push('state');
    statePatterns.push('booleans:' + parts.join('|'));
  }

  // Pattern C: Display-based (DOM visibility toggles)
  const displayNone = /\bdisplay\s*=\s*['"]none['"]/.test(html);
  const dispBlock = /\bdisplay\s*=\s*['"]block['"]/.test(html);
  if (displayNone || dispBlock) statePatterns.push('dom-display');

  // Also check for game-over text or overlays as state indicator
  const hasGameOverText = /game\s*over/i.test(html);
  const hasYouWinText = /(you\s*win|ganaste|completaste)/i.test(html);

  if (statePatterns.length === 0) {
    // Heuristic: if game-over text displayed, it likely has some state
    if (hasGameOverText || hasYouWinText) {
      statePatterns.push('heuristic-over/win-text');
    } else {
      r.warnings.push('No state management pattern detected');
    }
  }
  r.patterns.statePattern = statePatterns;

  // 3. Well-known variables (relaxed detection)
  const jsContent = html;
  r.patterns.hasScore = /\b(?:score|best|puntuacion|puntos)\b/i.test(jsContent);
  r.patterns.hasLevel = /\blevel\b|\bnivel\b/i.test(jsContent);
  r.patterns.hasLives = /\blives?\b|\bvi?das?\b/i.test(jsContent);
  r.patterns.hasTimer = /\b(?:timeLeft|timer|cronometro|segundos|countdown|tiempo)\b/i.test(jsContent);
  r.patterns.hasRound = /\b(?:round|turn|ronda)\b/i.test(jsContent);
  r.patterns.hasDifficulty = /\bdifficult(y|ad)\b/i.test(jsContent);
  r.patterns.hasProgress = /\bprogress\b|\bprogreso\b/i.test(jsContent);

  // 4. Save keys — detect ALL localStorage access patterns
  const saveKeys = new Set();

  // Shared lib calls
  for (const m of html.matchAll(/(?:saveBest|loadBest|saveProgress|loadProgress|saveJSON|loadJSON)\s*\(\s*['"]([^'"]+)['"]/g)) saveKeys.add(m[1]);
  // Direct localStorage.setItem/getItem
  for (const m of html.matchAll(/localStorage\.(?:setItem|getItem)\s*\(\s*['"]([^'"]+)['"]/g)) saveKeys.add(m[1]);
  // Key stored as constant
  const constKeys = [...html.matchAll(/(?:const|let|var)\s+(?:SAVE_KEY|STORAGE_KEY|BEST_KEY|saveKey|storageKey)\s*=\s*['"]([^'"]+)['"]/g)];
  for (const m of constKeys) saveKeys.add(m[1]);

  r.patterns.saveKeys = [...saveKeys];
  r.patterns.saveKeyConst = constKeys.length > 0;

  // 5. Restart/reset detection — broader patterns
  const restartFuncs = [
    /function\s+(?:restartGame|resetGame|restart|reset|init|newGame|startGame)\s*\(/,
    /(?:restartGame|resetGame|restart|reset|init|newGame|startGame)\s*=\s*function/,
    /(?:restartGame|resetGame|restart|reset|init|newGame|startGame)\s*=\s*\(?\s*(?:\)?\s*=>|\{)/,
  ];
  r.patterns.hasRestartFunc = restartFuncs.some(re => re.test(html));

  // Also detect inline restart via button click
  r.patterns.hasRestartButton = /id\s*=\s*['"]restartBtn['"]/.test(html) || /Reiniciar/.test(html);

  // 6. Game-over and win detection
  const goPatterns = [
    /gameState\s*=\s*['"]over['"]/,
    /state\s*=\s*['"]over['"]/,
    /over\s*=\s*true/,
    /gameOver\s*=\s*true/,
    /gameActive\s*=\s*false/,
    /estado\s*=\s*['"]gameover['"]/,
  ];
  r.patterns.hasGameOver = goPatterns.some(re => re.test(html)) || hasGameOverText;

  const winPatterns = [
    /gameState\s*=\s*['"]win['"]/,
    /state\s*=\s*['"]win['"]/,
    /win\s*=\s*true/,
    /estado\s*=\s*['"]win['"]/,
  ];
  r.patterns.hasWin = winPatterns.some(re => re.test(html)) || hasYouWinText;

  // 7. Input handlers (relaxed)
  r.patterns.input = {
    keyboard:  /addEventListener\s*\(\s*['"]key(?:down|up|press)['"]/.test(html) || /onkeydown\b/.test(html),
    click:     /addEventListener\s*\(\s*['"]click['"]/.test(html) || /onclick\b/.test(html),
    touch:     /addEventListener\s*\(\s*['"]touchstart['"]/.test(html) || /ontouchstart\b/.test(html),
    mouseMove: /addEventListener\s*\(\s*['"]mousemove['"]/.test(html) || /onmousemove\b/.test(html),
    swipe:     /touch(?:start|move|end)/.test(html),
  };

  // 8. AI presence
  r.patterns.hasAI = /\b(?:AI|ai|computerMove|enemyAI|ghostAI|barrelAI|aiPaddle|makeMove|enemy)\s*(?:\(|\s*=\s*function)/i.test(html);

  // 9. Canvas usage
  r.patterns.canvas = {
    hasTag:       /<canvas\s/i.test(html),
    usesContext:  /getContext\s*\(\s*['"]2d['"]\s*\)/.test(html),
    dynamic:      /document\.createElement\s*\(\s*['"]canvas['"]/.test(html),
  };
  const cid = html.match(/<canvas\s+[^>]*id\s*=\s*['"](\w+)['"]/);
  r.patterns.canvas.id = cid ? cid[1] : null;
  r.patterns.canvas.type = r.patterns.canvas.dynamic ? 'dynamic' : (r.patterns.canvas.id || (r.patterns.canvas.hasTag ? 'unnamed' : 'none'));

  // 10. Game loop
  r.patterns.gameLoop = {
    raf:  /\brequestAnimationFrame\b/.test(html),
    interval: /\bsetInterval\b/.test(html),
  };

  // 11. Shared feature usage
  r.patterns.usesParticles   = /\b(?:ParticleSystem|createLeaves|spawnParticles)\s*\(/.test(html);
  r.patterns.usesDrawGrizzy  = /\bdrawGrizzy\s*\(/.test(html);
  r.patterns.hasDomOverlay   = /(?:\.overlay|#(?:menu|gameOver|winScreen|ui|container|hud))\b/i.test(html);

  return r;
}

// ---- Main ----

function main() {
  const files = fs.readdirSync(GAMES_DIR)
    .filter(f => f.endsWith('.html') && f !== 'index.html')
    .sort()
    .map(f => path.join(GAMES_DIR, f));

  console.log('='.repeat(100));
  console.log('  GRIZZY\'S ARCADE — GAME VERIFICATION FRAMEWORK v2');
  console.log('  Comprehensive structural pattern analysis of ' + files.length + ' games');
  console.log('='.repeat(100));

  const all = [];

  for (const fp of files) {
    const html = readFile(fp);
    if (!html) { console.log('  [SKIP] ' + path.basename(fp)); continue; }
    const r = analyze(html, path.basename(fp));
    all.push(r);

    const state = r.patterns.statePattern.join('; ') || '(none)';
    const save = r.patterns.saveKeys.join(', ') || '-';
    const input = Object.entries(r.patterns.input).filter(function(e){return e[1]}).map(function(e){var k=e[0];if(k==="keyboard")return"K";if(k==="click")return"C";if(k==="mouseMove")return"M";if(k==="touch")return"T";if(k==="swipe")return"S";return k[0]}).join("");
    const canvas = r.patterns.canvas.type;
    const ai = r.patterns.hasAI ? 'AI' : '';
    const restart = r.patterns.hasRestartFunc ? 'R' : (r.patterns.hasRestartButton ? 'rBtn' : 'r');
    const go = r.patterns.hasGameOver ? 'GO' : '';
    const win = r.patterns.hasWin ? 'WIN' : '';
    const valid = r.errors.length === 0;

    console.log(
      '  [' + (valid ? 'OK' : '!!') + '] ' +
      r.file.padEnd(28) +
      ' state:' + state.padEnd(30) +
      ' save:[' + save + ']'
    );
    if (r.errors.length) console.log('         ERR: ' + r.errors.join('; '));
    if (r.warnings.length) console.log('         WARN: ' + r.warnings.join('; '));
  }

  // ---- Summary ----
  console.log('\n' + '='.repeat(100));
  console.log('  AGGREGATE STATISTICS');
  console.log('='.repeat(100));

  const c = {
    total: all.length,
    stringState: all.filter(r => r.patterns.statePattern.some(s => s.startsWith('string'))).length,
    boolState: all.filter(r => r.patterns.statePattern.some(s => s.startsWith('booleans'))).length,
    heurState: all.filter(r => r.patterns.statePattern.some(s => s.startsWith('heuristic'))).length,
    withAI: all.filter(r => r.patterns.hasAI).length,
    canvas: all.filter(r => r.patterns.canvas.usesContext).length,
    domOnly: all.filter(r => !r.patterns.canvas.usesContext).length,
    restart: all.filter(r => r.patterns.hasRestartFunc).length,
    restartBtn: all.filter(r => r.patterns.hasRestartButton).length,
    gameOver: all.filter(r => r.patterns.hasGameOver).length,
    win: all.filter(r => r.patterns.hasWin).length,
    particles: all.filter(r => r.patterns.usesParticles).length,
    drawGrizzy: all.filter(r => r.patterns.usesDrawGrizzy).length,
    raf: all.filter(r => r.patterns.gameLoop.raf).length,
    interval: all.filter(r => r.patterns.gameLoop.interval).length,
    domOverlay: all.filter(r => r.patterns.hasDomOverlay).length,
    score: all.filter(r => r.patterns.hasScore).length,
    level: all.filter(r => r.patterns.hasLevel).length,
    lives: all.filter(r => r.patterns.hasLives).length,
    timer: all.filter(r => r.patterns.hasTimer).length,
    difficulty: all.filter(r => r.patterns.hasDifficulty).length,
    saveKeys: all.filter(r => r.patterns.saveKeys.length > 0).length,
    saveKeyConst: all.filter(r => r.patterns.saveKeyConst).length,
  };

  console.log('  Total analyzed:               ' + c.total);
  console.log('  String-based state machine:    ' + c.stringState);
  console.log('  Boolean-based state:           ' + c.boolState);
  console.log('  Heuristic/undetected:          ' + c.heurState);
  console.log('  Canvas-based:                  ' + c.canvas);
  console.log('  DOM-only:                      ' + c.domOnly);
  console.log('  Has AI:                        ' + c.withAI);
  console.log('  Has restart function:          ' + c.restart + ' (+ button: ' + c.restartBtn + ')');
  console.log('  Has game-over:                 ' + c.gameOver);
  console.log('  Has win:                       ' + c.win);
  console.log('  Uses particles:                ' + c.particles);
  console.log('  Uses drawGrizzy:               ' + c.drawGrizzy);
  console.log('  requestAnimationFrame:         ' + c.raf);
  console.log('  setInterval:                   ' + c.interval);
  console.log('  DOM overlay elements:          ' + c.domOverlay);
  console.log('  Has save key:                  ' + c.saveKeys + ' (const: ' + c.saveKeyConst + ')');

  // ---- Save Key Inventory ----
  console.log('\n' + '='.repeat(100));
  console.log('  SAVE KEY INVENTORY');
  console.log('='.repeat(100));
  const keyMap = {};
  for (const r of all) {
    for (const k of r.patterns.saveKeys) {
      if (!keyMap[k]) keyMap[k] = [];
      keyMap[k].push(r.file);
    }
  }
  for (const k of Object.keys(keyMap).sort()) {
    console.log('  "' + k + '" -> ' + keyMap[k].join(', '));
  }

  // ---- Anomalies ----
  console.log('\n' + '='.repeat(100));
  console.log('  ANOMALIES');
  console.log('='.repeat(100));
  for (const r of all) {
    const notes = [];
    if (!r.patterns.hasGameOver && !r.patterns.hasWin) notes.push('No game-over/win detected');
    if (!r.patterns.hasRestartFunc && !r.patterns.hasRestartButton) notes.push('No restart mechanism');
    if (r.patterns.saveKeys.length === 0) notes.push('No save key');
    if (r.patterns.statePattern.some(s => s.startsWith('heuristic'))) notes.push('Uncertain state mgmt');
    if (r.patterns.drawGrizzy && !r.patterns.canvas.usesContext) notes.push('drawGrizzy without canvas context');
    if (!r.patterns.input.keyboard && !r.patterns.input.click && !r.patterns.input.touch) notes.push('No input handlers');
    if (notes.length) {
      console.log('  ' + r.file + ':');
      notes.forEach(n => console.log('    - ' + n));
    }
  }

  console.log('\n' + '='.repeat(100));
  console.log('  VERIFICATION COMPLETE');
  console.log('='.repeat(100));
}

main();
