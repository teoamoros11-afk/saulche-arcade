const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  console.log('[TEST] Loading MENTIS...');
  await page.goto('https://teoamoros11-afk.github.io/saulche-arcade/mentis/', { waitUntil: 'networkidle' });
  
  // Wait for canvas to be present
  const canvas = await page.waitForSelector('#game-canvas', { timeout: 10000 });
  console.log('[TEST] Canvas found:', !!canvas);
  
  // Check canvas dimensions
  const canvasSize = await page.evaluate(() => {
    const c = document.getElementById('game-canvas');
    return { width: c.width, height: c.height, styleWidth: c.style.width, styleHeight: c.style.height };
  });
  console.log('[TEST] Canvas size:', canvasSize);
  
  // Check if canvas has content (not just a blue rectangle)
  const hasContent = await page.evaluate(() => {
    const c = document.getElementById('game-canvas');
    const ctx = c.getContext('2d');
    const imageData = ctx.getImageData(0, 0, c.width, c.height);
    const data = imageData.data;
    
    // Check if there's any non-black/non-blue content
    let hasNonBlack = false;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];
      
      // Check if pixel is not black (0,0,0) or very dark blue
      if (r > 20 || g > 20 || b > 30) {
        hasNonBlack = true;
        break;
      }
    }
    return hasNonBlack;
  });
  console.log('[TEST] Canvas has content (not just blue/black):', hasContent);
  
  // Check for console errors
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  
  // Wait a bit for any errors to appear
  await page.waitForTimeout(2000);
  
  // Check if title screen is rendered
  const titleText = await page.evaluate(() => {
    const c = document.getElementById('game-canvas');
    const ctx = c.getContext('2d');
    // Sample a few pixels around where the title should be
    const pixels = [];
    for (let x = 150; x < 250; x += 10) {
      for (let y = 170; y < 190; y += 5) {
        const pixel = ctx.getImageData(x, y, 1, 1).data;
        pixels.push({ x, y, r: pixel[0], g: pixel[1], b: pixel[2] });
      }
    }
    return pixels;
  });
  console.log('[TEST] Title area pixels:', titleText.slice(0, 5));
  
  // Take a screenshot
  await page.screenshot({ path: '/home/teo/Projects/games/Saulche/tests/mentis-screenshot.png' });
  console.log('[TEST] Screenshot saved to tests/mentis-screenshot.png');
  
  // Final verdict
  const passed = hasContent && canvasSize.width === 400 && canvasSize.height === 600;
  console.log(`[TEST] ${passed ? '✅ PASSED' : '❌ FAILED'} - Canvas has content: ${hasContent}, Size: ${canvasSize.width}x${canvasSize.height}`);
  
  await browser.close();
  process.exit(passed ? 0 : 1);
})();
