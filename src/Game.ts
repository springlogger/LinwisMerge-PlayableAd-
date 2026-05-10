import * as THREE from 'three';
import { SceneSetup } from './scene/SceneSetup';
import { MeshFactory } from './factories/MeshFactory';
import { Hero } from './entities/Hero';
import { GridSystem } from './systems/GridSystem';
import { SpawnSystem } from './systems/SpawnSystem';
import { CombatSystem } from './systems/CombatSystem';
import { EffectsSystem } from './systems/EffectsSystem';
import { InputSystem } from './systems/InputSystem';
import { HUD } from './ui/HUD';
import { Menu } from './ui/menu';
import type { Enemy } from './entities/Enemy';
import type { GameState, UpgradeKind, UpgradeState } from './types';
import {
  BASE_GUN_COST,
  BOSS_KILL_REWARD,
  GUN_COST_GROWTH,
  GUN_SLOT_COUNT,
  HERO_MAX_HP,
  KILL_REWARD_BASE,
  KILL_REWARD_PER_TIER,
  KILL_REWARD_PER_WAVE,
  STARTING_MONEY,
  TIER_DAMAGE,
  UPGRADE_BASE_COST,
  UPGRADE_COST_GROWTH,
  UPGRADE_HP_PER_LEVEL,
} from './config';

const UPGRADE_KINDS: readonly UpgradeKind[] = ['damage', 'speed', 'hp'];

const STARTING_GUN_COUNT = 2;
const MAX_FRAME_DT = 0.05;

export class Game {
  private readonly clock = new THREE.Clock();

  private readonly sceneSetup: SceneSetup;
  private readonly meshFactory: MeshFactory;
  private readonly effects: EffectsSystem;
  private readonly grid: GridSystem;
  private readonly spawn: SpawnSystem;
  private readonly combat: CombatSystem;
  private readonly input: InputSystem;
  private readonly hud: HUD;
  private readonly menu: Menu;
  private hero!: Hero;

  private kills = 0;
  private money = STARTING_MONEY;
  private boughtGuns = 0;
  private heroHp = HERO_MAX_HP;
  private state: GameState = 'playing';
  private readonly upgrades: UpgradeState = { damage: 0, speed: 0, hp: 0 };

  constructor(container: HTMLElement) {
    this.sceneSetup = new SceneSetup(container);
    this.meshFactory = new MeshFactory();

    this.effects = new EffectsSystem(this.sceneSetup.scene);
    this.grid = new GridSystem(this.meshFactory, this.sceneSetup.scene, this.effects);
    this.spawn = new SpawnSystem(this.meshFactory, this.sceneSetup.scene);
    this.combat = new CombatSystem(
      this.meshFactory,
      this.sceneSetup.scene,
      this.sceneSetup.camera,
      this.grid,
      this.spawn,
      this.effects,
      this.upgrades,
    );
    this.input = new InputSystem(
      this.sceneSetup.renderer.domElement,
      this.sceneSetup.camera,
      this.grid,
    );

    this.spawn.onWaveStarted = (wave) => {
      this.hud.setWave(wave);
      this.hud.showWaveNotice(wave);
    };
    this.spawn.onEnemyReachedCenter = (enemy) => this.onEnemyReachedCenter(enemy);
    this.combat.onKill = (enemy) => this.onEnemyKilled(enemy);
    this.input.isInputBlocked = () => this.state !== 'playing';

    this.hud = new HUD(container, {
      onBuy: () => this.buyGun(),
      onReset: () => this.reset(),
      onPause: () => this.pause(),
      onUpgrade: (kind) => this.buyUpgrade(kind),
    });

    this.menu = new Menu(container, {
      onPlay: () => this.start(),
    });
  }

  async init(): Promise<void> {
    await this.meshFactory.loadModels();
    this.hero = new Hero(this.meshFactory);
    this.sceneSetup.scene.add(this.hero.group);
    this.reset();
    this.sceneSetup.render();
  }

  start(): void {
    const tick = (): void => {
      requestAnimationFrame(tick);
      const dt = Math.min(this.clock.getDelta(), MAX_FRAME_DT);
      const t = this.clock.getElapsedTime();
      this.update(dt, t);
      this.sceneSetup.render();
    };
    tick();
  }

  private update(dt: number, t: number): void {
    if (this.state === 'paused') return;

    if (this.state !== 'playing') {
      this.effects.update(dt);
      this.hero.update(dt, t, this.sceneSetup.camera);
      return;
    }

    this.spawn.update(dt);
    if (this.state !== 'playing') return;

    this.grid.update(dt);
    this.combat.update(dt, t);
    this.effects.update(dt);
    this.hero.update(dt, t, this.sceneSetup.camera);

    if (this.spawn.allWavesCleared) {
      this.handleVictory();
      return;
    }

    this.hud.setWave(this.spawn.wave);
    this.hud.setGunCount(this.grid.guns.length);
    this.syncEconomyHud();
  }

