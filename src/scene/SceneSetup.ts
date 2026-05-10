import * as THREE from 'three';
import { CAMERA_FOV, CAMERA_POS } from '../config';

const ARENA_FIT_RADIUS = 7.2;
const MAX_CAMERA_SCALE = 2.2;
const BASE_CAMERA_DISTANCE = Math.hypot(...CAMERA_POS);

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
    this.scene.fog = new THREE.Fog(0x1b1b24, 14, 28);

    this.camera = new THREE.PerspectiveCamera(
      CAMERA_FOV,
      window.innerWidth / window.innerHeight,
      0.1,
      100,
    );

    this.addLights();
    this.buildArena();
    this.applyViewport();

    window.addEventListener('resize', this.onResize);
  }

  render(): void {
    this.renderer.render(this.scene, this.camera);
  }

  dispose(): void {
    window.removeEventListener('resize', this.onResize);
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
      new THREE.PlaneGeometry(40, 40),
      new THREE.MeshStandardMaterial({ color: 0x2a3147, roughness: 0.95 }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);

    const platform = new THREE.Mesh(
      new THREE.CylinderGeometry(5.5, 5.5, 0.1, 48),
      new THREE.MeshStandardMaterial({ color: 0x3a4566, roughness: 0.9 }),
    );
    platform.position.y = 0.05;
    platform.receiveShadow = true;
    this.scene.add(platform);
  }

  private onResize = (): void => {
    this.applyViewport();
  };

  private applyViewport(): void {
    const w = window.innerWidth;
    const h = window.innerHeight;
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
    this.camera.lookAt(0, 0, 0);
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(w, h);
  }
}
