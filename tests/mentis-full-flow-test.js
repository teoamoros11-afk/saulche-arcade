const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 375, height: 667 },
    hasTouch: true,
    isMobile: true
  });
  const page = await context.newPage();
  
  const logs = [];
  page.on('console', msg => logs.push(`[${msg.type()}] ${msg.text()}`));
  page.on('pageerror', err => logs.push(`[PAGE_ERROR] ${err.message}`));
  
  await page.goto('https://teoamoros11-afk.github.io/saulche-arcade/mentis/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  
  // Check for service workers
  const swCheck = await page.evaluate(async () => {
    const regs = await navigator.serviceWorker.getRegistrations();
    return {
      registrationCount: regs.length,
      registrations: regs.map(r => ({
        scope: r.scope,
        active: r.active ? r.active.scriptURL : null,
        installing: r.installing ? r.installing.scriptURL : null,
        waiting: r.waiting ? r.waiting.scriptURL : null
      }))
    };
  });
  console.log('Service Worker check:', JSON.stringify(swCheck, null, 2));
  
  // Check if there are any JS errors preventing initialization
  const initCheck = await page.evaluate(() => {
    return {
      hasCanvas: !!document.getElementById('game-canvas'),
      canvasWidth: document.getElementById('game-canvas')?.width,
      canvasHeight: document.getElementById('game-canvas')?.height,
      hasApp: !!document.getElementById('app'),
      moduleScripts: document.querySelectorAll('script[type="module"]').length,
      scripts: document.querySelectorAll('script').length,
    };
  });
  console.log('Init check:', JSON.stringify(initCheck, null, 2));
  
  // Full E2E: touch title → menu → touch JUGAR → tower → touch puzzle area
  const canvas = await page.$('#game-canvas');
  const box = await canvas.boundingBox();
  
  // 1. Touch title
  await page.touchscreen.tap(box.x + box.width / 2, box.y + 300); // y=300 in canvas = "TOCA PARA COMENZAR"
  await page.waitForTimeout(500);
  let state = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('.screen.active')).map(s => s.className);
  });
  console.log('\n1. After title touch:', state);
  
  // 2. Touch JUGAR (y=200 in canvas)
  await page.touchscreen.tap(box.x + box.width / 2, box.y + 200);
  await page.waitForTimeout(500);
  state = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('.screen.active')).map(s => s.className);
  });
  console.log('2. After JUGAR touch:', state);
  
  // 3. Touch canvas center to load floor
  await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
  await page.waitForTimeout(500);
  state = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('.screen.active')).map(s => s.className);
  });
  console.log('3. After floor touch:', state);
  
  await page.screenshot({ path: '/home/teo/Projects/games/Saulche/tests/mentis-full-flow.png' });
  
  if (logs.length > 0) {
    console.log('\nConsole logs:');
    logs.forEach(l => console.log(l));
  }
  
  await browser.close();
})();
