import * as THREE from 'three';
import { BOSS_SIZE_MULTIPLIER, TIER_COLOR, ENEMY_TIER_COLOR, CELL_SIZE } from '../config';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';

const gunModelUrls = [
  new URL('../assets/models/guns/Pistol.fbx', import.meta.url).href,
  new URL('../assets/models/guns/LongPistol_small.fbx', import.meta.url).href,
  new URL('../assets/models/guns/LongPistol.fbx', import.meta.url).href,
  new URL('../assets/models/guns/Rifle.fbx', import.meta.url).href,
  new URL('../assets/models/guns/Sniper rifle.fbx', import.meta.url).href,
  new URL('../assets/models/guns/Ray Gun.fbx', import.meta.url).href,
  new URL('../assets/models/guns/Lightning Gun.fbx', import.meta.url).href,
];

const enemyModelUrls = [
  new URL('../assets/models/graveyard/character-zombie.fbx', import.meta.url).href,
  new URL('../assets/models/graveyard/character-skeleton.fbx', import.meta.url).href,
  new URL('../assets/models/graveyard/character-ghost.fbx', import.meta.url).href,
  new URL('../assets/models/graveyard/character-vampire.fbx', import.meta.url).href,
];

const bossModelUrl = new URL('../assets/models/graveyard/character-vampire.fbx', import.meta.url).href;
const heroModelUrl = new URL('../assets/models/graveyard/character-keeper.fbx', import.meta.url).href;
const graveyardTextureUrl = new URL('../assets/models/graveyard/Textures/colormap.png', import.meta.url).href;
const coinModelUrl = new URL('../assets/coin.fbx', import.meta.url).href;

const graveyardPropUrls = {
  cryptLarge: new URL('../assets/models/graveyard/crypt-large.fbx', import.meta.url).href,
  cryptSmall: new URL('../assets/models/graveyard/crypt-small.fbx', import.meta.url).href,
  fenceBorder: new URL('../assets/models/graveyard/iron-fence-border.fbx', import.meta.url).href,
  fenceGate: new URL('../assets/models/graveyard/iron-fence-border-gate.fbx', import.meta.url).href,
  fenceColumn: new URL('../assets/models/graveyard/iron-fence-border-column.fbx', import.meta.url).href,
  grave: new URL('../assets/models/graveyard/grave.fbx', import.meta.url).href,
  gravestoneBroken: new URL('../assets/models/graveyard/gravestone-broken.fbx', import.meta.url).href,
  gravestoneCross: new URL('../assets/models/graveyard/gravestone-cross.fbx', import.meta.url).href,
  gravestoneRound: new URL('../assets/models/graveyard/gravestone-round.fbx', import.meta.url).href,
  lightpost: new URL('../assets/models/graveyard/lightpost-single.fbx', import.meta.url).href,
  pine: new URL('../assets/models/graveyard/pine.fbx', import.meta.url).href,
  pineCrooked: new URL('../assets/models/graveyard/pine-crooked.fbx', import.meta.url).href,
  pumpkin: new URL('../assets/models/graveyard/pumpkin.fbx', import.meta.url).href,
  pumpkinCarved: new URL('../assets/models/graveyard/pumpkin-carved.fbx', import.meta.url).href,
  rocks: new URL('../assets/models/graveyard/rocks.fbx', import.meta.url).href,
  trunk: new URL('../assets/models/graveyard/trunk.fbx', import.meta.url).href,
} as const;

export type GraveyardPropName = keyof typeof graveyardPropUrls;

const ENEMY_MODEL_HEIGHT = 1.55;
const BOSS_MODEL_HEIGHT = ENEMY_MODEL_HEIGHT * BOSS_SIZE_MULTIPLIER;
const HERO_MODEL_HEIGHT = 1.12;
const GUN_VISUAL_SCALE = 0.85;
const GUN_MODEL_TARGET_SIZE = CELL_SIZE * 0.81 * GUN_VISUAL_SCALE;
const COIN_MODEL_TARGET_SIZE = 0.34;

