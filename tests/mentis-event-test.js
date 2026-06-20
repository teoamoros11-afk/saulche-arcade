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
  
  // Check what element is at the touch point
  const elementCheck = await page.evaluate(() => {
    const canvas = document.getElementById('game-canvas');
    const app = document.getElementById('app');
    const canvasRect = canvas.getBoundingClientRect();
    const centerX = canvasRect.x + canvasRect.width / 2;
    const centerY = canvasRect.y + canvasRect.height / 2;
    
    // Check what element is at the center point
    const elemAtPoint = document.elementFromPoint(centerX, centerY);
    
    return {
      canvasRect: { x: canvasRect.x, y: canvasRect.y, w: canvasRect.width, h: canvasRect.height },
      centerPoint: { x: centerX, y: centerY },
      elementAtCenter: elemAtPoint ? {
        tag: elemAtPoint.tagName,
        id: elemAtPoint.id,
        className: elemAtPoint.className,
        zIndex: getComputedStyle(elemAtPoint).zIndex
      } : 'none',
      appPointerEvents: getComputedStyle(app).pointerEvents,
      canvasPointerEvents: getComputedStyle(canvas).pointerEvents,
      appDisplay: getComputedStyle(app).display,
      canvasDisplay: getComputedStyle(canvas).display,
    };
  });
  console.log('Element check:', JSON.stringify(elementCheck, null, 2));
  
  // Check all elements and their z-indices
  const zCheck = await page.evaluate(() => {
    const elements = [
      document.getElementById('app'),
      document.getElementById('game-canvas'),
      ...document.querySelectorAll('.screen')
    ];
    return elements.filter(Boolean).map(el => ({
      tag: el.tagName,
      id: el.id,
      class: el.className,
      zIndex: getComputedStyle(el).zIndex,
      position: getComputedStyle(el).position,
      pointerEvents: getComputedStyle(el).pointerEvents,
      display: getComputedStyle(el).display,
      visibility: getComputedStyle(el).visibility
    }));
  });
  console.log('\nAll elements z-index check:');
  zCheck.forEach(el => console.log(`  ${el.tag}#${el.id}.${el.class}: z-index=${el.zIndex}, position=${el.position}, pointer-events=${el.pointerEvents}`));
  
  // Now let me check: does the touch event actually fire on the canvas?
  const touchTest = await page.evaluate(() => {
    return new Promise((resolve) => {
      const canvas = document.getElementById('game-canvas');
      let touchFired = false;
      let clickFired = false;
      
      const onTouchStart = (e) => {
        touchFired = true;
        console.log('[DEBUG-TOUCH] touchstart fired');
      };
      const onClick = (e) => {
        clickFired = true;
        console.log('[DEBUG-CLICK] click fired');
      };
      
      canvas.addEventListener('touchstart', onTouchStart, { once: true, capture: true });
      canvas.addEventListener('click', onClick, { once: true, capture: true });
      
      // Simulate a click at center
      const rect = canvas.getBoundingClientRect();
      const event = new MouseEvent('click', {
        clientX: rect.x + rect.width / 2,
        clientY: rect.y + rect.height / 2,
        bubbles: true
      });
      canvas.dispatchEvent(event);
      
      setTimeout(() => {
        resolve({ touchFired, clickFired });
      }, 100);
    });
  });
  console.log('\nDirect event dispatch test:', JSON.stringify(touchTest));
  
  if (logs.length > 0) {
    console.log('\nConsole logs:');
    logs.forEach(l => console.log(l));
  }
  
  await browser.close();
})();
