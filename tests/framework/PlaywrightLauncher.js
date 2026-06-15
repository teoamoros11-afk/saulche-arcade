import { chromium } from 'playwright'

let _browser = null

export async function getBrowser() {
  if (!_browser || !_browser.isConnected()) {
    _browser = await chromium.launch({ headless: true })
  }
  return _browser
}

export async function closeBrowser() {
  if (_browser) {
    await _browser.close()
    _browser = null
  }
}

export function createPlaywrightLauncher() {
  return {
    getBrowser,
    closeBrowser,
  }
}
