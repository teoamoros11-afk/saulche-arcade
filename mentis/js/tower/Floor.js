import { getEngine, getRandomCategory, CATEGORIES } from '../puzzles/Registry.js'

export class FloorGenerator {
  generate(floorNum) {
    const difficulty = this._calcDifficulty(floorNum)
    const category = this._pickCategory(floorNum)
    const puzzleCount = 3
    const puzzles = []

    const engine = getEngine(category)
    for (let i = 0; i < puzzleCount; i++) {
      const puzzle = engine.generate(difficulty)
      puzzles.push({
        id: `${floorNum}-${i}`,
        category,
        difficulty,
        solved: false,
        stars: 0,
        hintsUsed: 0,
        data: puzzle,
      })
    }

    return {
      num: floorNum,
      zone: this._getZoneId(floorNum),
      difficulty,
      category,
      puzzles,
      completed: false,
      stars: 0,
    }
  }

  _calcDifficulty(floorNum) {
    if (floorNum <= 10) return 1
    if (floorNum <= 20) return 2
    if (floorNum <= 30) return 3
    if (floorNum <= 40) return 4
    if (floorNum <= 50) return 5
    if (floorNum <= 60) return 6
    if (floorNum <= 70) return 7
    if (floorNum <= 80) return 8
    if (floorNum <= 90) return 9
    return 10
  }

  _getZoneId(floorNum) {
    if (floorNum <= 15) return 'logic'
    if (floorNum <= 35) return 'math'
    if (floorNum <= 50) return 'visual'
    if (floorNum <= 70) return 'strategy'
    if (floorNum <= 85) return 'memory'
    return 'mixed'
  }

  _pickCategory(floorNum) {
    const zone = this._getZoneId(floorNum)
    if (zone === 'mixed') return getRandomCategory()
    return zone
  }
}
