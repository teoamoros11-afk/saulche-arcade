const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  // Collect console messages
  const logs = [];
  page.on('console', msg => logs.push(`[${msg.type()}] ${msg.text()}`));
  page.on('pageerror', err => logs.push(`[ERROR] ${err.message}`));
  
  await page.goto('https://teoamoros11-afk.github.io/saulche-arcade/mentis/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  
  // Check initial state
  const initialState = await page.evaluate(() => {
    const canvas = document.getElementById('game-canvas');
    const app = document.getElementById('app');
    const screens = app.querySelectorAll('.screen');
    return {
      canvasExists: !!canvas,
      canvasZIndex: getComputedStyle(canvas).zIndex,
      appZIndex: getComputedStyle(app).zIndex,
      screenCount: screens.length,
      screenClasses: Array.from(screens).map(s => s.className),
      screenStyles: Array.from(screens).map(s => ({
        display: getComputedStyle(s).display,
        zIndex: getComputedStyle(s).zIndex,
        visibility: getComputedStyle(s).visibility
      }))
    };
  });
  console.log('Initial state:', JSON.stringify(initialState, null, 2));
  
  // Click on the canvas center (where "TOCA PARA COMENZAR" should be)
  const canvas = await page.$('#game-canvas');
  const box = await canvas.boundingBox();
  console.log('Canvas box:', box);
  
  // Click center of canvas
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  await page.waitForTimeout(500);
  
  // Check state after click
  const afterClick = await page.evaluate(() => {
    const app = document.getElementById('app');
    const screens = app.querySelectorAll('.screen');
    const activeScreen = app.querySelector('.screen.active');
    return {
      screenCount: screens.length,
      activeScreenClass: activeScreen?.className || 'none',
      activeScreenDisplay: activeScreen ? getComputedStyle(activeScreen).display : 'none',
      allScreens: Array.from(screens).map(s => ({
        class: s.className,
        display: getComputedStyle(s).display,
        active: s.classList.contains('active')
      }))
    };
  });
  console.log('After click:', JSON.stringify(afterClick, null, 2));
  
  // Take screenshot
  await page.screenshot({ path: '/home/teo/Projects/games/Saulche/tests/mentis-click-test.png' });
  
  // Print console logs
  if (logs.length > 0) {
    console.log('\nConsole logs:');
    logs.forEach(l => console.log(l));
  }
  
  await browser.close();
})();
