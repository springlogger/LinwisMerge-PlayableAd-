import * as THREE from 'three';
import { Gun } from '../entities/Gun';
import type { Cell, DropResult } from '../types';
import type { MeshFactory } from '../factories/MeshFactory';
import type { EffectsSystem } from './EffectsSystem';
import { CELL_SIZE, GRID_CENTER, GRID_SIZE, TIERS, TIER_COLOR } from '../config';

const SNAP_RANGE = CELL_SIZE * 0.65;
const TILE_Y = 0.18;

export class GridSystem {
  readonly cells: Cell[][] = [];
  readonly guns: Gun[] = [];
  readonly group = new THREE.Group();

  constructor(
    private readonly meshFactory: MeshFactory,
    private readonly scene: THREE.Scene,
    private readonly effects: EffectsSystem,
  ) {
    this.scene.add(this.group);
    this.buildCells();
  }

  buyGun(): Gun | null {
    const empty = this.findEmptyCell();
    if (!empty) return null;
    return this.placeGun(1, empty);
  }

  removeGun(gun: Gun): void {
    if (gun.cell.gun === gun) gun.cell.gun = null;
    this.scene.remove(gun.mesh);
    gun.dispose();
    const i = this.guns.indexOf(gun);
    if (i >= 0) this.guns.splice(i, 1);
  }

  cellAtWorldPos(worldX: number, worldZ: number): Cell | null {
    let nearest: Cell | null = null;
    let bestDistance = Infinity;
    for (let gx = 0; gx < GRID_SIZE; gx++) {
      for (let gz = 0; gz < GRID_SIZE; gz++) {
        const cell = this.cells[gx][gz];
        if (cell.isBlocked) continue;
        const distance = Math.hypot(cell.x - worldX, cell.z - worldZ);
        if (distance < bestDistance) {
          bestDistance = distance;
          nearest = cell;
        }
      }
    }
    return bestDistance < SNAP_RANGE ? nearest : null;
  }

  handleDrop(dragged: Gun, droppedAtX: number, droppedAtZ: number): DropResult {
    const target = this.cellAtWorldPos(droppedAtX, droppedAtZ);

    if (!target || target === dragged.cell) {
      this.snapBack(dragged);
      return { type: 'returned' };
    }

    if (!target.gun) {
      dragged.cell.gun = null;
      target.gun = dragged;
      dragged.cell = target;
      this.snapBack(dragged);
      return { type: 'moved' };
    }

    const canMerge = target.gun.tier === dragged.tier && dragged.tier < TIERS;
    if (canMerge) {
      const newTier = dragged.tier + 1;
      this.effects.spawnBurst(target.x, 0.7, target.z, TIER_COLOR[newTier - 1]);
      this.removeGun(target.gun);
      this.removeGun(dragged);
      const merged = this.placeGun(newTier, target);
      return { type: 'merged', newGun: merged };
    }

    this.snapBack(dragged);
    return { type: 'returned' };
  }

  update(dt: number): void {
    for (const gun of this.guns) gun.settleAfterRecoil(dt);
  }

  reset(): void {
    while (this.guns.length) this.removeGun(this.guns[0]);
  }

  private buildCells(): void {
    for (let gx = 0; gx < GRID_SIZE; gx++) {
      this.cells.push([]);
      for (let gz = 0; gz < GRID_SIZE; gz++) {
        const x = (gx - GRID_CENTER) * CELL_SIZE;
        const z = (gz - GRID_CENTER) * CELL_SIZE;
        const isBlocked = gx === GRID_CENTER && gz === GRID_CENTER;

        if (!isBlocked) {
          const tile = this.meshFactory.createGridTile();
          tile.position.set(x, TILE_Y, z);
          this.group.add(tile);
        }

        this.cells[gx].push({ x, z, gridX: gx, gridZ: gz, gun: null, isBlocked });
      }
    }
  }

  private findEmptyCell(): Cell | null {
    for (let gx = 0; gx < GRID_SIZE; gx++) {
      for (let gz = 0; gz < GRID_SIZE; gz++) {
        const cell = this.cells[gx][gz];
        if (!cell.isBlocked && !cell.gun) return cell;
      }
    }
    return null;
  }

  private placeGun(tier: number, cell: Cell): Gun {
    const gun = new Gun(this.meshFactory, tier, cell);
    this.scene.add(gun.mesh);
    cell.gun = gun;
    this.guns.push(gun);
    return gun;
  }

  private snapBack(gun: Gun): void {
    gun.mesh.position.set(gun.cell.x, gun.baseY, gun.cell.z);
  }
}
