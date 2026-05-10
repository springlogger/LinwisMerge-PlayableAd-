import * as THREE from 'three';

const GRAVITY = 6;

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

export class EffectsSystem {
  private readonly particles: Particle[] = [];

  constructor(private readonly scene: THREE.Scene) {}

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
  }

  reset(): void {
    for (const particle of this.particles) this.disposeParticle(particle);
    this.particles.length = 0;
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
}
