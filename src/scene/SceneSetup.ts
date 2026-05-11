import * as THREE from 'three';
import { CAMERA_FOV, CAMERA_LOOK_AT, CAMERA_POS } from '../config';
import type { GraveyardPropName, MeshFactory } from '../factories/MeshFactory';

const ARENA_FIT_RADIUS = 5.05;
const MAX_CAMERA_SCALE = 1.7;
const BASE_CAMERA_DISTANCE = Math.hypot(...CAMERA_POS);
const FOG_NEAR_CAMERA_OFFSET = 1;
const FOG_FAR_CAMERA_OFFSET = 22;
const MIN_VIEWPORT_WIDTH = 1;
const MIN_VIEWPORT_HEIGHT = 1;
const GRASS_COLOR = 0x405f38;
const GRASS_BLADE_COLOR = 0x5f8545;
const GRAVEL_COLOR = 0x746b5d;
const GROUND_WIDTH = 64;
const GROUND_DEPTH = 88;
const GROUND_Z = 12;
const FRONT_GRASS_START_INDEX = 360;
const GRASS_TUFT_COUNT = 520;

type GraveyardPropPlacement = {
  name: GraveyardPropName;
  x: number;
  z: number;
  scale: number;
  rotation?: number;
};

const GRAVEYARD_PROPS: readonly GraveyardPropPlacement[] = [
  { name: 'fenceGate', x: 0, z: -4.75, scale: 2.3, rotation: Math.PI },
  { name: 'fenceBorder', x: -4.85, z: -2.6, scale: 2.05, rotation: Math.PI * 0.5 },
  { name: 'fenceBorder', x: 4.85, z: -2.6, scale: 2.05, rotation: -Math.PI * 0.5 },
  { name: 'fenceColumn', x: -4.1, z: -4.8, scale: 0.85 },
  { name: 'fenceColumn', x: 4.1, z: -4.8, scale: 0.85 },
  { name: 'cryptSmall', x: -4.2, z: -3.6, scale: 1.5, rotation: Math.PI * 0.18 },
  { name: 'cryptLarge', x: 4.35, z: -3.75, scale: 1.75, rotation: -Math.PI * 0.12 },
  { name: 'pine', x: -5.6, z: -1.2, scale: 3.1, rotation: Math.PI * 0.1 },
  { name: 'pineCrooked', x: 5.55, z: -1.25, scale: 2.9, rotation: -Math.PI * 0.2 },
  { name: 'pine', x: -5.2, z: 2.65, scale: 2.6, rotation: -Math.PI * 0.08 },
  { name: 'trunk', x: 4.65, z: 2.85, scale: 1.3, rotation: Math.PI * 0.6 },
  { name: 'lightpost', x: -3.2, z: -3.25, scale: 1.45, rotation: Math.PI * 0.16 },
  { name: 'lightpost', x: 3.25, z: -3.1, scale: 1.45, rotation: -Math.PI * 0.16 },
  { name: 'grave', x: -3.85, z: 0.9, scale: 1.25, rotation: Math.PI * 0.16 },
  { name: 'grave', x: 3.65, z: 0.6, scale: 1.15, rotation: -Math.PI * 0.12 },
  { name: 'gravestoneCross', x: -3.0, z: 2.35, scale: 0.9, rotation: Math.PI * 0.14 },
  { name: 'gravestoneRound', x: 3.0, z: 2.2, scale: 0.85, rotation: -Math.PI * 0.12 },
  { name: 'gravestoneBroken', x: -4.15, z: -0.3, scale: 0.85, rotation: -Math.PI * 0.04 },
  { name: 'rocks', x: 4.15, z: -0.2, scale: 1.0, rotation: Math.PI * 0.2 },
  { name: 'pumpkinCarved', x: -2.35, z: 3.65, scale: 0.75, rotation: Math.PI * 0.3 },
  { name: 'pumpkin', x: 2.2, z: 3.75, scale: 0.7, rotation: -Math.PI * 0.18 },
  { name: 'pine', x: -8.45, z: -5.25, scale: 3.6, rotation: Math.PI * 0.08 },
  { name: 'pineCrooked', x: 8.35, z: -5.15, scale: 3.35, rotation: -Math.PI * 0.18 },
  { name: 'pine', x: -1.3, z: -8.6, scale: 3.0, rotation: Math.PI * 0.04 },
  { name: 'pineCrooked', x: 1.55, z: -8.8, scale: 2.75, rotation: -Math.PI * 0.08 },
  { name: 'pine', x: -6.8, z: -7.2, scale: 3.25, rotation: Math.PI * 0.22 },
  { name: 'pineCrooked', x: 6.95, z: -7.05, scale: 3.05, rotation: -Math.PI * 0.28 },
  { name: 'pine', x: -8.1, z: 0.95, scale: 2.7, rotation: -Math.PI * 0.08 },
  { name: 'pineCrooked', x: 8.0, z: 1.25, scale: 2.55, rotation: Math.PI * 0.18 },
  { name: 'pineCrooked', x: -10.4, z: -0.9, scale: 2.95, rotation: Math.PI * 0.22 },
  { name: 'pine', x: 10.55, z: -0.75, scale: 3.1, rotation: -Math.PI * 0.18 },
  { name: 'pine', x: -10.25, z: 2.95, scale: 2.85, rotation: -Math.PI * 0.12 },
  { name: 'pineCrooked', x: 10.35, z: 3.05, scale: 2.7, rotation: Math.PI * 0.16 },
  { name: 'pine', x: -6.35, z: 5.25, scale: 2.75, rotation: Math.PI * 0.12 },
  { name: 'pineCrooked', x: 6.55, z: 5.0, scale: 2.5, rotation: -Math.PI * 0.2 },
  { name: 'pine', x: -12.45, z: -6.4, scale: 3.55, rotation: Math.PI * 0.18 },
  { name: 'pineCrooked', x: -15.25, z: -7.95, scale: 3.05, rotation: -Math.PI * 0.26 },
  { name: 'pineCrooked', x: -13.6, z: -2.75, scale: 3.15, rotation: -Math.PI * 0.12 },
  { name: 'pine', x: -12.85, z: 1.05, scale: 3.35, rotation: Math.PI * 0.28 },
  { name: 'pineCrooked', x: -13.9, z: 4.85, scale: 2.95, rotation: -Math.PI * 0.2 },
  { name: 'pine', x: -15.55, z: 10.1, scale: 3.2, rotation: Math.PI * 0.16 },
  { name: 'pine', x: -12.35, z: 8.05, scale: 3.25, rotation: Math.PI * 0.08 },
  { name: 'pineCrooked', x: 12.55, z: -6.2, scale: 3.25, rotation: -Math.PI * 0.28 },
  { name: 'pine', x: 15.35, z: -7.75, scale: 3.45, rotation: Math.PI * 0.18 },
  { name: 'pine', x: 13.75, z: -2.5, scale: 3.55, rotation: Math.PI * 0.12 },
  { name: 'pineCrooked', x: 12.9, z: 1.35, scale: 3.0, rotation: -Math.PI * 0.18 },
  { name: 'pine', x: 14.05, z: 5.15, scale: 3.35, rotation: Math.PI * 0.22 },
  { name: 'pineCrooked', x: 15.55, z: 10.0, scale: 2.9, rotation: -Math.PI * 0.16 },
  { name: 'pineCrooked', x: 12.55, z: 8.25, scale: 2.85, rotation: -Math.PI * 0.08 },
  { name: 'gravestoneCross', x: -6.7, z: -4.75, scale: 0.82, rotation: Math.PI * 0.1 },
  { name: 'gravestoneRound', x: 6.55, z: -4.65, scale: 0.8, rotation: -Math.PI * 0.08 },
  { name: 'grave', x: -7.4, z: -2.55, scale: 1.05, rotation: Math.PI * 0.24 },
  { name: 'grave', x: 7.25, z: -2.45, scale: 1.0, rotation: -Math.PI * 0.2 },
  { name: 'gravestoneBroken', x: -5.45, z: -6.15, scale: 0.72, rotation: -Math.PI * 0.2 },
  { name: 'gravestoneRound', x: 4.95, z: -6.35, scale: 0.74, rotation: Math.PI * 0.18 },
  { name: 'gravestoneCross', x: -7.2, z: 2.45, scale: 0.78, rotation: Math.PI * 0.05 },
  { name: 'gravestoneBroken', x: 7.15, z: 2.7, scale: 0.72, rotation: -Math.PI * 0.14 },
  { name: 'grave', x: -5.55, z: 4.45, scale: 0.92, rotation: -Math.PI * 0.28 },
  { name: 'grave', x: 5.4, z: 4.35, scale: 0.88, rotation: Math.PI * 0.22 },
  { name: 'gravestoneRound', x: -2.85, z: 5.55, scale: 0.68, rotation: Math.PI * 0.08 },
  { name: 'gravestoneCross', x: 3.05, z: 5.35, scale: 0.7, rotation: -Math.PI * 0.12 },
  { name: 'rocks', x: 0.15, z: -7.35, scale: 0.95, rotation: Math.PI * 0.3 },
  { name: 'rocks', x: -7.95, z: 4.05, scale: 0.82, rotation: -Math.PI * 0.26 },
  { name: 'rocks', x: 7.75, z: 3.95, scale: 0.78, rotation: Math.PI * 0.16 },
  { name: 'trunk', x: -4.55, z: -6.95, scale: 1.05, rotation: Math.PI * 0.62 },
  { name: 'trunk', x: 4.65, z: -6.75, scale: 1.0, rotation: -Math.PI * 0.42 },
  { name: 'pumpkinCarved', x: -6.2, z: -3.65, scale: 0.62, rotation: -Math.PI * 0.14 },
  { name: 'pumpkin', x: 6.1, z: -3.65, scale: 0.6, rotation: Math.PI * 0.14 },
  { name: 'pumpkinCarved', x: -7.25, z: 1.65, scale: 0.58, rotation: Math.PI * 0.2 },
  { name: 'pumpkin', x: 7.15, z: 1.85, scale: 0.56, rotation: -Math.PI * 0.1 },
  { name: 'pumpkin', x: -4.15, z: 5.65, scale: 0.54, rotation: Math.PI * 0.35 },
  { name: 'pumpkinCarved', x: 4.25, z: 5.45, scale: 0.56, rotation: -Math.PI * 0.3 },
  { name: 'pine', x: -9.25, z: -9.2, scale: 3.25, rotation: -Math.PI * 0.06 },
  { name: 'pineCrooked', x: -5.0, z: -10.15, scale: 2.85, rotation: Math.PI * 0.25 },
  { name: 'pine', x: 5.15, z: -10.0, scale: 3.1, rotation: -Math.PI * 0.2 },
  { name: 'pineCrooked', x: 9.35, z: -8.95, scale: 2.95, rotation: Math.PI * 0.12 },
  { name: 'pineCrooked', x: -14.4, z: -12.25, scale: 3.45, rotation: Math.PI * 0.3 },
  { name: 'pine', x: -10.9, z: -12.95, scale: 4.0, rotation: -Math.PI * 0.14 },
  { name: 'pineCrooked', x: -7.3, z: -12.55, scale: 3.35, rotation: Math.PI * 0.18 },
  { name: 'pine', x: -3.8, z: -13.25, scale: 3.85, rotation: -Math.PI * 0.05 },
  { name: 'pineCrooked', x: -0.4, z: -12.8, scale: 3.25, rotation: Math.PI * 0.09 },
  { name: 'pine', x: 3.35, z: -13.15, scale: 3.9, rotation: Math.PI * 0.2 },
  { name: 'pineCrooked', x: 7.15, z: -12.55, scale: 3.3, rotation: -Math.PI * 0.24 },
  { name: 'pine', x: 10.95, z: -13.0, scale: 4.05, rotation: Math.PI * 0.08 },
  { name: 'pineCrooked', x: 14.55, z: -12.35, scale: 3.5, rotation: -Math.PI * 0.3 },
  { name: 'pine', x: -16.35, z: -15.4, scale: 3.8, rotation: -Math.PI * 0.18 },
  { name: 'pineCrooked', x: -12.75, z: -16.05, scale: 3.25, rotation: Math.PI * 0.12 },
  { name: 'pine', x: -8.95, z: -15.6, scale: 4.15, rotation: Math.PI * 0.28 },
  { name: 'pineCrooked', x: -5.15, z: -16.2, scale: 3.45, rotation: -Math.PI * 0.06 },
  { name: 'pine', x: -1.25, z: -15.8, scale: 3.75, rotation: Math.PI * 0.04 },
  { name: 'pineCrooked', x: 2.75, z: -16.1, scale: 3.35, rotation: -Math.PI * 0.2 },
  { name: 'pine', x: 6.7, z: -15.55, scale: 4.05, rotation: Math.PI * 0.16 },
  { name: 'pineCrooked', x: 10.55, z: -16.05, scale: 3.4, rotation: -Math.PI * 0.08 },
  { name: 'pine', x: 14.55, z: -15.55, scale: 3.9, rotation: Math.PI * 0.24 },
  { name: 'pineCrooked', x: -13.95, z: -18.25, scale: 3.1, rotation: -Math.PI * 0.1 },
  { name: 'pine', x: -7.9, z: -18.6, scale: 3.55, rotation: Math.PI * 0.18 },
  { name: 'pineCrooked', x: -2.0, z: -18.4, scale: 3.0, rotation: -Math.PI * 0.26 },
  { name: 'pine', x: 4.15, z: -18.65, scale: 3.6, rotation: Math.PI * 0.08 },
  { name: 'pineCrooked', x: 10.2, z: -18.35, scale: 3.05, rotation: -Math.PI * 0.16 },
  { name: 'pine', x: 15.9, z: -18.05, scale: 3.45, rotation: Math.PI * 0.22 },
  { name: 'pineCrooked', x: -18.25, z: -13.35, scale: 3.0, rotation: Math.PI * 0.06 },
  { name: 'pine', x: 18.15, z: -13.15, scale: 3.25, rotation: -Math.PI * 0.08 },
  { name: 'gravestoneRound', x: -8.35, z: -8.0, scale: 0.72, rotation: -Math.PI * 0.18 },
  { name: 'gravestoneCross', x: -3.15, z: -9.35, scale: 0.68, rotation: Math.PI * 0.08 },
  { name: 'gravestoneBroken', x: 2.95, z: -9.55, scale: 0.7, rotation: -Math.PI * 0.16 },
  { name: 'grave', x: 8.25, z: -7.9, scale: 0.88, rotation: Math.PI * 0.2 },
  { name: 'pumpkin', x: -6.95, z: -8.7, scale: 0.5, rotation: Math.PI * 0.34 },
  { name: 'pumpkinCarved', x: 6.95, z: -8.55, scale: 0.52, rotation: -Math.PI * 0.22 },
  { name: 'rocks', x: -0.7, z: -9.85, scale: 0.78, rotation: Math.PI * 0.12 },
  { name: 'pineCrooked', x: -9.1, z: 6.35, scale: 2.7, rotation: Math.PI * 0.18 },
  { name: 'pine', x: 8.95, z: 6.55, scale: 2.9, rotation: -Math.PI * 0.1 },
  { name: 'pine', x: -1.05, z: 8.75, scale: 2.55, rotation: Math.PI * 0.04 },
  { name: 'pineCrooked', x: 1.4, z: 9.05, scale: 2.35, rotation: -Math.PI * 0.2 },
  { name: 'pineCrooked', x: -16.65, z: -4.55, scale: 3.1, rotation: Math.PI * 0.2 },
  { name: 'pine', x: -17.35, z: -0.25, scale: 3.7, rotation: -Math.PI * 0.1 },
  { name: 'pineCrooked', x: -16.8, z: 3.85, scale: 3.0, rotation: Math.PI * 0.14 },
  { name: 'pine', x: -17.45, z: 7.45, scale: 3.45, rotation: -Math.PI * 0.24 },
  { name: 'pine', x: 16.75, z: -4.35, scale: 3.65, rotation: Math.PI * 0.1 },
  { name: 'pineCrooked', x: 17.55, z: -0.05, scale: 3.05, rotation: -Math.PI * 0.22 },
  { name: 'pine', x: 16.85, z: 4.05, scale: 3.5, rotation: Math.PI * 0.18 },
  { name: 'pineCrooked', x: 17.4, z: 7.65, scale: 2.95, rotation: -Math.PI * 0.14 },
  { name: 'grave', x: -7.1, z: 7.15, scale: 0.9, rotation: Math.PI * 0.18 },
  { name: 'gravestoneCross', x: -4.25, z: 7.95, scale: 0.68, rotation: -Math.PI * 0.08 },
  { name: 'gravestoneRound', x: 4.45, z: 7.85, scale: 0.66, rotation: Math.PI * 0.12 },
  { name: 'grave', x: 7.35, z: 7.05, scale: 0.85, rotation: -Math.PI * 0.22 },
  { name: 'pumpkinCarved', x: -2.55, z: 7.45, scale: 0.5, rotation: Math.PI * 0.28 },
  { name: 'pumpkin', x: 2.85, z: 7.35, scale: 0.48, rotation: -Math.PI * 0.32 },
  { name: 'rocks', x: -5.35, z: 8.8, scale: 0.75, rotation: Math.PI * 0.35 },
  { name: 'rocks', x: 5.65, z: 8.55, scale: 0.72, rotation: -Math.PI * 0.24 },
  { name: 'pineCrooked', x: -11.85, z: 12.35, scale: 3.05, rotation: Math.PI * 0.24 },
  { name: 'pine', x: -7.9, z: 13.85, scale: 3.25, rotation: -Math.PI * 0.12 },
  { name: 'pineCrooked', x: -3.75, z: 15.15, scale: 2.75, rotation: Math.PI * 0.08 },
  { name: 'pine', x: 3.95, z: 15.05, scale: 3.15, rotation: Math.PI * 0.18 },
  { name: 'pineCrooked', x: 8.25, z: 13.7, scale: 2.9, rotation: -Math.PI * 0.2 },
  { name: 'pine', x: 12.15, z: 12.45, scale: 3.35, rotation: Math.PI * 0.1 },
  { name: 'pine', x: -15.6, z: 16.9, scale: 3.45, rotation: -Math.PI * 0.18 },
  { name: 'pineCrooked', x: -10.65, z: 19.2, scale: 3.0, rotation: Math.PI * 0.14 },
  { name: 'pine', x: -5.4, z: 21.1, scale: 3.15, rotation: -Math.PI * 0.06 },
  { name: 'pineCrooked', x: 5.55, z: 21.0, scale: 2.95, rotation: Math.PI * 0.2 },
  { name: 'pine', x: 10.85, z: 19.05, scale: 3.35, rotation: -Math.PI * 0.16 },
  { name: 'pineCrooked', x: 15.45, z: 16.75, scale: 3.05, rotation: Math.PI * 0.28 },
  { name: 'pine', x: -13.2, z: 25.2, scale: 3.05, rotation: Math.PI * 0.04 },
  { name: 'pineCrooked', x: -1.8, z: 25.9, scale: 2.75, rotation: -Math.PI * 0.22 },
  { name: 'pine', x: 9.7, z: 25.35, scale: 3.0, rotation: Math.PI * 0.16 },
  { name: 'pineCrooked', x: -18.6, z: 31.4, scale: 3.0, rotation: Math.PI * 0.2 },
  { name: 'pine', x: -12.2, z: 33.8, scale: 3.35, rotation: -Math.PI * 0.1 },
  { name: 'pineCrooked', x: -6.2, z: 35.6, scale: 2.9, rotation: Math.PI * 0.08 },
  { name: 'pine', x: 1.1, z: 34.9, scale: 3.1, rotation: -Math.PI * 0.18 },
  { name: 'pineCrooked', x: 7.8, z: 36.1, scale: 2.85, rotation: Math.PI * 0.22 },
  { name: 'pine', x: 14.7, z: 33.4, scale: 3.35, rotation: Math.PI * 0.12 },
  { name: 'pineCrooked', x: 20.1, z: 31.8, scale: 2.95, rotation: -Math.PI * 0.24 },
  { name: 'pine', x: -15.4, z: 42.8, scale: 3.2, rotation: Math.PI * 0.16 },
  { name: 'pineCrooked', x: -8.1, z: 45.6, scale: 2.85, rotation: -Math.PI * 0.12 },
  { name: 'pine', x: -0.6, z: 47.1, scale: 3.05, rotation: Math.PI * 0.28 },
  { name: 'pineCrooked', x: 8.4, z: 45.3, scale: 2.9, rotation: -Math.PI * 0.08 },
  { name: 'pine', x: 16.2, z: 42.4, scale: 3.25, rotation: Math.PI * 0.1 },
];