// three.js lookAt aims the local -Z axis at the target. The bundled gun FBXs
// aren't all authored along the same axis — some run along X, some along Z —
// so we yaw the visual to match. The bounding-box center sits on the grip
// (the heavy half of the model), so the muzzle is the opposite direction.
function detectGunYaw(size: THREE.Vector3, center: THREE.Vector3): number {
  const isAlongX = size.x >= size.z;
  if (isAlongX) return center.x >= 0 ? -Math.PI * 0.5 : Math.PI * 0.5;
  return center.z >= 0 ? 0 : Math.PI;
}

export class MeshFactory {
  private gunModels: THREE.Object3D[] = [];
  private enemyModels: THREE.Object3D[] = [];
  private graveyardProps = new Map<GraveyardPropName, THREE.Object3D>();
  private bossModel: THREE.Object3D | null = null;
  private heroModel: THREE.Object3D | null = null;
  private coinModel: THREE.Object3D | null = null;
  private graveyardTexture: THREE.Texture | null = null;

  async loadModels(): Promise<void> {
    const loader = new FBXLoader();

    try {
      this.graveyardTexture = await new THREE.TextureLoader().loadAsync(graveyardTextureUrl);
      this.graveyardTexture.colorSpace = THREE.SRGBColorSpace;
    } catch (error) {
      console.warn('Failed to load graveyard texture. Models will use embedded materials.', error);
      this.graveyardTexture = null;
    }

    try {
      const models = await Promise.all(gunModelUrls.map((url) => loader.loadAsync(url)));
      this.gunModels = models.map((model) => this.prepareGunModel(model));
    } catch (error) {
      console.warn('Failed to load gun models. Falling back to primitives.', error);
      this.gunModels = [];
    }

    try {
      const models = await Promise.all(enemyModelUrls.map((url) => loader.loadAsync(url)));
      this.enemyModels = models.map((model) => this.prepareCharacter(model, ENEMY_MODEL_HEIGHT, true));
    } catch (error) {
      console.warn('Failed to load enemy models. Falling back to primitives.', error);
      this.enemyModels = [];
    }

    try {
      const model = await loader.loadAsync(bossModelUrl);
      this.bossModel = this.prepareCharacter(model, BOSS_MODEL_HEIGHT, true);
    } catch (error) {
      console.warn('Failed to load boss model. Falling back to primitive.', error);
      this.bossModel = null;
    }

    try {
      const model = await loader.loadAsync(heroModelUrl);
      this.heroModel = this.prepareHero(model);
    } catch (error) {
      console.warn('Failed to load hero model. Falling back to primitive.', error);
      this.heroModel = null;
    }

    try {
      const model = await loader.loadAsync(coinModelUrl);
      this.coinModel = this.prepareCoinModel(model);
    } catch (error) {
      console.warn('Failed to load coin model. Falling back to primitive.', error);
      this.coinModel = null;
    }

    const propEntries = await Promise.all(
      Object.entries(graveyardPropUrls).map(async ([name, url]) => {
        try {
          const model = await loader.loadAsync(url);
          return [name, this.prepareStaticProp(model)] as const;
        } catch (error) {
          console.warn(`Failed to load graveyard prop "${name}".`, error);
          return null;
        }
      }),
    );
    this.graveyardProps = new Map(
      propEntries.filter((entry): entry is [GraveyardPropName, THREE.Object3D] => entry !== null),
    );
  }

