import { Juego01Adapter } from './juegos/Juego01Adapter.js'
import { Juego02Adapter } from './juegos/Juego02Adapter.js'
import { Juego03Adapter } from './juegos/Juego03Adapter.js'
import { Juego04Adapter } from './juegos/Juego04Adapter.js'
import { Juego05Adapter } from './juegos/Juego05Adapter.js'
import { Juego06Adapter } from './juegos/Juego06Adapter.js'
import { Juego07Adapter } from './juegos/Juego07Adapter.js'
import { Juego08Adapter } from './juegos/Juego08Adapter.js'
import { Juego09Adapter } from './juegos/Juego09Adapter.js'
import { Juego10Adapter } from './juegos/Juego10Adapter.js'
import { Juego11Adapter } from './juegos/Juego11Adapter.js'
import { Juego12Adapter } from './juegos/Juego12Adapter.js'
import { Juego13Adapter } from './juegos/Juego13Adapter.js'
import { Juego14Adapter } from './juegos/Juego14Adapter.js'
import { Juego15Adapter } from './juegos/Juego15Adapter.js'
import { Juego16Adapter } from './juegos/Juego16Adapter.js'
import { Juego17Adapter } from './juegos/Juego17Adapter.js'
import { Juego18Adapter } from './juegos/Juego18Adapter.js'
import { Juego19Adapter } from './juegos/Juego19Adapter.js'
import { Juego20Adapter } from './juegos/Juego20Adapter.js'
import { Juego21Adapter } from './juegos/Juego21Adapter.js'
import { Juego22Adapter } from './juegos/Juego22Adapter.js'
import { Juego23Adapter } from './juegos/Juego23Adapter.js'
import { Juego24Adapter } from './juegos/Juego24Adapter.js'
import { Juego25Adapter } from './juegos/Juego25Adapter.js'
import { Juego26Adapter } from './juegos/Juego26Adapter.js'
import { Juego27Adapter } from './juegos/Juego27Adapter.js'
import { Juego28Adapter } from './juegos/Juego28Adapter.js'
import { Juego29Adapter } from './juegos/Juego29Adapter.js'
import { Juego30Adapter } from './juegos/Juego30Adapter.js'
import { Juego31Adapter } from './juegos/Juego31Adapter.js'
import { Juego32Adapter } from './juegos/Juego32Adapter.js'
import { Juego33Adapter } from './juegos/Juego33Adapter.js'
import { Juego34Adapter } from './juegos/Juego34Adapter.js'
import { Juego35Adapter } from './juegos/Juego35Adapter.js'
import { Juego36Adapter } from './juegos/Juego36Adapter.js'
import { Juego37Adapter } from './juegos/Juego37Adapter.js'
import { Juego38Adapter } from './juegos/Juego38Adapter.js'
import { Juego39Adapter } from './juegos/Juego39Adapter.js'
import { Juego40Adapter } from './juegos/Juego40Adapter.js'
import { Juego41Adapter } from './juegos/Juego41Adapter.js'

import { TetrisAdapter } from './classics/TetrisAdapter.js'
import { SnakeAdapter } from './classics/SnakeAdapter.js'
import { PongAdapter } from './classics/PongAdapter.js'
import { BreakoutAdapter } from './classics/BreakoutAdapter.js'
import { TicTacToeAdapter } from './classics/TicTacToeAdapter.js'
import { SimonAdapter } from './classics/SimonAdapter.js'
import { MinesweeperAdapter } from './classics/MinesweeperAdapter.js'
import { DonkeyKongAdapter } from './classics/DonkeyKongAdapter.js'
import { KingKongAdapter } from './classics/KingKongAdapter.js'
import { SubmarinoAdapter } from './classics/SubmarinoAdapter.js'
import { ComecocosAdapter } from './classics/ComecocosAdapter.js'
import { HundirFlotaAdapter } from './classics/HundirFlotaAdapter.js'
import { FlappyGrizzyAdapter } from './classics/FlappyGrizzyAdapter.js'

export const adapters = [
  new Juego01Adapter(), new Juego02Adapter(), new Juego03Adapter(),
  new Juego04Adapter(), new Juego05Adapter(), new Juego06Adapter(),
  new Juego07Adapter(), new Juego08Adapter(), new Juego09Adapter(),
  new Juego10Adapter(), new Juego11Adapter(), new Juego12Adapter(),
  new Juego13Adapter(), new Juego14Adapter(), new Juego15Adapter(),
  new Juego16Adapter(), new Juego17Adapter(), new Juego18Adapter(),
  new Juego19Adapter(), new Juego20Adapter(), new Juego21Adapter(),
  new Juego22Adapter(), new Juego23Adapter(), new Juego24Adapter(),
  new Juego25Adapter(), new Juego26Adapter(), new Juego27Adapter(),
  new Juego28Adapter(), new Juego29Adapter(), new Juego30Adapter(),
  new Juego31Adapter(), new Juego32Adapter(), new Juego33Adapter(),
  new Juego34Adapter(), new Juego35Adapter(), new Juego36Adapter(),
  new Juego37Adapter(), new Juego38Adapter(), new Juego39Adapter(),
  new Juego40Adapter(),
  new Juego41Adapter(),

  new TetrisAdapter(), new SnakeAdapter(), new PongAdapter(),
  new BreakoutAdapter(), new TicTacToeAdapter(), new SimonAdapter(),
  new MinesweeperAdapter(), new DonkeyKongAdapter(), new KingKongAdapter(),
  new SubmarinoAdapter(), new ComecocosAdapter(), new HundirFlotaAdapter(),
  new FlappyGrizzyAdapter(),
]

export function getAdapter(filename) {
  return adapters.find(a => a.file === filename)
}
