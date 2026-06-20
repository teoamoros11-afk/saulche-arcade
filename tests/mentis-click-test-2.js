const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  
  const logs = [];
  page.on('console', msg => logs.push(`[${msg.type()}] ${msg.text()}`));
  page.on('pageerror', err => logs.push(`[ERROR] ${err.message}`));
  
  await page.goto('https://teoamoros11-afk.github.io/saulche-arcade/mentis/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  
  // Check if canvas is rendering title screen
  const titleCheck = await page.evaluate(() => {
    const canvas = document.getElementById('game-canvas');
    const ctx = canvas.getContext('2d');
    // Sample some pixels to see if title is rendered
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let nonBlackPixels = 0;
    for (let i = 0; i < imgData.data.length; i += 4) {
      if (imgData.data[i] > 10 || imgData.data[i+1] > 10 || imgData.data[i+2] > 10) {
        nonBlackPixels++;
      }
    }
    return {
      canvasWidth: canvas.width,
      canvasHeight: canvas.height,
      totalPixels: canvas.width * canvas.height,
      nonBlackPixels,
      isRendering: nonBlackPixels > 1000
    };
  });
  console.log('Title screen rendering:', JSON.stringify(titleCheck, null, 2));
  
  // Click center
  const canvas = await page.$('#game-canvas');
  const box = await canvas.boundingBox();
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  await page.waitForTimeout(500);
  
  // Check if menu is rendered on canvas
  const menuCheck = await page.evaluate(() => {
    const canvas = document.getElementById('game-canvas');
    const ctx = canvas.getContext('2d');
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let nonBlackPixels = 0;
    let goldPixels = 0;
    for (let i = 0; i < imgData.data.length; i += 4) {
      const r = imgData.data[i], g = imgData.data[i+1], b = imgData.data[i+2];
      if (r > 10 || g > 10 || b > 10) nonBlackPixels++;
      if (r > 200 && g > 150 && b < 100) goldPixels++;
    }
    return {
      canvasWidth: canvas.width,
      canvasHeight: canvas.height,
      totalPixels: canvas.width * canvas.height,
      nonBlackPixels,
      goldPixels,
      isRendering: nonBlackPixels > 1000,
      hasGoldText: goldPixels > 100
    };
  });
  console.log('Menu screen rendering:', JSON.stringify(menuCheck, null, 2));
  
  // Take screenshots
  await page.screenshot({ path: '/home/teo/Projects/games/Saulche/tests/mentis-click-test-2.png' });
  
  if (logs.length > 0) {
    console.log('\nConsole logs:');
    logs.forEach(l => console.log(l));
  }
  
  await browser.close();
})();
