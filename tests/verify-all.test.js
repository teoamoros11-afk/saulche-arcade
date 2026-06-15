import { test, expect } from '@playwright/test'
import { adapters } from './adapters/index.js'
import { gameUrl, collectConsoleErrors } from './setup.js'
import { GameTestSuite } from './framework/GameTestSuite.js'

for (const adapter of adapters) {
  const suite = new GameTestSuite(adapter)
  suite.run()
}
