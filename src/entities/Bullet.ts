import * as THREE from 'three';
import type { Enemy } from './Enemy';

export class Bullet {
  readonly mesh: THREE.Mesh;
  target: Enemy;
  damage: number;
  speed: number;

  constructor(mesh: THREE.Mesh, target: Enemy, damage: number, speed: number) {
    this.mesh = mesh;
    this.target = target;
    this.damage = damage;
    this.speed = speed;
  }

  dispose(): void {
    this.mesh.geometry.dispose();
    const material = this.mesh.material;
    if (Array.isArray(material)) material.forEach((m) => m.dispose());
    else material.dispose();
  }
}
