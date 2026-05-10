import * as THREE from 'three';
import type { Gun } from '../entities/Gun';
import type { GridSystem } from './GridSystem';

const DRAG_HEIGHT = 1.2;
const DRAG_PLANE_Y = 0.5;

export class InputSystem {
  isInputBlocked: () => boolean = () => false;

  private dragged: Gun | null = null;
  private hovered: Gun | null = null;

  private readonly raycaster = new THREE.Raycaster();
  private readonly pointerNDC = new THREE.Vector2();
  private readonly dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -DRAG_PLANE_Y);

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly camera: THREE.Camera,
    private readonly grid: GridSystem,
  ) {
    canvas.addEventListener('pointerdown', this.onPointerDown);
    canvas.addEventListener('pointermove', this.onPointerMove);
    canvas.addEventListener('pointerup', this.onPointerUp);
    canvas.addEventListener('pointercancel', this.onPointerCancel);
    canvas.addEventListener('pointerleave', this.onPointerLeave);
  }

  dispose(): void {
    this.canvas.removeEventListener('pointerdown', this.onPointerDown);
    this.canvas.removeEventListener('pointermove', this.onPointerMove);
    this.canvas.removeEventListener('pointerup', this.onPointerUp);
    this.canvas.removeEventListener('pointercancel', this.onPointerCancel);
    this.canvas.removeEventListener('pointerleave', this.onPointerLeave);
  }

  private updatePointerNDC(event: PointerEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    this.pointerNDC.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointerNDC.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  }

  private projectToGround(): THREE.Vector3 | null {
    this.raycaster.setFromCamera(this.pointerNDC, this.camera);
    const hit = new THREE.Vector3();
    return this.raycaster.ray.intersectPlane(this.dragPlane, hit) ? hit : null;
  }

  private pickGun(): Gun | null {
    this.raycaster.setFromCamera(this.pointerNDC, this.camera);
    const meshes = this.grid.guns.map((gun) => gun.mesh);
    const hits = this.raycaster.intersectObjects(meshes, true);
    if (hits.length === 0) return null;

    let node: THREE.Object3D | null = hits[0].object;
    while (node && node.userData.kind !== 'gun') node = node.parent;
    return (node?.userData.gunRef as Gun | undefined) ?? null;
  }

  private setHovered(gun: Gun | null): void {
    if (this.hovered === gun) return;
    this.hovered?.setHover(false);
    this.hovered = gun;
    if (gun) {
      gun.setHover(true);
      this.canvas.style.cursor = 'pointer';
    } else {
      this.canvas.style.cursor = '';
    }
  }

  private onPointerDown = (event: PointerEvent): void => {
    if (this.isInputBlocked()) return;
    this.updatePointerNDC(event);

    const gun = this.pickGun();
    if (!gun) return;

    this.dragged = gun;
    gun.mesh.position.y = DRAG_HEIGHT;
    this.setHovered(null);
    this.canvas.setPointerCapture(event.pointerId);
  };

  private onPointerMove = (event: PointerEvent): void => {
    this.updatePointerNDC(event);

    if (this.dragged) {
      const point = this.projectToGround();
      if (point) this.dragged.mesh.position.set(point.x, DRAG_HEIGHT, point.z);
      return;
    }

    if (this.isInputBlocked()) {
      this.setHovered(null);
      return;
    }
    this.setHovered(this.pickGun());
  };

  private onPointerUp = (): void => {
    if (!this.dragged) return;
    const x = this.dragged.mesh.position.x;
    const z = this.dragged.mesh.position.z;
    this.grid.handleDrop(this.dragged, x, z);
    this.dragged = null;
  };

  private onPointerCancel = (): void => {
    if (!this.dragged) return;
    this.grid.handleDrop(this.dragged, this.dragged.cell.x, this.dragged.cell.z);
    this.dragged = null;
  };

  private onPointerLeave = (): void => {
    if (!this.dragged) this.setHovered(null);
  };
}
