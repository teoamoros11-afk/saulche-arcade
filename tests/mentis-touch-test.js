const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 375, height: 667 } }); // iPhone size
  
  const logs = [];
  page.on('console', msg => logs.push(`[${msg.type()}] ${msg.text()}`));
  page.on('pageerror', err => logs.push(`[ERROR] ${err.message}`));
  
  await page.goto('https://teoamoros11-afk.github.io/saulche-arcade/mentis/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  
  // Check canvas position and visibility
  const canvasInfo = await page.evaluate(() => {
    const canvas = document.getElementById('game-canvas');
    const rect = canvas.getBoundingClientRect();
    const style = getComputedStyle(canvas);
    return {
      rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
      display: style.display,
      visibility: style.visibility,
      opacity: style.opacity,
      zIndex: style.zIndex,
      position: style.position,
      transform: style.transform,
      pointerEvents: style.pointerEvents
    };
  });
  console.log('Canvas info:', JSON.stringify(canvasInfo, null, 2));
  
  // Simulate touch on center
  const canvas = await page.$('#game-canvas');
  const box = await canvas.boundingBox();
  console.log('Canvas bounding box:', box);
  
  // Use touch events
  await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
  await page.waitForTimeout(500);
  
  // Check state
  const state = await page.evaluate(() => {
    const app = document.getElementById('app');
    const screens = app.querySelectorAll('.screen');
    return {
      screenCount: screens.length,
      activeScreen: app.querySelector('.screen.active')?.className || 'none'
    };
  });
  console.log('After touch:', JSON.stringify(state, null, 2));
  
  // Take screenshot
  await page.screenshot({ path: '/home/teo/Projects/games/Saulche/tests/mentis-touch-test.png' });
  
  if (logs.length > 0) {
    console.log('\nConsole logs:');
    logs.forEach(l => console.log(l));
  }
  
  await browser.close();
})();
