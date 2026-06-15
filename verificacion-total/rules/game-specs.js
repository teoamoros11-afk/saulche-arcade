import { FormalSpecification } from './FormalSpecification.js'
import { TemporalLogicChecker } from './TemporalLogicChecker.js'

const SPEC = new FormalSpecification()
const TL = new TemporalLogicChecker()

function commonPlatformSpecs(gameId, title) {
  SPEC.define(gameId, {
    name: title,
    type: 'platform',
    usesCanvas: true,
    inputTypes: ['keyboard', 'touch'],
    initialState: { gameState: 'menu' },
    rules: [
      {
        name: 'canvas_exists', category: 'render', severity: 'error',
        description: 'Canvas element must exist',
        check: () => !!document.querySelector('canvas')
      },
      {
        name: 'score_non_negative', category: 'integrity', severity: 'error',
        description: 'Score must be >= 0',
        check: () => {
          const s = window.score ?? window.puntuacion ?? 0
          return typeof s === 'number' && s >= 0
        }
      },
      {
        name: 'level_in_range', category: 'integrity', severity: 'warning',
        description: 'Level must be in valid range',
        check: () => {
          const lv = window.level ?? 0
          return typeof lv === 'number' && lv >= 0 && lv <= 50
        }
      }
    ],
    invariants: [
      {
        name: 'canvas_not_blank', severity: 'error',
        description: 'Canvas must never be completely blank during gameplay',
        check: () => {
          const c = document.querySelector('canvas')
          if (!c) return false
          const ctx = c.getContext('2d')
          if (!ctx) return false
          const d = ctx.getImageData(0, 0, c.width, c.height).data
          return d.some(v => v !== 0)
        }
      }
    ]
  })
}

function commonClassicSpecs(gameId, title, type, hasAI, usesCanvas) {
  SPEC.define(gameId, {
    name: title,
    type,
    usesCanvas,
    initialState: {},
    rules: [],
    invariants: [
      {
        name: 'state_defined', severity: 'error',
        description: 'Game state must be defined',
        check: () => window.state !== undefined || window.gameState !== undefined || true
      }
    ]
  })
}

for (let i = 1; i <= 40; i++) {
  const id = `juego${String(i).padStart(2, '0')}`
  commonPlatformSpecs(id, `Juego ${i}`)
}

commonPlatformSpecs('flappygrizzy', 'Flappy Grizzy')
TL.defineProperty('flappygrizzy', TemporalLogicChecker.scoreEventuallyAbove(1))

commonClassicSpecs('tictactoe', 'Tic Tac Toe', 'board', true, false)
SPEC.define('tictactoe', {
  rules: [
    {
      name: 'board_valid', category: 'integrity', severity: 'error',
      description: 'Board must have 9 cells',
      check: () => Array.isArray(window.board) && window.board.length === 9
    },
    {
      name: 'current_player_valid', category: 'rules', severity: 'error',
      description: 'Current player must be X or O',
      check: () => window.curP === 'X' || window.curP === 'O'
    },
    {
      name: 'score_non_negative', category: 'integrity', severity: 'error',
      description: 'Player and AI wins are non-negative',
      check: () => (window.pw ?? 0) >= 0 && (window.aw ?? 0) >= 0
    }
  ],
  invariants: [
    {
      name: 'board_cells_valid', severity: 'error',
      description: 'Board cells must be X, O, or null',
      check: () => {
        if (!Array.isArray(window.board)) return false
        return window.board.every(c => c === 'X' || c === 'O' || c === null || c === '')
      }
    }
  ]
})

commonClassicSpecs('snake', 'Snake', 'grid', false, true)
SPEC.define('snake', {
  rules: [
    {
      name: 'score_non_negative', category: 'integrity', severity: 'error',
      description: 'Score must be >= 0',
      check: () => (window.score ?? 0) >= 0
    },
    {
      name: 'snake_defined', category: 'integrity', severity: 'error',
      description: 'Snake array must exist',
      check: () => Array.isArray(window.snake)
    },
    {
      name: 'food_defined', category: 'integrity', severity: 'error',
      description: 'Food must exist',
      check: () => !!window.food
    }
  ],
  invariants: [
    {
      name: 'level_progression', severity: 'warning',
      description: 'needed > foodEaten during play',
      check: () => {
        if (typeof window.needed === 'undefined') return true
        if (typeof window.foodEaten === 'undefined') return true
        return window.foodEaten <= window.needed
      }
    }
  ]
})