export class SceneSetup {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene: THREE.Scene;
  readonly camera: THREE.PerspectiveCamera;

  constructor(container: HTMLElement) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1b1b24);
    this.scene.fog = new THREE.Fog(0x1b1b24, 14, 36);

    this.camera = new THREE.PerspectiveCamera(
      CAMERA_FOV,
      this.viewportWidth / this.viewportHeight,
      0.1,
      100,
    );

    this.addLights();
    this.buildArena();
    this.applyViewport();

    window.addEventListener('resize', this.onResize);
    window.visualViewport?.addEventListener('resize', this.onResize);
  }

  render(): void {
    this.renderer.render(this.scene, this.camera);
  }

  addGraveyardDecor(meshFactory: MeshFactory): void {
    for (const placement of GRAVEYARD_PROPS) {
      const prop = meshFactory.createGraveyardProp(placement.name, placement.scale);
      if (!prop) continue;

      prop.position.set(placement.x, 0.08, placement.z);
      prop.rotation.y = placement.rotation ?? 0;
      this.scene.add(prop);
    }
  }

  dispose(): void {
    window.removeEventListener('resize', this.onResize);
    window.visualViewport?.removeEventListener('resize', this.onResize);
    this.renderer.dispose();
  }

  private addLights(): void {
    const hemi = new THREE.HemisphereLight(0xc6d4ff, 0x2a2a40, 0.55);
    this.scene.add(hemi);

    const sun = new THREE.DirectionalLight(0xffffff, 0.95);
    sun.position.set(6, 12, 4);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.left = -8;
    sun.shadow.camera.right = 8;
    sun.shadow.camera.top = 8;
    sun.shadow.camera.bottom = -8;
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 30;
    sun.shadow.bias = -0.0005;
    this.scene.add(sun);
  }

  private buildArena(): void {
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(GROUND_WIDTH, GROUND_DEPTH),
      new THREE.MeshStandardMaterial({ color: GRASS_COLOR, roughness: 0.98 }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.z = GROUND_Z;
    ground.receiveShadow = true;
    this.scene.add(ground);

    const gravel = new THREE.Mesh(
      this.createGravelGeometry(),
      new THREE.MeshStandardMaterial({ color: GRAVEL_COLOR, roughness: 0.96 }),
    );
    gravel.rotation.x = -Math.PI / 2;
    gravel.position.y = 0.06;
    gravel.receiveShadow = true;
    this.scene.add(gravel);

    this.addGrassTufts();
  }

  private addGrassTufts(): void {
    const geometry = new THREE.ConeGeometry(0.035, 0.3, 3);
    const material = new THREE.MeshStandardMaterial({ color: GRASS_BLADE_COLOR, roughness: 1 });
    const grass = new THREE.InstancedMesh(geometry, material, GRASS_TUFT_COUNT);
    const matrix = new THREE.Matrix4();
    const position = new THREE.Vector3();
    const rotation = new THREE.Euler();
    const scale = new THREE.Vector3();

    for (let i = 0; i < GRASS_TUFT_COUNT; i++) {
      const t = i * 12.9898;
      let angle: number;

      if (i < FRONT_GRASS_START_INDEX) {
        const radius = 5.4 + (Math.sin(t * 0.73) * 0.5 + 0.5) * 20.5;
        angle = i * 2.399963 + Math.sin(t) * 0.22;
        position.set(Math.cos(angle) * radius, 0.16, Math.sin(angle) * radius);
      } else {
        const frontI = i - FRONT_GRASS_START_INDEX;
        const xNoise = Math.sin(t * 1.17) * 0.5 + 0.5;
        const zNoise = Math.sin(t * 0.61 + 1.4) * 0.5 + 0.5;
        const x = -24 + ((frontI * 7.17 + xNoise * 4.5) % 48);
        const z = 27 + ((frontI * 5.83 + zNoise * 6.0) % 24);
        angle = Math.sin(t * 0.37) * Math.PI;
        position.set(x, 0.16, z);
      }

      rotation.set(0, angle + Math.sin(t * 1.7) * 0.8, 0);
      const s = 0.7 + (Math.sin(t * 2.31) * 0.5 + 0.5) * 0.75;
      scale.set(s, s, s);

      matrix.compose(position, new THREE.Quaternion().setFromEuler(rotation), scale);
      grass.setMatrixAt(i, matrix);
    }

    grass.castShadow = true;
    grass.receiveShadow = true;
    this.scene.add(grass);
  }

  private createGravelGeometry(): THREE.ShapeGeometry {
    const points = [
      new THREE.Vector2(-4.45, -4.35),
      new THREE.Vector2(-2.25, -4.8),
      new THREE.Vector2(0.25, -4.55),
      new THREE.Vector2(2.65, -4.75),
      new THREE.Vector2(4.45, -4.1),
      new THREE.Vector2(4.95, -1.55),
      new THREE.Vector2(4.45, 1.3),
      new THREE.Vector2(3.55, 3.25),
      new THREE.Vector2(1.15, 4.25),
      new THREE.Vector2(-1.45, 4.05),
      new THREE.Vector2(-3.75, 3.15),
      new THREE.Vector2(-4.85, 0.75),
      new THREE.Vector2(-4.7, -1.85),
    ];
    return new THREE.ShapeGeometry(new THREE.Shape(points));
  }

  private onResize = (): void => {
    this.applyViewport();
  };

  private applyViewport(): void {
    const w = this.viewportWidth;
    const h = this.viewportHeight;
    const aspect = w / h;

    this.camera.aspect = aspect;

    const vFov = THREE.MathUtils.degToRad(this.camera.fov);
    const hFov = 2 * Math.atan(Math.tan(vFov / 2) * aspect);
    const limitingFov = Math.min(vFov, hFov);
    const requiredDistance = ARENA_FIT_RADIUS / Math.tan(limitingFov / 2);
    const scale = THREE.MathUtils.clamp(
      requiredDistance / BASE_CAMERA_DISTANCE,
      1,
      MAX_CAMERA_SCALE,
    );

    this.camera.position.set(
      CAMERA_POS[0] * scale,
      CAMERA_POS[1] * scale,
      CAMERA_POS[2] * scale,
    );
    this.camera.lookAt(...CAMERA_LOOK_AT);
    this.camera.updateProjectionMatrix();
    this.updateFogForCameraDistance();

    this.renderer.setSize(w, h);
  }

  private updateFogForCameraDistance(): void {
    const fog = this.scene.fog;
    if (!(fog instanceof THREE.Fog)) return;

    const cameraDistance = this.camera.position.length();
    fog.near = cameraDistance + FOG_NEAR_CAMERA_OFFSET;
    fog.far = cameraDistance + FOG_FAR_CAMERA_OFFSET;
  }

  private get viewportWidth(): number {
    return Math.max(MIN_VIEWPORT_WIDTH, this.renderer.domElement.parentElement?.clientWidth ?? window.innerWidth);
  }

  private get viewportHeight(): number {
    return Math.max(MIN_VIEWPORT_HEIGHT, this.renderer.domElement.parentElement?.clientHeight ?? window.innerHeight);
  }
}
