# Merge Guns — Playable Ad Prototype

3D merge-tower-defense playable ad built on Three.js. Drag same-tier guns
together to merge them up the rainbow ladder; survive enemy waves until
the kill goal.

This repo is the placeholder build — visuals are colored primitives so the
game runs without external assets. Real GLTF models plug in via a single
`MeshFactory` swap point.

---

## Stack

- **Three.js** — 3D rendering
- **TypeScript** — strict mode
- **Vite** — dev server + production build
- **Tailwind v4** — HUD styles via utility classes
- **vite-plugin-singlefile** — bundles everything into one HTML for ad networks

---

## Setup

```bash
npm install
npm run dev          # http://localhost:5173 with HMR
```

## Build

```bash
npm run build        # produces dist/index.html (single file, all inlined)
npm run preview      # preview the production bundle
```

The output `dist/index.html` is what you upload to ad networks (Mintegral,
Vungle, IronSource, AppLovin). Target size is ≤ 5 MB.

---

## Project layout

```
src/
├── main.ts                  # entry — instantiates Game, starts loop
├── Game.ts                  # orchestrator: owns systems, win/lose state
├── config.ts                # all tunables (tier stats, spawn rate, kill goal)
├── types.ts                 # shared types (Cell, DropResult, GameState)
│
├── scene/
│   └── SceneSetup.ts        # renderer, camera, lights, ground/arena/ring
│
├── factories/
│   └── MeshFactory.ts       # ⚠ THE SWAP POINT — primitives ↔ GLTF models
│
├── entities/                # owns mesh + state
│   ├── Gun.ts
│   ├── Enemy.ts             # includes billboard HP bar
│   ├── Bullet.ts
│   └── Hero.ts
│
├── systems/                 # owns lists of entities, has update(dt,t)
│   ├── GridSystem.ts        # 3x3 grid, drop resolution, merge logic
│   ├── SpawnSystem.ts       # enemy waves
│   ├── CombatSystem.ts      # auto-aim, bullets, damage, kills
│   ├── EffectsSystem.ts     # particles
│   └── InputSystem.ts       # pointer drag-and-drop
│
├── ui/
│   └── HUD.ts               # DOM HUD (Tailwind utility classes)
│
└── styles/
    └── main.css             # Tailwind import + tiny custom transitions
```

---

## Where to plug real models

Open **`src/factories/MeshFactory.ts`**. Three things to do:

1. Implement `loadModels()` — use `GLTFLoader` (+ `DRACOLoader` for
   compression). Store loaded models on the factory instance.
2. In `createGun(tier)`, swap the procedural sphere for
   `this.gunModels[tier - 1].clone()`.
3. Same for `createEnemy(tierIdx)` and `createHero()`.

Public method names stay the same, so no other file needs touching.

```ts
// example
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';

async loadModels() {
  const gltf = new GLTFLoader();
  const draco = new DRACOLoader();
  draco.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/');
  gltf.setDRACOLoader(draco);

  const urls = [
    '/models/guns/pistol.glb',
    '/models/guns/smg.glb',
    // ...
  ];
  const loaded = await Promise.all(urls.map((u) => gltf.loadAsync(u)));
  this.gunModels = loaded.map((g) => g.scene);
}
```

For rigged characters use `SkeletonUtils.clone` instead of `.clone()` so
each instance gets its own bone hierarchy.

---

## HUD layout

- **Top-left** — kills, HP, wave, cash, gun count.
- **Top-right** — Pause and Reset (compact action buttons).
- **Bottom-center** — primary actions: green **Buy Gun** and yellow
  **Upgrade**. Tapping Upgrade slides up a panel with three cards
  (Damage, Speed, HP) showing current level and next cost. Each upgrade
  applies globally to every gun the player owns.

The Upgrade button has a constant bounce + glow pulse so first-time
players can't miss it; pulses pause on hover and while the panel is open.
All button styles live in `src/assets/styles/main.css` under the
`.hud-action-btn`, `.hud-icon-btn`, and `.upgrade-card` rules.

---

## Tuning

All gameplay constants live in `src/config.ts`:

- `KILL_GOAL` — kills to win (5 by default for a ~30 s playable)
- `ENEMY_SPAWN_INTERVAL` — seconds between spawns
- `MAX_ENEMIES` — concurrent cap so the field doesn't overflow
- `TIER_DAMAGE / FIRERATE / RANGE` — per-tier gun balance
- `WAVE_DURATION` — seconds per wave (drives difficulty bump)
- `UPGRADE_BASE_COST / UPGRADE_COST_GROWTH` — upgrade pricing curve
- `UPGRADE_DAMAGE_PER_LEVEL / UPGRADE_SPEED_PER_LEVEL` — global damage / fire-rate
  multipliers per level (applied to every gun)
- `UPGRADE_HP_PER_LEVEL` — extra hero HP per level

Tweak, save, the dev server hot-reloads.

---

## Build size budget

For ad networks the practical ceiling is ~5 MB total:

```
three.js + addons   ~700 KB
7 gun models        ~600 KB   (Draco-compressed)
5 enemy models      ~1.3 MB   (with simple anims)
hero model          ~300 KB
audio (sparse)      ~300 KB
code + UI           ~80 KB
─────────────────────────────
total              ~3.3 MB
```

Watch the build report — `npm run build` prints sizes. If you exceed 5 MB,
first compress models harder (`gltf-pipeline -d` with Draco) before cutting
features.
