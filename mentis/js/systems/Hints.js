import { store } from '../core/Store.js'

export class HintSystem {
  constructor() { this._currentHints = [] }

  generateHints(puzzle, category) {
    this._currentHints = []
    if (!puzzle || !puzzle.text) return this._currentHints
    if (category === 'math') {
      this._currentHints = [
        'Lee el problema con atención. ¿Qué datos tienes?',
        'Intenta resolver paso a paso. ¿Qué operación necesitas?',
        'Revisa tu respuesta. ¿Tiene sentido?',
      ]
    } else if (category === 'logic') {
      this._currentHints = [
        'Identifica qué información es importante y qué no.',
        'Elimina las opciones que sabes que son incorrectas.',
        'Prueba cada opción una por una.',
      ]
    } else if (category === 'visual') {
      this._currentHints = [
        'Observa bien la posición y orientación de cada elemento.',
        '¿Ves algún patrón que se repita?',
        'Concéntrate en una parte pequeña a la vez.',
      ]
    } else if (category === 'strategy') {
      this._currentHints = [
        'Piensa en el objetivo final. ¿Qué necesitas lograr?',
        '¿Hay algún atajo o truco?',
        'Prueba con números pequeños primero y busca el patrón.',
      ]
    } else if (category === 'memory') {
      this._currentHints = [
        'Concéntrate en un elemento a la vez.',
        'Agrupa los elementos en categorías.',
        'Crea una historia mental con los elementos.',
      ]
    } else {
      this._currentHints = [
        'Tómate tu tiempo. No hay prisa.',
        '¿Qué te pide exactamente el problema?',
        'Confía en tu primera intuición.',
      ]
    }
    return this._currentHints
  }

  getHint(index = 0) {
    if (index < this._currentHints.length) {
      store.update('stats', s => { s.hintsUsed++; return s })
      return this._currentHints[index]
    }
    return 'No hay más pistas disponibles.'
  }

  reset() { this._currentHints = [] }
}
