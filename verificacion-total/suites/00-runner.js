import { adapters } from '../../tests/adapters/index.js'
import { gameUrl } from '../../tests/setup.js'
import { HistoryRecorder } from '../core/HistoryRecorder.js'
import { SnapshotManager } from '../core/SnapshotManager.js'
import { PixelMatcher } from '../core/PixelMatcher.js'
import { GameOracle } from '../core/GameOracle.js'
import { RuleEngine } from '../rules/RuleEngine.js'
import { InvariantChecker } from '../rules/InvariantChecker.js'
import { TemporalLogicChecker } from '../rules/TemporalLogicChecker.js'
import { registerAllSpecs, registerAllRules, registerAllInvariants, registerAllTemporalProperties, getGameIds } from '../rules/game-specs.js'

export { adapters, gameUrl }
export { HistoryRecorder, SnapshotManager, PixelMatcher, GameOracle, RuleEngine, InvariantChecker, TemporalLogicChecker }

export const history = new HistoryRecorder({ historyDir: './reports/history' })
export const snapshots = new SnapshotManager({ snapDir: './snapshots' })
export const pixelMatcher = new PixelMatcher({ tolerance: 5, threshold: 0.5 })
export const oracle = new GameOracle()
export const ruleEngine = new RuleEngine({ history })
export const invariantChecker = new InvariantChecker({ history })
export const temporalChecker = new TemporalLogicChecker({ history })

registerAllSpecs(oracle)
registerAllRules(ruleEngine)
registerAllInvariants(invariantChecker)
registerAllTemporalProperties(temporalChecker)

export const allGameIds = getGameIds()

export async function setupGame(page, adapter) {
  await page.goto(gameUrl(adapter.file), { waitUntil: 'networkidle', timeout: 15000 })
  await page.waitForTimeout(500)
}

export async function collectErrors(page) {
  return page.evaluate(() => {
    const logs = []
    const origError = console.error
    console.error = (...args) => { logs.push(args.join(' ')); origError.apply(console, args) }
    return logs
  })
}
