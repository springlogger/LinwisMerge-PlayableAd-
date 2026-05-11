import * as THREE from 'three';
import type { MeshFactory } from '../factories/MeshFactory';

const RUN_ANIMATION_SPEED_THRESHOLD = 1.05;

type EnemyOptions = {
  isBoss?: boolean;
};

export class Enemy {
  readonly mesh: THREE.Object3D;
  readonly hpBarBg: THREE.Mesh;
  readonly hpBarFg: THREE.Mesh;

  hp: number;
  readonly maxHp: number;
  readonly speed: number;
  readonly tierIdx: number;
  readonly size: number;
  readonly isBoss: boolean;
  isDying = false;

  private readonly mixer: THREE.AnimationMixer | null = null;
  private readonly actions = new Map<string, THREE.AnimationAction>();
  private movementAction: THREE.AnimationAction | null = null;
  private deathElapsed = 0;
  private deathDuration = 0.8;
  private readonly hpBarWidth: number;

  constructor(
    meshFactory: MeshFactory,
    tierIdx: number,
    hp: number,
    speed: number,
    spawnPos: THREE.Vector3,
    options: EnemyOptions = {},
  ) {
    const isBoss = options.isBoss === true;
    this.isBoss = isBoss;
    this.tierIdx = tierIdx;
    this.hp = hp;
    this.maxHp = hp;
    this.speed = speed;
    this.size = meshFactory.getEnemySize(tierIdx, isBoss);
    this.hpBarWidth = isBoss ? 1.0 : 0.66;

    this.mesh = meshFactory.createEnemy(tierIdx, isBoss);
    this.mesh.position.copy(spawnPos);
    this.mesh.userData.kind = 'enemy';
    this.mesh.userData.enemyRef = this;
    this.mixer = this.createMixer();

    const barHeight = isBoss ? 0.075 : 0.05;
    const bgWidth = isBoss ? 1.08 : 0.7;
    const bgHeight = isBoss ? 0.11 : 0.08;

    this.hpBarBg = new THREE.Mesh(
      new THREE.PlaneGeometry(bgWidth, bgHeight),
      new THREE.MeshBasicMaterial({
        color: 0x000000,
        transparent: true,
        opacity: 0.6,
        depthWrite: false,
      }),
    );
    this.hpBarFg = new THREE.Mesh(
      new THREE.PlaneGeometry(this.hpBarWidth, barHeight),
      new THREE.MeshBasicMaterial({ color: 0x5dff8a, depthWrite: false }),
    );
    this.hpBarBg.position.y = this.size + 0.2;
    this.hpBarFg.position.y = this.size + 0.2;
    this.hpBarFg.position.z = 0.001;
    this.mesh.add(this.hpBarBg);
    this.mesh.add(this.hpBarFg);

    this.playMovement();
  }

  /** Walk toward the defended goal. Returns true once the enemy reaches it. */
  step(dt: number, reachRadius: number, targetX = 0, targetZ = 0): boolean {
    this.mixer?.update(dt);
    if (this.isDying) {
      this.deathElapsed += dt;
      return false;
    }

    const position = this.mesh.position;
    const toCenterX = targetX - position.x;
    const toCenterZ = targetZ - position.z;
    const distance = Math.hypot(toCenterX, toCenterZ);
    if (distance <= reachRadius) return true;

    position.x += (toCenterX / distance) * this.speed * dt;
    position.z += (toCenterZ / distance) * this.speed * dt;
    this.mesh.lookAt(targetX, position.y, targetZ);
    return false;
  }

  playHit(): void {
    if (this.isDying) return;
    const action = this.findAction(['hit', 'hurt', 'damage', 'react', 'emote-no']);
    if (!action) return;

    action.reset();
    action.setLoop(THREE.LoopOnce, 1);
    action.clampWhenFinished = false;
    action.fadeIn(0.04).play();
  }

  playDeath(): void {
    if (this.isDying) return;

    this.isDying = true;
    this.hpBarBg.visible = false;
    this.hpBarFg.visible = false;
    this.deathElapsed = 0;

    this.movementAction?.fadeOut(0.08);

    const action = this.findAction(['die', 'death']);
    if (!action) return;

    action.reset();
    action.setLoop(THREE.LoopOnce, 1);
    action.clampWhenFinished = true;
    action.fadeIn(0.05).play();
    this.deathDuration = Math.max(0.4, action.getClip().duration);
  }

  isDeathFinished(): boolean {
    return this.isDying && this.deathElapsed >= this.deathDuration;
  }

  updateHpBar(camera: THREE.Camera): void {
    if (this.isDying) return;
    this.hpBarBg.lookAt(camera.position);
    this.hpBarFg.lookAt(camera.position);

    const ratio = Math.max(0, this.hp / this.maxHp);
    this.hpBarFg.scale.x = ratio;
    this.hpBarFg.position.x = -(this.hpBarWidth * (1 - ratio)) / 2;
  }

  dispose(): void {
    this.mesh.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      object.geometry.dispose();
      const material = object.material;
      if (Array.isArray(material)) material.forEach((m) => m.dispose());
      else material.dispose();
    });
  }

  private createMixer(): THREE.AnimationMixer | null {
    if (this.mesh.animations.length === 0) return null;

    const mixer = new THREE.AnimationMixer(this.mesh);
    for (const clip of this.mesh.animations) {
      this.actions.set(clip.name, mixer.clipAction(clip));
    }
    return mixer;
  }

  private playMovement(): void {
    const isFast = this.speed > RUN_ANIMATION_SPEED_THRESHOLD;
    const action = isFast
      ? this.findAction(['run', 'sprint', 'walk'])
      : this.findAction(['walk', 'run', 'sprint', 'idle']);
    if (!action) return;

    action.reset();
    action.setLoop(THREE.LoopRepeat, Infinity);
    action.fadeIn(0.12).play();
    this.movementAction = action;
  }

  private findAction(keywords: string[]): THREE.AnimationAction | null {
    for (const keyword of keywords) {
      for (const [clipName, action] of this.actions) {
        if (clipName.toLowerCase().includes(keyword)) return action;
      }
    }
    return null;
  }
}
