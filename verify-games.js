/**
 * Grizzy's Arcade — Game Verification Framework
 * 
 * Scans every game HTML file and reports structural fingerprints:
 *   - gameState values and transitions
 *   - Score/level variable patterns
 *   - localStorage save keys
 *   - Input handler registrations
 *   - Restart/reset function definitions
 *   - AI/opponent presence
 *   - Canvas usage (ID or dynamic)
 *   - Shared script imports
 *   - Game-over / win condition logic
 */

const fs = require('fs');
const path = require('path');

const GAMES_DIR = '/home/teo/Projects/games/Saulche';
const JS_DIR = path.join(GAMES_DIR, 'js');

// --------------- Helpers ---------------

function readFile(p) {
  try {
    return fs.readFileSync(p, 'utf-8');
  } catch { return null; }
}

// Regex-based pattern matchers
const patterns = {
  // Script tags referencing shared libs
  sharedScripts: /<script\s+src="js\/(audio|save|canvas|particles|grizzy|back)\.js"><\/script>/g,

  // gameState assignments
  gameStates: /gameState\s*=\s*['"](\w+)['"]/g,

  // gameState comparisons
  gameStateChecks: /gameState\s*(?:===|==)\s*['"](\w+)['"]/g,

  // Specific well-known variable names
  hasScore: /\b(?:score|best)\b/,
  hasLevel: /\blevel\b/,
  hasLives: /\blives\b/,
  hasTimer: /\btimeLeft\b|\btimer\b/,
  hasRound: /\b(?:round|turn)\b/,
  hasDifficulty: /\bdifficulty\b/,

  // localStorage save/load calls
  saveCalls: /(?:saveBest|saveProgress|saveJSON|localStorage\.setItem)\s*\(\s*['"]([^'"]+)['"]/g,
  loadCalls: /(?:loadBest|loadProgress|loadJSON|localStorage\.getItem)\s*\(\s*['"]([^'"]+)['"]/g,

  // Function definitions: restart/reset
  restartFunc: /(?:function\s+(?:restartGame|resetGame|restart)\s*\(|(?:restartGame|resetGame|restart)\s*=\s*function)/,

  // Input handlers
  keyHandler: /(?:addEventListener|onkeydown|onkeyup)\s*\(?\s*['"]key(?:down|up|press)?['"]/,
  clickHandler: /(?:addEventListener|onclick|onmousedown)\s*\(?\s*['"]click['"]/,
  touchHandler: /(?:addEventListener|ontouchstart)\s*\(?\s*['"]touchstart['"]/,
  mouseMoveHandler: /(?:addEventListener|onmousemove)\s*\(?\s*['"]mousemove['"]/,
  swipeHandler: /touch(?:start|move|end)/,

  // AI presence
  aiFunc: /\b(?:ai|AI|computerMove|enemyAI|ghostAI|barrelAI|aiPaddle|aiMove|makeMove)\s*(?:\(|\s*=\s*function)/i,
  aiComment: /\/\/.*\b(?:AI|computer|enemy|opponent|bot)\b/i,

  // Canvas usage
  canvasGetContext: /getContext\s*\(\s*['"]2d['"]\s*\)/,
  canvasCreate: /document\.createElement\s*\(\s*['"]canvas['"]\s*\)/,
  canvasTag: /<canvas\s/,

  // Game over / win conditions
  gameOverCond: /gameState\s*=\s*['"]over['"]/,
  winCond: /gameState\s*=\s*['"]win['"]/,

  // requestAnimationFrame game loop
  hasRAF: /\brequestAnimationFrame\b/,
  hasSetInterval: /\bsetInterval\b/,

  // Particles usage
  particlesUsage: /\b(?:ParticleSystem|createLeaves)\s*\(/,

  // drawGrizzy usage
  drawGrizzyCall: /\bdrawGrizzy\s*\(/,

  // DOM overlays
  domOverlay: /(?:\.overlay|#(?:menu|gameOver|winScreen|ui))\b/i,
};

// --------------- Analyzer ---------------

function analyzeHTML(filePath, content) {
  const report = {
    file: path.relative(GAMES_DIR, filePath),
    basename: path.basename(filePath),
    valid: true,
    errors: [],
    warnings: [],
    patterns: {},
  };

  // 1. Shared scripts check
  const scripts = [...content.matchAll(patterns.sharedScripts)].map(m => m[1]);
  const expected = ['audio', 'save', 'canvas', 'particles', 'grizzy', 'back'];
  const missing = expected.filter(s => !scripts.includes(s));
  if (missing.length) {
    report.warnings.push('Missing shared scripts: ' + missing.join(', '));
  }
  report.patterns.sharedScripts = scripts;

  // 2. gameState values
  const states = new Set();
  for (const m of content.matchAll(patterns.gameStates)) states.add(m[1]);
  for (const m of content.matchAll(patterns.gameStateChecks)) states.add(m[1]);
  
  if (states.size === 0) {
    report.errors.push('No gameState values detected');
    report.valid = false;
  }
  report.patterns.gameStates = [...states];

  // 3. Well-known variables
  report.patterns.hasScore = patterns.hasScore.test(content);
  report.patterns.hasLevel = patterns.hasLevel.test(content);
  report.patterns.hasLives = patterns.hasLives.test(content);
  report.patterns.hasTimer = patterns.hasTimer.test(content);
  report.patterns.hasRound = patterns.hasRound.test(content);
  report.patterns.hasDifficulty = patterns.hasDifficulty.test(content);

  // 4. Save keys used
  const saveKeys = new Set();
  for (const m of content.matchAll(patterns.saveCalls)) saveKeys.add(m[1]);
  for (const m of content.matchAll(patterns.loadCalls)) saveKeys.add(m[1]);
  report.patterns.saveKeys = [...saveKeys];

  // 5. Restart function
  report.patterns.hasRestartFunc = patterns.restartFunc.test(content);

  // 6. Input handlers
  report.patterns.input = {
    keyboard: patterns.keyHandler.test(content),
    click: patterns.clickHandler.test(content),
    touch: patterns.touchHandler.test(content),
    mouseMove: patterns.mouseMoveHandler.test(content),
    swipe: patterns.swipeHandler.test(content),
  };

  // 7. AI presence
  report.patterns.hasAI = patterns.aiFunc.test(content) || patterns.aiComment.test(content);

  // 8. Canvas usage
  report.patterns.canvas = {
    hasCanvasTag: patterns.canvasTag.test(content),
    usesGetContext: patterns.canvasGetContext.test(content),
    createsDynamically: patterns.canvasCreate.test(content),
  };
  // Extract canvas ID
  const canvasIdMatch = content.match(/<canvas\s+[^>]*id\s*=\s*['"](\w+)['"]/);
  report.patterns.canvas.id = canvasIdMatch ? canvasIdMatch[1] : null;

  // 9. Game over / win conditions
  report.patterns.hasGameOver = patterns.gameOverCond.test(content);
  report.patterns.hasWin = patterns.winCond.test(content);

  // 10. Game loop
  report.patterns.gameLoop = {
    requestAnimationFrame: patterns.hasRAF.test(content),
    setInterval: patterns.hasSetInterval.test(content),
  };

  // 11. Shared feature usage
  report.patterns.usesParticles = patterns.particlesUsage.test(content);
  report.patterns.usesDrawGrizzy = patterns.drawGrizzyCall.test(content);
  report.patterns.hasDomOverlay = patterns.domOverlay.test(content);

  if (!report.patterns.hasRestartFunc) {
    report.warnings.push('No explicit restart/reset function found');
  }
  if (report.patterns.saveKeys.length === 0) {
    report.warnings.push('No localStorage save keys detected');
  }

  return report;
}

// --------------- Main ---------------

function main() {
  const files = fs.readdirSync(GAMES_DIR)
    .filter(f => f.endsWith('.html'))
    .filter(f => f !== 'index.html')
    .sort()
    .map(f => path.join(GAMES_DIR, f));

  console.log('='.repeat(90));
  console.log('  GRIZZY\'S ARCADE - GAME VERIFICATION FRAMEWORK');
  console.log('  ' + files.length + ' game files found');
  console.log('='.repeat(90));

  const allReports = [];

  for (const filePath of files) {
    const content = readFile(filePath);
    if (!content) {
      console.error('  [SKIP] Could not read ' + path.basename(filePath));
      continue;
    }
    const report = analyzeHTML(filePath, content);
    allReports.push(report);

    const status = report.valid ? 'OK' : 'FAIL';
    const states = report.patterns.gameStates.join('|');
    const saveKeys = report.patterns.saveKeys.join(', ') || '(none)';
    const ai = report.patterns.hasAI ? 'AI' : '';
    const canvas = report.patterns.canvas.id || (report.patterns.canvas.createsDynamically ? 'dynamic' : report.patterns.canvas.hasCanvasTag ? 'canvas' : 'none');
    const restart = report.patterns.hasRestartFunc ? 'R' : 'r';
    const win = report.patterns.hasWin ? 'W' : '';
    const go = report.patterns.hasGameOver ? 'GO' : '';
    const input = Object.entries(report.patterns.input)
      .filter(function(e) { return e[1]; }).map(function(e) { return e[0][0]; }).join('');

    console.log(
      '  [' + status + '] ' +
      report.basename.padEnd(25) +
      ' states:[' + states + ']' +
      ' save:[' + saveKeys + ']' +
      ' input:' + input.padEnd(5) +
      ' canvas:' + String(canvas).padEnd(10) +
      ' ai:' + ai.padEnd(3) +
      ' ' + restart + go + win
    );

    if (report.errors.length) {
      console.log('         ERRORS: ' + report.errors.join('; '));
    }
    if (report.warnings.length) {
      console.log('         WARN:   ' + report.warnings.join('; '));
    }
  }

  // --------------- Summary Stats ---------------
  console.log('\n' + '='.repeat(90));
  console.log('  AGGREGATE STATISTICS');
  console.log('='.repeat(90));

  var counts = {
    total: allReports.length,
    withAI: allReports.filter(function(r) { return r.patterns.hasAI; }).length,
    withCanvas: allReports.filter(function(r) { return r.patterns.canvas.usesGetContext; }).length,
    withDOMonly: allReports.filter(function(r) { return !r.patterns.canvas.usesGetContext; }).length,
    withRestart: allReports.filter(function(r) { return r.patterns.hasRestartFunc; }).length,
    withGameOver: allReports.filter(function(r) { return r.patterns.hasGameOver; }).length,
    withWin: allReports.filter(function(r) { return r.patterns.hasWin; }).length,
    withParticles: allReports.filter(function(r) { return r.patterns.usesParticles; }).length,
    withDrawGrizzy: allReports.filter(function(r) { return r.patterns.usesDrawGrizzy; }).length,
    withRAF: allReports.filter(function(r) { return r.patterns.gameLoop.requestAnimationFrame; }).length,
    withInterval: allReports.filter(function(r) { return r.patterns.gameLoop.setInterval; }).length,
    withDomOverlay: allReports.filter(function(r) { return r.patterns.hasDomOverlay; }).length,
    withScore: allReports.filter(function(r) { return r.patterns.hasScore; }).length,
    withLevel: allReports.filter(function(r) { return r.patterns.hasLevel; }).length,
    withLives: allReports.filter(function(r) { return r.patterns.hasLives; }).length,
    withTimer: allReports.filter(function(r) { return r.patterns.hasTimer; }).length,
    withDifficulty: allReports.filter(function(r) { return r.patterns.hasDifficulty; }).length,
    withRound: allReports.filter(function(r) { return r.patterns.hasRound; }).length,
  };

  console.log('  Total games analyzed:           ' + counts.total);
  console.log('  Canvas-based:                   ' + counts.withCanvas);
  console.log('  DOM-only:                       ' + counts.withDOMonly);
  console.log('  Has AI:                         ' + counts.withAI);
  console.log('  Has restart function:           ' + counts.withRestart);
  console.log('  Has game-over condition:        ' + counts.withGameOver);
  console.log('  Has win condition:              ' + counts.withWin);
  console.log('  Uses particles:                 ' + counts.withParticles);
  console.log('  Uses drawGrizzy:                ' + counts.withDrawGrizzy);
  console.log('  Uses requestAnimationFrame:     ' + counts.withRAF);
  console.log('  Uses setInterval:               ' + counts.withInterval);
  console.log('  Has DOM overlay elements:       ' + counts.withDomOverlay);
  console.log('  Has score variable:             ' + counts.withScore);
  console.log('  Has level variable:             ' + counts.withLevel);
  console.log('  Has lives variable:             ' + counts.withLives);
  console.log('  Has timer variable:             ' + counts.withTimer);
  console.log('  Has difficulty variable:        ' + counts.withDifficulty);
  console.log('  Has round/turn variable:        ' + counts.withRound);

  // --------------- Save Key Inventory ---------------
  console.log('\n' + '='.repeat(90));
  console.log('  LOCALSTORAGE SAVE KEY INVENTORY');
  console.log('='.repeat(90));

  var saveKeyMap = {};
  for (var i = 0; i < allReports.length; i++) {
    var r = allReports[i];
    for (var j = 0; j < r.patterns.saveKeys.length; j++) {
      var key = r.patterns.saveKeys[j];
      if (!saveKeyMap[key]) saveKeyMap[key] = [];
      saveKeyMap[key].push(r.basename);
    }
  }

  var keysSorted = Object.keys(saveKeyMap).sort();
  console.log('  Game-specific keys:');
  for (var i = 0; i < keysSorted.length; i++) {
    var key = keysSorted[i];
    console.log('    "' + key + '" -> ' + saveKeyMap[key].join(', '));
  }

  // --------------- Missing Scripts Summary ---------------
  console.log('\n' + '='.repeat(90));
  console.log('  SHARED SCRIPT INCLUSION');
  console.log('='.repeat(90));

  var scriptCounts = { audio: 0, save: 0, canvas: 0, particles: 0, grizzy: 0, back: 0 };
  for (var i = 0; i < allReports.length; i++) {
    var r = allReports[i];
    for (var j = 0; j < r.patterns.sharedScripts.length; j++) {
      var s = r.patterns.sharedScripts[j];
      if (scriptCounts[s] !== undefined) scriptCounts[s]++;
    }
  }
  var scriptKeys = Object.keys(scriptCounts);
  for (var i = 0; i < scriptKeys.length; i++) {
    var script = scriptKeys[i];
    var count = scriptCounts[script];
    var pct = (count / counts.total * 100).toFixed(1);
    console.log('    js/' + script + '.js:  ' + String(count).padStart(2) + '/' + counts.total + ' (' + pct + '%)');
  }

  // --------------- Specific Anomalies ---------------
  console.log('\n' + '='.repeat(90));
  console.log('  ANOMALIES & NOTABLE FINDINGS');
  console.log('='.repeat(90));

  for (var i = 0; i < allReports.length; i++) {
    var r = allReports[i];
    var notes = [];

    if (r.patterns.saveKeys.includes('grizzy_best')) {
      notes.push('Uses GENERIC save key (grizzy_best) - possible score collision');
    }

    if (!r.patterns.hasRestartFunc) {
      notes.push('No restart function - may use inline reset');
    }

    if (!r.patterns.hasGameOver && !r.patterns.hasWin) {
      notes.push('No explicit game-over OR win state detected');
    }

    if (r.patterns.sharedScripts.length < 6) {
      notes.push('Only includes ' + r.patterns.sharedScripts.length + '/6 shared scripts');
    }

    if (notes.length) {
      console.log('  ' + r.basename + ':');
      for (var j = 0; j < notes.length; j++) {
        console.log('    - ' + notes[j]);
      }
    }
  }

  console.log('\n' + '='.repeat(90));
  console.log('  VERIFICATION COMPLETE');
  console.log('='.repeat(90));
}

main();