  createGun(tier: number): THREE.Object3D {
    const model = this.gunModels[Math.min(tier - 1, this.gunModels.length - 1)];
    if (model) return this.cloneStaticModel(model);

    const radius = (0.22 + (tier - 1) * 0.04) * GUN_VISUAL_SCALE;
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(radius, 24, 16),
      new THREE.MeshStandardMaterial({
        color: TIER_COLOR[tier - 1],
        emissive: TIER_COLOR[tier - 1],
        emissiveIntensity: 0.45,
        roughness: 0.35,
        metalness: 0.2,
      }),
    );
    mesh.castShadow = true;
    return mesh;
  }

  createEnemy(tierIdx: number, isBoss = false): THREE.Object3D {
    if (isBoss) {
      if (this.bossModel) return this.cloneSkinnedModel(this.bossModel);
      return this.makePrimitiveBoss();
    }

    const model = this.enemyModels[Math.min(tierIdx, this.enemyModels.length - 1)];
    if (model) return this.cloneSkinnedModel(model);

    return this.makePrimitiveEnemy(tierIdx);
  }

  createHero(): THREE.Object3D {
    if (this.heroModel) return this.cloneSkinnedModel(this.heroModel);

    const mesh = new THREE.Mesh(
      new THREE.ConeGeometry(0.45, 1.0, 4),
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        emissive: 0x444466,
        emissiveIntensity: 0.4,
        roughness: 0.4,
        metalness: 0.1,
      }),
    );
    mesh.castShadow = true;
    mesh.userData.size = 1.0;
    return mesh;
  }

  createBullet(tier: number): THREE.Mesh {
    return new THREE.Mesh(
      new THREE.SphereGeometry(0.09, 8, 6),
      new THREE.MeshBasicMaterial({ color: TIER_COLOR[tier - 1] }),
    );
  }

  createCoin(): THREE.Object3D {
    if (this.coinModel) return this.cloneStaticModel(this.coinModel);

    const mesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.16, 0.16, 0.045, 24),
      new THREE.MeshStandardMaterial({
        color: 0xffc52e,
        emissive: 0x8a4d00,
        emissiveIntensity: 0.18,
        roughness: 0.32,
        metalness: 0.75,
      }),
    );
    mesh.castShadow = false;
    mesh.receiveShadow = false;
    return mesh;
  }

  createGridTile(): THREE.Mesh {
    const tile = new THREE.Mesh(
      new THREE.BoxGeometry(CELL_SIZE * 0.92, 0.12, CELL_SIZE * 0.92),
      new THREE.MeshStandardMaterial({ color: 0x716657, roughness: 0.92 }),
    );
    tile.receiveShadow = true;
    return tile;
  }

  createGraveyardProp(name: GraveyardPropName, scale = 1): THREE.Object3D | null {
    const model = this.graveyardProps.get(name);
    if (!model) return null;

    const clone = this.cloneStaticModel(model);
    clone.scale.setScalar(scale);
    return clone;
  }

  getEnemySize(tierIdx: number, isBoss = false): number {
    if (isBoss) return BOSS_MODEL_HEIGHT;
    if (this.enemyModels.length > 0) return ENEMY_MODEL_HEIGHT;
    return 0.78 + tierIdx * 0.1;
  }

  getHeroSize(): number {
    return this.heroModel ? HERO_MODEL_HEIGHT : 1.0;
  }

  private prepareGunModel(model: THREE.Object3D): THREE.Object3D {
    const visual = model.clone(true);
    const bounds = new THREE.Box3().setFromObject(visual);
    const size = bounds.getSize(new THREE.Vector3());
    const center = bounds.getCenter(new THREE.Vector3());
    const longestAxis = Math.max(size.x, size.y, size.z);
    const scale = longestAxis > 0 ? GUN_MODEL_TARGET_SIZE / longestAxis : 1;

    visual.scale.multiplyScalar(scale);
    visual.position.copy(center).multiplyScalar(-scale);

    const yawRoot = new THREE.Group();
    yawRoot.rotation.y = detectGunYaw(size, center);
    yawRoot.add(visual);

    const aimRoot = new THREE.Group();
    aimRoot.add(yawRoot);

    aimRoot.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.castShadow = true;
        object.receiveShadow = true;
      }
    });
    return aimRoot;
  }

  private prepareCharacter(model: THREE.Object3D, targetHeight: number, useGraveyardTexture = false): THREE.Object3D {
    const visual = SkeletonUtils.clone(model);
    const bounds = new THREE.Box3().setFromObject(visual);
    const size = bounds.getSize(new THREE.Vector3());
    const center = bounds.getCenter(new THREE.Vector3());
    const scale = size.y > 0 ? targetHeight / size.y : 1;

    visual.scale.multiplyScalar(scale);
    visual.position.copy(center).multiplyScalar(-scale);

    const root = new THREE.Group();
    root.add(visual);
    root.animations = model.animations;

    root.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.castShadow = true;
        object.receiveShadow = true;
      }
    });
    if (useGraveyardTexture) this.applyGraveyardTexture(root);
    return root;
  }

  private prepareHero(model: THREE.Object3D): THREE.Object3D {
    const root = this.prepareCharacter(model, HERO_MODEL_HEIGHT, true);
    root.userData.size = HERO_MODEL_HEIGHT;
    return root;
  }

  private prepareCoinModel(model: THREE.Object3D): THREE.Object3D {
    const visual = model.clone(true);
    this.removeSceneAffectingObjects(visual);

    const bounds = new THREE.Box3().setFromObject(visual);
    const size = bounds.getSize(new THREE.Vector3());
    const longestAxis = Math.max(size.x, size.y, size.z);
    const scale = longestAxis > 0 ? COIN_MODEL_TARGET_SIZE / longestAxis : 1;
    const center = bounds.getCenter(new THREE.Vector3());

    visual.scale.multiplyScalar(scale);
    visual.position.set(-center.x * scale, -bounds.min.y * scale, -center.z * scale);

    const root = new THREE.Group();
    root.add(visual);
    root.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.castShadow = false;
        object.receiveShadow = false;
      }
    });
    return root;
  }

  private removeSceneAffectingObjects(root: THREE.Object3D): void {
    const removable: THREE.Object3D[] = [];
    root.traverse((object) => {
      if (object instanceof THREE.Light || object instanceof THREE.Camera) {
        removable.push(object);
      }
    });

    for (const object of removable) {
      object.parent?.remove(object);
    }
  }

  private prepareStaticProp(model: THREE.Object3D): THREE.Object3D {
    const visual = model.clone(true);
    const bounds = new THREE.Box3().setFromObject(visual);
    const size = bounds.getSize(new THREE.Vector3());
    const center = bounds.getCenter(new THREE.Vector3());
    const longestAxis = Math.max(size.x, size.y, size.z);
    const scale = longestAxis > 0 ? 1 / longestAxis : 1;

    visual.scale.multiplyScalar(scale);
    visual.position.set(-center.x * scale, -bounds.min.y * scale, -center.z * scale);

    const root = new THREE.Group();
    root.add(visual);
    root.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.castShadow = true;
        object.receiveShadow = true;
      }
    });
    this.applyGraveyardTexture(root);
    return root;
  }

  private applyGraveyardTexture(root: THREE.Object3D): void {
    if (!this.graveyardTexture) return;

    root.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;

      const materials = Array.isArray(object.material) ? object.material : [object.material];
      for (const material of materials) {
        if ('map' in material) {
          material.map = this.graveyardTexture;
          material.needsUpdate = true;
        }
      }
    });
  }

  private cloneStaticModel(model: THREE.Object3D): THREE.Object3D {
    const clone = model.clone(true);
    clone.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      object.geometry = object.geometry.clone();
      object.material = Array.isArray(object.material)
        ? object.material.map((material) => material.clone())
        : object.material.clone();
    });
    return clone;
  }

  private cloneSkinnedModel(model: THREE.Object3D): THREE.Object3D {
    const clone = SkeletonUtils.clone(model);
    clone.animations = model.animations;
    clone.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      object.geometry = object.geometry.clone();
      object.material = Array.isArray(object.material)
        ? object.material.map((material) => material.clone())
        : object.material.clone();
    });
    return clone;
  }

  private makePrimitiveBoss(): THREE.Object3D {
    const size = BOSS_MODEL_HEIGHT;
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(size, size, size),
      new THREE.MeshStandardMaterial({ color: 0x7d3cff, roughness: 0.55, metalness: 0.12 }),
    );
    mesh.castShadow = true;
    mesh.userData.size = size;
    return mesh;
  }

  private makePrimitiveEnemy(tierIdx: number): THREE.Object3D {
    const size = 0.78 + tierIdx * 0.1;
    const colorIdx = Math.min(tierIdx, ENEMY_TIER_COLOR.length - 1);
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(size, size, size),
      new THREE.MeshStandardMaterial({
        color: ENEMY_TIER_COLOR[colorIdx],
        roughness: 0.55,
        metalness: 0.15,
      }),
    );
    mesh.castShadow = true;
    mesh.userData.size = size;
    return mesh;
  }
}