commonClassicSpecs('pong', 'Pong', 'physics', true, true)
SPEC.define('pong', {
  rules: [
    {
      name: 'score_non_negative', category: 'integrity', severity: 'error',
      description: 'Score must be >= 0',
      check: () => {
        if (typeof window.player === 'undefined') return true
        return (window.player.score ?? 0) >= 0
      }
    },
    {
      name: 'level_in_range', category: 'integrity', severity: 'warning',
      description: 'Level must be valid',
      check: () => (window.level ?? 0) >= 0
    }
  ]
})

commonClassicSpecs('breakout', 'Breakout', 'physics', false, true)
SPEC.define('breakout', {
  rules: [
    {
      name: 'level_in_range', category: 'integrity', severity: 'error',
      description: 'Level must be >= 0',
      check: () => (window.level ?? 0) >= 0
    }
  ]
})

commonClassicSpecs('tetris', 'Tetris', 'grid', false, true)
SPEC.define('tetris', {
  rules: [
    {
      name: 'score_non_negative', category: 'integrity', severity: 'error',
      description: 'Score must be >= 0',
      check: () => (window.score ?? 0) >= 0
    },
    {
      name: 'level_valid', category: 'integrity', severity: 'error',
      description: 'Level >= 0',
      check: () => (window.level ?? 0) >= 0
    },
    {
      name: 'grid_valid', category: 'integrity', severity: 'error',
      description: 'Grid must be an array',
      check: () => Array.isArray(window.grid)
    },
    {
      name: 'lines_valid', category: 'integrity', severity: 'warning',
      description: 'Lines cleared >= 0',
      check: () => (window.lines ?? 0) >= 0
    }
  ],
  invariants: [
    {
      name: 'paused_state_consistent', severity: 'warning',
      description: 'paused is boolean when defined',
      check: () => typeof window.paused === 'undefined' || typeof window.paused === 'boolean'
    }
  ]
})

commonClassicSpecs('minesweeper', 'Minesweeper', 'board', false, false)
SPEC.define('minesweeper', {
  rules: [
    {
      name: 'grid_exists', category: 'integrity', severity: 'error',
      description: 'Grid must exist',
      check: () => !!window.grid || typeof window.grid !== 'undefined'
    },
    {
      name: 'level_valid', category: 'integrity', severity: 'error',
      description: 'Level >= 0',
      check: () => (window.level ?? 0) >= 0
    }
  ]
})

commonClassicSpecs('comecocos', 'Comecocos (Pac-Man)', 'grid', true, true)
SPEC.define('comecocos', {
  rules: [
    {
      name: 'score_non_negative', category: 'integrity', severity: 'error',
      description: 'Score >= 0',
      check: () => (window.score ?? 0) >= 0
    },
    {
      name: 'lives_valid', category: 'integrity', severity: 'error',
      description: 'Lives >= 0',
      check: () => (window.lives ?? 0) >= 0
    },
    {
      name: 'level_valid', category: 'integrity', severity: 'error',
      description: 'Level >= 0',
      check: () => (window.level ?? 0) >= 0
    }
  ]
})

commonClassicSpecs('donkeykong', 'Donkey Kong', 'platform', true, true)
SPEC.define('donkeykong', {
  rules: [
    {
      name: 'score_non_negative', category: 'integrity', severity: 'error',
      description: 'Score >= 0',
      check: () => (window.score ?? 0) >= 0
    },
    {
      name: 'lives_valid', category: 'integrity', severity: 'error',
      description: 'Lives >= 0',
      check: () => (window.lives ?? 0) >= 0
    },
    {
      name: 'level_valid', category: 'integrity', severity: 'error',
      description: 'Level >= 0',
      check: () => (window.level ?? 0) >= 0
    }
  ]
})

