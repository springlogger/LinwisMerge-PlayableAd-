import * as THREE from 'three';
import type { MeshFactory } from '../factories/MeshFactory';

const HP_BAR_WIDTH = 0.72;
const IDLE_BOB_SPEED = 2.4;
const IDLE_BOB_HEIGHT = 0.05;
const FALLBACK_SPIN_SPEED = 0.6;

export class Hero {
  readonly group = new THREE.Group();

  private readonly mesh: THREE.Object3D;
  private readonly hpBarBg: THREE.Mesh;
  private readonly hpBarFg: THREE.Mesh;
  private readonly baseY: number;
  private readonly mixer: THREE.AnimationMixer | null = null;
  private readonly actions = new Map<string, THREE.AnimationAction>();
  private idleAction: THREE.AnimationAction | null = null;
  private isDead = false;

  constructor(meshFactory: MeshFactory) {
    this.mesh = meshFactory.createHero();
    this.baseY = meshFactory.getHeroSize() / 2 + 0.18;
    this.mesh.position.y = this.baseY;
    this.group.add(this.mesh);
    this.group.position.set(0, 0, 0);

    const barY = meshFactory.getHeroSize() + 0.35;
    this.hpBarBg = new THREE.Mesh(
      new THREE.PlaneGeometry(0.78, 0.085),
      new THREE.MeshBasicMaterial({
        color: 0x000000,
        transparent: true,
        opacity: 0.6,
        depthWrite: false,
      }),
    );
    this.hpBarFg = new THREE.Mesh(
      new THREE.PlaneGeometry(HP_BAR_WIDTH, 0.055),
      new THREE.MeshBasicMaterial({ color: 0xff4d00, depthWrite: false }),
    );
    this.hpBarBg.position.y = barY;
    this.hpBarFg.position.y = barY;
    this.hpBarFg.position.z = 0.001;
    this.group.add(this.hpBarBg);
    this.group.add(this.hpBarFg);

    this.mixer = this.createMixer();
    this.playIdle();
  }

  update(dt: number, t: number, camera?: THREE.Camera): void {
    this.mixer?.update(dt);
    if (camera) {
      this.hpBarBg.lookAt(camera.position);
      this.hpBarFg.lookAt(camera.position);
    }

    if (this.mixer) return;

    this.mesh.position.y = this.baseY + Math.sin(t * IDLE_BOB_SPEED) * IDLE_BOB_HEIGHT;
    this.mesh.rotation.y += dt * FALLBACK_SPIN_SPEED;
  }

  setHealth(current: number, max: number): void {
    const ratio = Math.max(0, Math.min(1, current / max));
    this.hpBarFg.scale.x = ratio;
    this.hpBarFg.position.x = -(HP_BAR_WIDTH * (1 - ratio)) / 2;
  }

  playHit(): void {
    if (this.isDead) return;
    const action = this.findAction(['hit', 'hurt', 'damage', 'react']);
    if (!action) return;

    action.reset();
    action.setLoop(THREE.LoopOnce, 1);
    action.clampWhenFinished = false;
    action.fadeIn(0.04).play();
  }

  playDeath(): void {
    if (this.isDead) return;
    this.isDead = true;

    this.idleAction?.fadeOut(0.12);

    const action = this.findAction(['die', 'death']);
    if (!action) return;

    action.reset();
    action.setLoop(THREE.LoopOnce, 1);
    action.clampWhenFinished = true;
    action.timeScale = 1;
    action.fadeIn(0.08).play();
  }

  reset(): void {
    this.isDead = false;
    for (const action of this.actions.values()) action.stop();
    this.playIdle();
  }

  private createMixer(): THREE.AnimationMixer | null {
    if (this.mesh.animations.length === 0) return null;

    const mixer = new THREE.AnimationMixer(this.mesh);
    for (const clip of this.mesh.animations) {
      this.actions.set(clip.name, mixer.clipAction(clip));
    }
    return mixer;
  }

  private playIdle(): void {
    const action = this.findAction(['idle']);
    if (!action) return;

    action.reset();
    action.setLoop(THREE.LoopRepeat, Infinity);
    action.timeScale = 0.88;
    action.fadeIn(0.12).play();
    this.idleAction = action;
  }

  private findAction(keywords: string[]): THREE.AnimationAction | null {
    for (const [clipName, action] of this.actions) {
      const normalized = clipName.toLowerCase();
      if (keywords.some((keyword) => normalized.includes(keyword))) return action;
    }
    return null;
  }
}
