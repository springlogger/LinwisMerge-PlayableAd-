import type { Gun } from './entities/Gun';

export interface Cell {
  x: number;
  z: number;
  gridX: number;
  gridZ: number;
  gun: Gun | null;
  isBlocked?: boolean;
}

export type DropResult =
  | { type: 'merged'; newGun: Gun }
  | { type: 'moved' }
  | { type: 'returned' };

export type GameState = 'playing' | 'won' | 'lost' | 'paused';

export type UpgradeKind = 'damage' | 'speed' | 'hp';

export type UpgradeState = {
  damage: number;
  speed: number;
  hp: number;
};