  private buyGun(): void {
    if (this.state !== 'playing') return;

    const cost = this.gunCost();
    if (this.money < cost) return;

    const gun = this.grid.buyGun();
    if (!gun) return;

    this.money -= cost;
    this.boughtGuns++;
    this.hud.setGunCount(this.grid.guns.length);
    this.syncEconomyHud();
  }

  private buyUpgrade(kind: UpgradeKind): void {
    if (this.state !== 'playing') return;

    const cost = this.upgradeCost(kind);
    if (this.money < cost) return;

    this.money -= cost;
    this.upgrades[kind]++;

    if (kind === 'hp') {
      const max = this.heroMaxHp();
      this.heroHp = Math.min(this.heroHp + UPGRADE_HP_PER_LEVEL, max);
      this.hud.setHealth(this.heroHp, max);
      this.hero.setHealth(this.heroHp, max);
    }

    this.syncUpgradeHud();
    this.syncEconomyHud();
  }

  private pause(): void {
    this.state = 'paused';
    this.syncEconomyHud();
    this.menu.showPauseMenu({
      onContinue: () => {
        this.state = 'playing';
        this.syncEconomyHud();
      },
    });
  }

  private onEnemyKilled(enemy: Enemy): void {
    this.kills++;
    this.money += this.killReward(enemy);
    this.hud.setKills(this.kills);
    this.syncEconomyHud();
  }

  private onEnemyReachedCenter(enemy: Enemy): void {
    if (this.state !== 'playing') return;

    const max = this.heroMaxHp();
    this.heroHp = Math.max(0, this.heroHp - this.enemyDamage(enemy));
    this.hud.setHealth(this.heroHp, max);
    this.hero.setHealth(this.heroHp, max);

    if (this.heroHp <= 0) this.handleDefeat();
    else this.hero.playHit();
  }

  private handleVictory(): void {
    this.state = 'won';
    this.syncEconomyHud();
    this.hud.showVictory();
  }

  private handleDefeat(): void {
    this.state = 'lost';
    this.syncEconomyHud();
    this.hero.playDeath();
    this.hud.showDefeat();
  }

  private reset(): void {
    this.grid.reset();
    this.spawn.reset();
    this.combat.reset();
    this.effects.reset();
    this.hero.reset();

    this.kills = 0;
    this.money = STARTING_MONEY;
    this.boughtGuns = 0;
    this.upgrades.damage = 0;
    this.upgrades.speed = 0;
    this.upgrades.hp = 0;
    this.heroHp = HERO_MAX_HP;
    this.state = 'playing';

    const max = this.heroMaxHp();
    this.hud.setKills(0);
    this.hud.setHealth(this.heroHp, max);
    this.hero.setHealth(this.heroHp, max);
    this.hud.setWave(1);
    this.hud.setGunCount(0);
    this.hud.hideStatus();
    this.hud.closeUpgradePanel();

    for (let i = 0; i < STARTING_GUN_COUNT; i++) this.grid.buyGun();
    this.hud.setGunCount(this.grid.guns.length);
    this.syncUpgradeHud();
    this.syncEconomyHud();
  }

  private gunCost(): number {
    return BASE_GUN_COST + this.boughtGuns * GUN_COST_GROWTH;
  }

  private upgradeCost(kind: UpgradeKind): number {
    return UPGRADE_BASE_COST + this.upgrades[kind] * UPGRADE_COST_GROWTH;
  }

  private heroMaxHp(): number {
    return HERO_MAX_HP + this.upgrades.hp * UPGRADE_HP_PER_LEVEL;
  }

  private syncUpgradeHud(): void {
    for (const kind of UPGRADE_KINDS) {
      this.hud.setUpgradeLevel(kind, this.upgrades[kind]);
      this.hud.setUpgradeCost(kind, this.upgradeCost(kind));
    }
  }

  private killReward(enemy: Enemy): number {
    if (enemy.isBoss) return BOSS_KILL_REWARD;

    const waveBonus = (this.spawn.wave - 1) * KILL_REWARD_PER_WAVE;
    const tierBonus = enemy.tierIdx * KILL_REWARD_PER_TIER;
    return KILL_REWARD_BASE + waveBonus + tierBonus;
  }

  private enemyDamage(enemy: Enemy): number {
    return TIER_DAMAGE[enemy.tierIdx] ?? TIER_DAMAGE[TIER_DAMAGE.length - 1];
  }

  private syncEconomyHud(): void {
    const cost = this.gunCost();
    const canAfford = this.money >= cost;
    const hasFreeSlot = this.grid.guns.length < GUN_SLOT_COUNT;

    this.hud.setMoney(this.money);
    this.hud.setBuyCost(cost);
    this.hud.setBuyEnabled(this.state === 'playing' && canAfford && hasFreeSlot);

    for (const kind of UPGRADE_KINDS) {
      const enabled = this.state === 'playing' && this.money >= this.upgradeCost(kind);
      this.hud.setUpgradeEnabled(kind, enabled);
    }
  }
}
