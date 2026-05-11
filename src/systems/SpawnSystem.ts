import * as THREE from 'three';
import { Enemy } from '../entities/Enemy';
import type { MeshFactory } from '../factories/MeshFactory';
import {
  BOSS_HP,
  BOSS_SPEED,
  ENEMY_REACH_RADIUS,
  ENEMY_GOAL_X,
  ENEMY_GOAL_Z,
  ENEMY_SPAWN_INTERVAL,
  ENEMY_SPAWN_RADIUS,
  MAX_ENEMIES,
  TIER_HP,
  TOTAL_WAVES,
  WAVE_ENEMY_GROUPS,
  WAVE_NOTICE_CLEAR_MS,
  WAVE_POST_NOTICE_DELAY,
} from '../config';

const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));
const ENEMY_BASE_SPEED = 0.9;
const ENEMY_SPEED_RANDOM_RANGE = 0.26;
const ENEMY_SPEED_PER_TIER = 0.04;
const ENEMY_MIN_SPEED = 0.68;
const ENEMY_GROUND_OFFSET = 0.18;
const SPAWN_ARC_CENTER = -Math.PI / 2;
const SPAWN_ARC_WIDTH = Math.PI * 0.55;

type QueuedEnemy = {
  tier: number;
  isBoss: boolean;
};

export class SpawnSystem {
  readonly enemies: Enemy[] = [];
  wave = 1;
  onWaveStarted: (wave: number) => void = () => {};
  onEnemyReachedCenter: (enemy: Enemy) => void = () => {};

  private elapsed = 0;
  private lastSpawnTime = 0;
  private spawnedInWave = 0;
  private waveQueue: QueuedEnemy[] = [];
  private isWaitingForNextWave = false;
  private waveNoticeRemaining = 0;
  private waveIntroRemaining = 0;
  private pendingWave: number | null = null;

  constructor(
    private readonly meshFactory: MeshFactory,
    private readonly scene: THREE.Scene,
  ) {}

  update(dt: number): void {
    this.elapsed += dt;

    this.tickWaveIntro(dt);
    this.maybeSpawnNextEnemy();

    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      if (enemy.step(dt, ENEMY_REACH_RADIUS, ENEMY_GOAL_X, ENEMY_GOAL_Z)) {
        this.onEnemyReachedCenter(enemy);
        this.remove(enemy);
        continue;
      }
      if (enemy.isDeathFinished()) this.remove(enemy);
    }

    this.queueNextWaveIfCleared();
  }

  get allWavesCleared(): boolean {
    return !this.isWaitingForNextWave && this.wave >= TOTAL_WAVES && this.waveFullySpawned && this.livingEnemies === 0;
  }

  remove(enemy: Enemy): void {
    this.scene.remove(enemy.mesh);
    enemy.dispose();
    const i = this.enemies.indexOf(enemy);
    if (i >= 0) this.enemies.splice(i, 1);
  }

  reset(): void {
    while (this.enemies.length) this.remove(this.enemies[0]);
    this.elapsed = 0;
    this.lastSpawnTime = 0;
    this.spawnedInWave = 0;
    this.waveQueue = [];
    this.isWaitingForNextWave = false;
    this.waveNoticeRemaining = 0;
    this.waveIntroRemaining = 0;
    this.pendingWave = null;
    this.wave = 1;
    this.scheduleWave(1);
  }

  private get waveFullySpawned(): boolean {
    return this.spawnedInWave >= this.waveQueue.length;
  }

  private get livingEnemies(): number {
    return this.enemies.filter((enemy) => !enemy.isDying).length;
  }

  private tickWaveIntro(dt: number): void {
    if (!this.isWaitingForNextWave) return;

    if (this.waveNoticeRemaining > 0) {
      this.waveNoticeRemaining = Math.max(0, this.waveNoticeRemaining - dt);
      return;
    }

    this.waveIntroRemaining = Math.max(0, this.waveIntroRemaining - dt);
    if (this.waveIntroRemaining > 0) return;

    const nextWave = this.pendingWave ?? this.wave + 1;
    this.pendingWave = null;
    this.startWave(nextWave);
  }

  private maybeSpawnNextEnemy(): void {
    if (this.isWaitingForNextWave || this.waveFullySpawned) return;
    if (this.enemies.length >= MAX_ENEMIES) return;
    if (this.elapsed - this.lastSpawnTime <= ENEMY_SPAWN_INTERVAL) return;

    const next = this.waveQueue[this.spawnedInWave];
    this.spawnEnemy(next.tier, next.isBoss);
    this.spawnedInWave++;
    this.lastSpawnTime = this.elapsed;
  }

  private queueNextWaveIfCleared(): void {
    if (this.isWaitingForNextWave || !this.waveFullySpawned) return;
    if (this.livingEnemies > 0) return;
    if (this.wave >= TOTAL_WAVES) return;

    this.scheduleWave(this.wave + 1);
  }

  private scheduleWave(wave: number): void {
    this.pendingWave = wave;
    this.wave = wave;
    this.isWaitingForNextWave = true;
    this.waveNoticeRemaining = WAVE_NOTICE_CLEAR_MS / 1000;
    this.waveIntroRemaining = WAVE_POST_NOTICE_DELAY;
    this.onWaveStarted(wave);
  }

  private startWave(wave: number): void {
    this.wave = wave;
    this.waveQueue = this.buildWaveQueue(wave);
    this.spawnedInWave = 0;
    this.isWaitingForNextWave = false;
    this.waveNoticeRemaining = 0;
    this.waveIntroRemaining = 0;
    this.lastSpawnTime = this.elapsed - ENEMY_SPAWN_INTERVAL;
  }

  private buildWaveQueue(wave: number): QueuedEnemy[] {
    const groups = WAVE_ENEMY_GROUPS[wave - 1] ?? [];
    const queue: QueuedEnemy[] = [];

    for (const group of groups) {
      for (let i = 0; i < group.count; i++) {
        queue.push({
          tier: group.tier,
          isBoss: group.isBoss === true,
        });
      }
    }
    return queue;
  }

  private spawnEnemy(tier: number, isBoss: boolean): void {
    const tierIdx = Math.max(0, tier - 1);
    const baseHp = TIER_HP[tierIdx] ?? TIER_HP[TIER_HP.length - 1];
    const hp = isBoss ? BOSS_HP : baseHp;
    const speed = isBoss ? BOSS_SPEED : this.rollEnemySpeed(tierIdx);

    const angle = this.spreadSpawnAngle();
    const size = this.meshFactory.getEnemySize(tierIdx, isBoss);
    const position = new THREE.Vector3(
      ENEMY_GOAL_X + Math.cos(angle) * ENEMY_SPAWN_RADIUS,
      size / 2 + ENEMY_GROUND_OFFSET,
      ENEMY_GOAL_Z + Math.sin(angle) * ENEMY_SPAWN_RADIUS,
    );

    const enemy = new Enemy(this.meshFactory, tierIdx, hp, speed, position, { isBoss });
    this.scene.add(enemy.mesh);
    this.enemies.push(enemy);
  }

  private rollEnemySpeed(tierIdx: number): number {
    const random = Math.random() * ENEMY_SPEED_RANDOM_RANGE;
    return Math.max(ENEMY_MIN_SPEED, ENEMY_BASE_SPEED + random - tierIdx * ENEMY_SPEED_PER_TIER);
  }

  private spreadSpawnAngle(): number {
    const spread = (this.spawnedInWave * GOLDEN_ANGLE + this.wave * 0.17) % 1;
    return SPAWN_ARC_CENTER + (spread - 0.5) * SPAWN_ARC_WIDTH;
  }
}
