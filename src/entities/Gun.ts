import * as THREE from 'three';
import type { Cell } from '../types';
import type { MeshFactory } from '../factories/MeshFactory';
import { CELL_SIZE, TIER_COLOR } from '../config';

const GUN_BASE_HEIGHT = 0.45;
const GUN_HEIGHT_PER_TIER = 0.04;
const RECOIL_SETTLE_SPEED = 0.6;
const PICK_RADIUS = CELL_SIZE * 0.58;
const PICK_HEIGHT = 1.55;
const TIER_BADGE_SIZE = CELL_SIZE * 0.38;
const TIER_BADGE_Y = 1.18;

export class Gun {
  readonly mesh: THREE.Object3D;
  readonly tier: number;
  cell: Cell;
  lastShotTime = 0;
  readonly baseY: number;

  private readonly hoverHalo: THREE.Mesh;
  private readonly pickVolume: THREE.Mesh;
  private readonly tierBadge: THREE.Sprite;

  constructor(meshFactory: MeshFactory, tier: number, cell: Cell) {
    this.tier = tier;
    this.cell = cell;
    this.mesh = meshFactory.createGun(tier);
    this.baseY = GUN_BASE_HEIGHT + (tier - 1) * GUN_HEIGHT_PER_TIER;
    this.mesh.position.set(cell.x, this.baseY, cell.z);
    this.mesh.userData.kind = 'gun';
    this.mesh.userData.gunRef = this;

    this.pickVolume = new THREE.Mesh(
      new THREE.CylinderGeometry(PICK_RADIUS, PICK_RADIUS, PICK_HEIGHT, 24),
      new THREE.MeshBasicMaterial({
        transparent: true,
        opacity: 0,
        depthWrite: false,
        colorWrite: false,
      }),
    );
    this.pickVolume.position.y = PICK_HEIGHT * 0.28;
    this.mesh.add(this.pickVolume);

    this.hoverHalo = new THREE.Mesh(
      new THREE.SphereGeometry(CELL_SIZE * 0.5, 20, 14),
      new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0,
        depthWrite: false,
      }),
    );
    this.mesh.add(this.hoverHalo);

    this.tierBadge = this.createTierBadge(tier);
    this.tierBadge.position.y = TIER_BADGE_Y;
    this.mesh.add(this.tierBadge);
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
      } else if (object instanceof THREE.Sprite) {
        const material = object.material;
        material.map?.dispose();
        material.dispose();
      }
    });
  }

  private createTierBadge(tier: number): THREE.Sprite {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Unable to create tier badge canvas context');

    const accent = `#${TIER_COLOR[tier - 1].toString(16).padStart(6, '0')}`;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.shadowColor = 'rgba(0, 0, 0, 0.65)';
    ctx.shadowBlur = 12;
    ctx.fillStyle = 'rgba(16, 18, 30, 0.86)';
    ctx.beginPath();
    ctx.arc(64, 64, 43, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.lineWidth = 8;
    ctx.strokeStyle = accent;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = '700 58px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(tier), 64, 66);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;

    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: false,
      depthWrite: false,
    });

    const sprite = new THREE.Sprite(material);
    sprite.scale.set(TIER_BADGE_SIZE, TIER_BADGE_SIZE, 1);
    sprite.renderOrder = 20;
    return sprite;
  }
}
