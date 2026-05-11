import * as THREE from 'three';
import type { MeshFactory } from '../factories/MeshFactory';

const GRAVITY = 6;
const COIN_GRAVITY = 4.8;
const COIN_COLLECT_DELAY = 4;
const COIN_FLY_DURATION = 0.72;
const COIN_GROUND_Y = 0.12;
const COIN_SPIN_SPEED = 7.5;

interface Particle {
  mesh: THREE.Mesh;
  velocityX: number;
  velocityY: number;
  velocityZ: number;
  age: number;
  lifetime: number;
}

interface ClusterOptions {
  count: number;
  size: number;
  speedMin: number;
  speedMax: number;
  lifetimeMin: number;
  lifetimeMax: number;
}

interface DroppedCoin {
  object: THREE.Object3D;
  velocity: THREE.Vector3;
  age: number;
  settled: boolean;
  collectStart: THREE.Vector3;
  target: THREE.Vector3;
}

export class EffectsSystem {
  private readonly particles: Particle[] = [];
  private readonly coins: DroppedCoin[] = [];
  onCoinCollected: (() => void) | null = null;

  constructor(
    private readonly scene: THREE.Scene,
    private readonly meshFactory: MeshFactory,
  ) {}

  spawnBurst(x: number, y: number, z: number, color: number): void {
    this.spawnCluster(x, y, z, color, {
      count: 14,
      size: 0.07,
      speedMin: 1.5,
      speedMax: 3.5,
      lifetimeMin: 0.55,
      lifetimeMax: 0.75,
    });
  }

  spawnHitSpark(x: number, y: number, z: number, color: number): void {
    this.spawnCluster(x, y, z, color, {
      count: 6,
      size: 0.05,
      speedMin: 1.0,
      speedMax: 2.6,
      lifetimeMin: 0.35,
      lifetimeMax: 0.35,
    });
  }

  spawnCoins(x: number, y: number, z: number, count: number, target: THREE.Vector3): void {
    const safeCount = Math.max(0, Math.floor(count));
    for (let i = 0; i < safeCount; i++) {
      const object = this.meshFactory.createCoin();
      const angle = (i / Math.max(1, safeCount)) * Math.PI * 2 + Math.random() * 0.5;
      const radius = 0.2 + Math.random() * 0.35;
      const speed = 0.75 + Math.random() * 0.65;

      object.position.set(
        x + Math.cos(angle) * radius,
        Math.max(COIN_GROUND_Y, y * 0.35 + 0.28),
        z + Math.sin(angle) * radius,
      );
      object.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      this.scene.add(object);

      this.coins.push({
        object,
        velocity: new THREE.Vector3(
          Math.cos(angle) * speed,
          1.1 + Math.random() * 0.75,
          Math.sin(angle) * speed,
        ),
        age: 0,
        settled: false,
        collectStart: object.position.clone(),
        target: target.clone(),
      });
    }
  }

  update(dt: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];
      particle.age += dt;

      if (particle.age >= particle.lifetime) {
        this.disposeParticle(particle);
        this.particles.splice(i, 1);
        continue;
      }

      particle.velocityY -= GRAVITY * dt;
      particle.mesh.position.x += particle.velocityX * dt;
      particle.mesh.position.y += particle.velocityY * dt;
      particle.mesh.position.z += particle.velocityZ * dt;

      const lifeRatio = particle.age / particle.lifetime;
      (particle.mesh.material as THREE.MeshBasicMaterial).opacity = 1 - lifeRatio;
    }

    for (let i = this.coins.length - 1; i >= 0; i--) {
      const coin = this.coins[i];
      coin.age += dt;
      coin.object.rotation.y += COIN_SPIN_SPEED * dt;

      if (coin.age < COIN_COLLECT_DELAY) {
        this.updateDroppedCoin(coin, dt);
        continue;
      }

      const progress = Math.min(1, (coin.age - COIN_COLLECT_DELAY) / COIN_FLY_DURATION);
      if (progress >= 1) {
        this.disposeObject(coin.object);
        this.coins.splice(i, 1);
        this.onCoinCollected?.();
        continue;
      }

      if (progress === 0) coin.collectStart.copy(coin.object.position);

      const eased = 1 - Math.pow(1 - progress, 3);
      coin.object.position.lerpVectors(coin.collectStart, coin.target, eased);
      coin.object.position.y += Math.sin(progress * Math.PI) * 0.9;
    }
  }

  reset(): void {
    for (const particle of this.particles) this.disposeParticle(particle);
    this.particles.length = 0;
    for (const coin of this.coins) this.disposeObject(coin.object);
    this.coins.length = 0;
  }

  private updateDroppedCoin(coin: DroppedCoin, dt: number): void {
    if (coin.settled) {
      coin.object.position.y = COIN_GROUND_Y + Math.sin(coin.age * 4.5) * 0.025;
      coin.collectStart.copy(coin.object.position);
      return;
    }

    coin.velocity.y -= COIN_GRAVITY * dt;
    coin.object.position.addScaledVector(coin.velocity, dt);
    coin.collectStart.copy(coin.object.position);

    if (coin.object.position.y <= COIN_GROUND_Y) {
      coin.object.position.y = COIN_GROUND_Y;
      coin.velocity.set(0, 0, 0);
      coin.settled = true;
      coin.collectStart.copy(coin.object.position);
    }
  }

  private spawnCluster(
    x: number,
    y: number,
    z: number,
    color: number,
    options: ClusterOptions,
  ): void {
    for (let i = 0; i < options.count; i++) {
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(options.size, 6, 4),
        new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 1 }),
      );
      mesh.position.set(x, y, z);
      this.scene.add(mesh);

      const angle = Math.random() * Math.PI * 2;
      const speed = options.speedMin + Math.random() * (options.speedMax - options.speedMin);
      const lifetime = options.lifetimeMin + Math.random() * (options.lifetimeMax - options.lifetimeMin);

      this.particles.push({
        mesh,
        velocityX: Math.cos(angle) * speed,
        velocityY: 1.0 + Math.random() * 1.5,
        velocityZ: Math.sin(angle) * speed,
        age: 0,
        lifetime,
      });
    }
  }

  private disposeParticle(particle: Particle): void {
    this.scene.remove(particle.mesh);
    particle.mesh.geometry.dispose();
    (particle.mesh.material as THREE.Material).dispose();
  }

  private disposeObject(object: THREE.Object3D): void {
    this.scene.remove(object);
    object.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return;

      child.geometry.dispose();
      const material = child.material;
      if (Array.isArray(material)) material.forEach((item) => item.dispose());
      else material.dispose();
    });
  }
}
