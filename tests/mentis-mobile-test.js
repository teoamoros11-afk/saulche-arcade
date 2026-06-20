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
  
  // Take screenshot before touch
  await page.screenshot({ path: '/home/teo/Projects/games/Saulche/tests/mentis-mobile-1-title.png' });
  
  // Check initial screen state
  const state1 = await page.evaluate(() => {
    // Try to access the screen manager's current state
    const canvas = document.getElementById('game-canvas');
    const app = document.getElementById('app');
    return {
      canvasSize: { w: canvas.width, h: canvas.height },
      canvasDisplay: canvas.getBoundingClientRect(),
      appScreens: app.querySelectorAll('.screen').length,
      activeScreens: app.querySelectorAll('.screen.active').length,
    };
  });
  console.log('Before touch:', JSON.stringify(state1, null, 2));
  
  // Simulate touch on canvas center
  const canvas = await page.$('#game-canvas');
  const box = await canvas.boundingBox();
  console.log('Canvas box:', box);
  
  await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
  await page.waitForTimeout(1000);
  
  // Take screenshot after touch
  await page.screenshot({ path: '/home/teo/Projects/games/Saulche/tests/mentis-mobile-2-after-touch.png' });
  
  const state2 = await page.evaluate(() => {
    const app = document.getElementById('app');
    return {
      appScreens: app.querySelectorAll('.screen').length,
      activeScreens: Array.from(app.querySelectorAll('.screen.active')).map(s => s.className),
    };
  });
  console.log('After touch:', JSON.stringify(state2, null, 2));
  
  // Try a second touch to go to tower
  await page.touchscreen.tap(box.x + box.width / 2, box.y + 250); // "JUGAR" button area
  await page.waitForTimeout(1000);
  
  await page.screenshot({ path: '/home/teo/Projects/games/Saulche/tests/mentis-mobile-3-after-jugar.png' });
  
  const state3 = await page.evaluate(() => {
    const app = document.getElementById('app');
    return {
      appScreens: app.querySelectorAll('.screen').length,
      activeScreens: Array.from(app.querySelectorAll('.screen.active')).map(s => s.className),
    };
  });
  console.log('After JUGAR touch:', JSON.stringify(state3, null, 2));
  
  if (logs.length > 0) {
    console.log('\nConsole logs:');
    logs.forEach(l => console.log(l));
  }
  
  await browser.close();
})();