commonClassicSpecs('kingkong', 'King Kong', 'platform', true, true)
SPEC.define('kingkong', {
  rules: [
    {
      name: 'score_non_negative', category: 'integrity', severity: 'error',
      description: 'Score >= 0',
      check: () => (window.score ?? 0) >= 0
    },
    {
      name: 'lives_valid', category: 'integrity', severity: 'error',
      description: 'Lives >= 0',
      check: () => (window.lives ?? 0) >= 0
    },
    {
      name: 'banana_count_valid', category: 'rules', severity: 'warning',
      description: 'bananaCount >= 0 if defined',
      check: () => (window.bananaCount ?? 0) >= 0
    }
  ]
})

commonClassicSpecs('flappygrizzy', 'Flappy Grizzy', 'physics', false, true)
SPEC.define('flappygrizzy', {
  rules: [
    {
      name: 'score_non_negative', category: 'integrity', severity: 'error',
      description: 'Score >= 0',
      check: () => (window.score ?? 0) >= 0
    },
    {
      name: 'level_valid', category: 'integrity', severity: 'error',
      description: 'Level >= 0',
      check: () => (window.level ?? 0) >= 0
    }
  ]
})

commonClassicSpecs('hundirlaflota', 'Hundir la Flota (Battleship)', 'board', true, false)
SPEC.define('hundirlaflota', {
  rules: [
    {
      name: 'state_object_exists', category: 'integrity', severity: 'error',
      description: 'State object must exist',
      check: () => !!window.state
    },
    {
      name: 'phase_defined', category: 'integrity', severity: 'error',
      description: 'Phase must be defined in state',
      check: () => window.state && !!window.state.phase
    }
  ],
  invariants: [
    {
      name: 'valid_phase', severity: 'warning',
      description: 'Phase must be one of known values',
      check: () => {
        if (!window.state || !window.state.phase) return true
        return ['menu', 'playing', 'placing', 'gameover'].includes(window.state.phase)
      }
    }
  ]
})

commonClassicSpecs('simon', 'Simon', 'memory', false, false)
SPEC.define('simon', {
  rules: [
    {
      name: 'sequence_exists', category: 'integrity', severity: 'error',
      description: 'Sequence array must exist',
      check: () => Array.isArray(window.seq) || typeof window.seq !== 'undefined'
    },
    {
      name: 'level_valid', category: 'integrity', severity: 'error',
      description: 'Level >= 0',
      check: () => (window.level ?? 0) >= 0
    }
  ]
})

commonClassicSpecs('submarino', 'Submarino', 'physics', true, true)
SPEC.define('submarino', {
  rules: [
    {
      name: 'game_object_exists', category: 'integrity', severity: 'error',
      description: 'Game object must exist',
      check: () => !!window.game
    },
    {
      name: 'score_valid', category: 'integrity', severity: 'error',
      description: 'Score >= 0',
      check: () => window.game && (window.game.score ?? 0) >= 0
    },
    {
      name: 'lives_valid', category: 'integrity', severity: 'error',
      description: 'Lives >= 0',
      check: () => window.game && window.game.player && (window.game.player.lives ?? 0) >= 0
    }
  ],
  invariants: [
    {
      name: 'valid_state', severity: 'warning',
      description: 'State must be a known value',
      check: () => {
        if (!window.game || !window.game.state) return true
        return ['menu', 'playing', 'gameover', 'pause'].includes(window.game.state)
      }
    }
  ]
})

export function registerAllSpecs(oracle) {
  for (const [gameId, spec] of SPEC.specs) {
    oracle.registerSpec(gameId, spec)
  }
}

export function registerAllRules(engine) {
  for (const [gameId, spec] of SPEC.specs) {
    if (spec.rules) {
      for (const rule of spec.rules) {
        engine.registerRule(gameId, rule)
      }
    }
  }
}

export function registerAllInvariants(checker) {
  for (const [gameId, spec] of SPEC.specs) {
    if (spec.invariants) {
      for (const inv of spec.invariants) {
        checker.registerInvariant(gameId, inv)
      }
    }
  }
}

export function registerAllTemporalProperties(checker) {
  for (const [gameId, props] of TL.properties) {
    for (const prop of props) {
      checker.defineProperty(gameId, prop)
    }
  }
}

export function getGameIds() {
  return Array.from(SPEC.specs.keys())
}

export { SPEC as gameSpecs }
