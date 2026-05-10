import * as THREE from 'three';
import type { Cell } from '../types';
import type { MeshFactory } from '../factories/MeshFactory';
import { CELL_SIZE } from '../config';

const GUN_BASE_HEIGHT = 0.45;
const GUN_HEIGHT_PER_TIER = 0.04;
const RECOIL_SETTLE_SPEED = 0.6;

export class Gun {
  readonly mesh: THREE.Object3D;
  readonly tier: number;
  cell: Cell;
  lastShotTime = 0;
  readonly baseY: number;

  private readonly hoverHalo: THREE.Mesh;

  constructor(meshFactory: MeshFactory, tier: number, cell: Cell) {
    this.tier = tier;
    this.cell = cell;
    this.mesh = meshFactory.createGun(tier);
    this.baseY = GUN_BASE_HEIGHT + (tier - 1) * GUN_HEIGHT_PER_TIER;
    this.mesh.position.set(cell.x, this.baseY, cell.z);
    this.mesh.userData.kind = 'gun';
    this.mesh.userData.gunRef = this;

    this.hoverHalo = new THREE.Mesh(
      new THREE.SphereGeometry(CELL_SIZE * 0.45, 20, 14),
      new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0,
        depthWrite: false,
      }),
    );
    this.mesh.add(this.hoverHalo);
  }

  setHover(active: boolean): void {
    (this.hoverHalo.material as THREE.MeshBasicMaterial).opacity = active ? 0.5 : 0;
  }

  settleAfterRecoil(dt: number): void {
    if (this.mesh.position.y > this.baseY) {
      this.mesh.position.y = Math.max(this.baseY, this.mesh.position.y - dt * RECOIL_SETTLE_SPEED);
    }
  }

  dispose(): void {
    this.mesh.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.geometry.dispose();
        const material = object.material;
        if (Array.isArray(material)) material.forEach((m) => m.dispose());
        else material.dispose();
      }
    });
  }
}
