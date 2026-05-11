# LinwisMerge — 3D Playable Ad Prototype

A high-performance 3D merge-tower-defense playable ad built entirely on **Three.js** and **TypeScript**. 
Players drag same-tier guns together to merge them into stronger weapons, upgrading their base stats to survive 5 enemy waves (including a final boss). 

Designed specifically for the Playable Ads market: it builds into a **single HTML file** (via `vite-plugin-singlefile`) with inlined assets, strictly optimized for size and mobile performance.

---

## 🚀 Live Demo
[https://linwis-merge-playable-ad.vercel.app/](https://linwis-merge-playable-ad.vercel.app/)

---

## 🛠 Tech Stack & Features

- **Engine:** Three.js (pure WebGL rendering, no heavy game engines)
- **Language:** TypeScript (strict mode for solid architecture)
- **Bundler:** Vite + `vite-plugin-singlefile` (outputs a single `index.html` ready for ad networks like AppLovin, Unity Ads, Mintegral, IronSource)
- **Styling:** Tailwind CSS v4 (compact utility classes for HUD)
- **Audio:** Custom `AudioSystem` utilizing Web Audio API `GainNode` to bypass iOS Safari hardware-only volume restrictions, ensuring smooth programmatic volume control on all mobile devices.

---

## 🏗 Architecture Overview

The codebase is strictly separated by responsibilities to keep it scalable and maintainable:

- **`main.ts` & `Game.ts`** — The orchestrators. Manage the game loop, win/lose states, and coordinate systems. Includes a pre-loading state that ensures all 3D assets are fully loaded before revealing the Play button.
- **`config.ts`** — The single source of truth for all game balancing (tier stats, spawn rates, upgrade costs, wave durations).
- **`scene/SceneSetup.ts`** — Handles the Three.js renderer, camera, lights, and environment (graveyard). Dynamically scales camera distance based on viewport aspect ratio to prevent cropping on ultra-wide or portrait phones.
- **`factories/MeshFactory.ts`** — The central asset loader and mesh generator. Easily swap primitive placeholders with real `.fbx`/`.glb` models (with Draco compression) without touching game logic.
- **`entities/`** — `Gun`, `Enemy`, `Hero`, `Bullet`. State holders that wrap Three.js meshes.
- **`systems/`** — 
  - `GridSystem`: Handles the 3x3 grid, drag-and-drop raycasting, and merge logic.
  - `SpawnSystem`: Orchestrates 5 waves of enemies, calculating procedural spawn angles and boss logic.
  - `CombatSystem`: Auto-aiming, bullet trajectory calculation, collision detection, and global upgrade state application.
  - `EffectsSystem`: Particle systems (hit sparks, death bursts) and coin drop/collection animations.
  - `AudioSystem`: Sound pooling, volume sliders, and `AudioContext` graphs.
- **`ui/`** — `HUD` and `Menu` classes. Pure DOM UI overlayed on top of the WebGL canvas.

---

## 📱 Mobile Adaptation

Specifically engineered for modern smartphones (iPhone & Android):
- **Dynamic Camera:** `viewport-fit=cover` with aspect-ratio-based camera scaling ensures the arena is always perfectly framed in portrait mode.
- **Safe Areas:** Utilizes `env(safe-area-inset-*)` so the UI naturally avoids the iOS Dynamic Island and home-indicator.
- **Touch Optimization:** Uses `touch-action: manipulation` to kill the 300ms tap delay. Neutralized hover effects on touch devices to prevent "sticky" buttons.
- **Responsive UI:** Adaptive HUD layout that scales down gracefully for `≤480px` screens. Volume sliders feature enlarged touch targets (`w-8 h-8` thumbs) for flawless interaction.

---

## ⚙️ Development & Build

```bash
npm install
npm run dev          # http://localhost:5173 with HMR
```

### Build for Ad Networks
```bash
npm run build        # produces dist/index.html (single file, all inlined)
npm run preview      # preview the production bundle
```
The target output size is strictly **≤ 5 MB** for optimal ad network compatibility.
