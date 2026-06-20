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
  
  // Touch title to go to menu
  const canvas = await page.$('#game-canvas');
  const box = await canvas.boundingBox();
  await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
  await page.waitForTimeout(500);
  
  // Now we're on menu. Let me check what the menu renders
  const menuInfo = await page.evaluate(() => {
    const canvas = document.getElementById('game-canvas');
    const ctx = canvas.getContext('2d');
    // Get pixel colors at different y positions to find buttons
    const results = [];
    for (let y = 100; y < 500; y += 20) {
      const imgData = ctx.getImageData(200, y, 1, 1);
      const [r, g, b] = imgData.data;
      results.push({ y, r, g, b });
    }
    return results;
  });
  console.log('Menu pixel colors at x=200:');
  menuInfo.forEach(p => {
    const isGold = p.r > 200 && p.g > 150 && p.b < 100;
    const isPurple = p.r > 100 && p.g < 100 && p.b > 200;
    const label = isGold ? ' ← GOLD' : isPurple ? ' ← PURPLE' : '';
    console.log(`  y=${p.y}: rgb(${p.r},${p.g},${p.b})${label}`);
  });
  
  // Take screenshot of menu
  await page.screenshot({ path: '/home/teo/Projects/games/Saulche/tests/mentis-menu-detail.png' });
  
  // Try touching the JUGAR button area (should be around y=200 in canvas coords)
  // Canvas is at viewport y=52, so canvas y=200 = viewport y=252
  console.log('\nTouching JUGAR at viewport y=252...');
  await page.touchscreen.tap(box.x + box.width / 2, box.y + 200);
  await page.waitForTimeout(1000);
  
  await page.screenshot({ path: '/home/teo/Projects/games/Saulche/tests/mentis-mobile-4-after-jugar2.png' });
  
  const state = await page.evaluate(() => {
    const app = document.getElementById('app');
    return {
      activeScreens: Array.from(app.querySelectorAll('.screen.active')).map(s => s.className),
    };
  });
  console.log('After JUGAR touch:', JSON.stringify(state, null, 2));
  
  if (logs.length > 0) {
    console.log('\nConsole logs:');
    logs.forEach(l => console.log(l));
  }
  
  await browser.close();
})();
