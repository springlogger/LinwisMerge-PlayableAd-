import * as THREE from 'three';
import { Bullet } from '../entities/Bullet';
import type { Enemy } from '../entities/Enemy';
import type { Gun } from '../entities/Gun';
import type { MeshFactory } from '../factories/MeshFactory';
import type { EffectsSystem } from './EffectsSystem';
import type { GridSystem } from './GridSystem';
import type { SpawnSystem } from './SpawnSystem';
import type { UpgradeState } from '../types';
import {
  TIER_BULLET_SPEED,
  TIER_DAMAGE,
  TIER_FIRERATE,
  TIER_RANGE,
  UPGRADE_DAMAGE_PER_LEVEL,
  UPGRADE_SPEED_PER_LEVEL,
} from '../config';

const RECOIL_LIFT = 0.06;
const BULLET_HIT_RADIUS = 0.15;

export class CombatSystem {
  readonly bullets: Bullet[] = [];
  onKill: (enemy: Enemy) => void = () => {};
  onShoot: () => void = () => {};

  private readonly tmpDirection = new THREE.Vector3();
  private readonly tmpAim = new THREE.Vector3();

  constructor(
    private readonly meshFactory: MeshFactory,
    private readonly scene: THREE.Scene,
    private readonly camera: THREE.Camera,
    private readonly grid: GridSystem,
    private readonly spawn: SpawnSystem,
    private readonly effects: EffectsSystem,
    private readonly upgrades: UpgradeState,
  ) {}

  update(dt: number, t: number): void {
    this.tickGuns(t);
    this.tickBullets(dt);
    for (const enemy of this.spawn.enemies) enemy.updateHpBar(this.camera);
  }

  reset(): void {
    while (this.bullets.length) this.removeBullet(0);
  }

  private tickGuns(t: number): void {
    const fireRateMul = 1 + UPGRADE_SPEED_PER_LEVEL * this.upgrades.speed;
    for (const gun of this.grid.guns) {
      const fireRate = TIER_FIRERATE[gun.tier - 1] * fireRateMul;
      const cooldown = 1 / fireRate;
      if (t - gun.lastShotTime < cooldown) continue;

      const target = this.findNearestEnemy(gun, TIER_RANGE[gun.tier - 1]);
      if (!target) continue;

      this.fire(gun, target);
      gun.lastShotTime = t;

      this.tmpAim.copy(target.mesh.position);
      this.tmpAim.y = gun.mesh.position.y;
      gun.mesh.lookAt(this.tmpAim);
      gun.mesh.position.y = gun.baseY + RECOIL_LIFT;
    }
  }

  private findNearestEnemy(gun: Gun, range: number): Enemy | null {
    let nearest: Enemy | null = null;
    let bestDistance = range;
    for (const enemy of this.spawn.enemies) {
      if (enemy.isDying) continue;
      const distance = gun.mesh.position.distanceTo(enemy.mesh.position);
      if (distance < bestDistance) {
        bestDistance = distance;
        nearest = enemy;
      }
    }
    return nearest;
  }

  private fire(gun: Gun, target: Enemy): void {
    this.onShoot();
    const mesh = this.meshFactory.createBullet(gun.tier);
    mesh.position.copy(gun.mesh.position);
    this.scene.add(mesh);
    const damage = TIER_DAMAGE[gun.tier - 1] * (1 + UPGRADE_DAMAGE_PER_LEVEL * this.upgrades.damage);
    this.bullets.push(
      new Bullet(
        mesh,
        target,
        damage,
        TIER_BULLET_SPEED[gun.tier - 1],
      ),
    );
  }

  private tickBullets(dt: number): void {
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const bullet = this.bullets[i];

      const targetGone = this.spawn.enemies.indexOf(bullet.target) === -1 || bullet.target.isDying;
      if (targetGone) {
        this.removeBullet(i);
        continue;
      }

      this.tmpDirection.copy(bullet.target.mesh.position).sub(bullet.mesh.position);
      const distance = this.tmpDirection.length();
      const stepDistance = bullet.speed * dt;

      if (distance <= stepDistance + BULLET_HIT_RADIUS) {
        this.applyHit(bullet);
        this.removeBullet(i);
      } else {
        this.tmpDirection.normalize().multiplyScalar(stepDistance);
        bullet.mesh.position.add(this.tmpDirection);
      }
    }
  }

  private applyHit(bullet: Bullet): void {
    const enemy = bullet.target;
    enemy.hp -= bullet.damage;

    const sparkColor = (bullet.mesh.material as THREE.MeshBasicMaterial).color.getHex();
    this.effects.spawnHitSpark(
      enemy.mesh.position.x,
      enemy.mesh.position.y,
      enemy.mesh.position.z,
      sparkColor,
    );

    if (enemy.hp <= 0) this.killEnemy(enemy);
    else enemy.playHit();
  }

  private killEnemy(enemy: Enemy): void {
    if (enemy.isDying) return;
    this.effects.spawnBurst(
      enemy.mesh.position.x,
      enemy.mesh.position.y,
      enemy.mesh.position.z,
      0xffffff,
    );
    enemy.playDeath();
    this.onKill(enemy);
  }

  private removeBullet(index: number): void {
    const bullet = this.bullets[index];
    this.scene.remove(bullet.mesh);
    bullet.dispose();
    this.bullets.splice(index, 1);
  }
}
