import { GUN_SLOT_COUNT, TOTAL_WAVES } from '../config';
import type { UpgradeKind } from '../types';

const WAVE_NOTICE_VISIBLE_MS = 950;
const WAVE_NOTICE_CLEAR_MS = 1450;

const UPGRADE_KINDS: readonly UpgradeKind[] = ['damage', 'speed', 'hp'];

export type HUDHandlers = {
  onBuy: () => void;
  onReset: () => void;
  onPause: () => void;
  onUpgrade: (kind: UpgradeKind) => void;
};

export class HUD {
  private readonly killsEl: HTMLElement;
  private readonly healthEl: HTMLElement;
  private readonly waveEl: HTMLElement;
  private readonly gunsEl: HTMLElement;
  private readonly moneyEl: HTMLElement;
  private readonly buyCostEl: HTMLElement;
  private readonly statusEl: HTMLElement;
  private readonly waveNoticeEl: HTMLElement;
  private readonly buyBtn: HTMLButtonElement;
  private readonly upgradeBtn: HTMLButtonElement;
  private readonly upgradePanelEl: HTMLElement;
  private readonly upgradeBtns: Record<UpgradeKind, HTMLButtonElement>;
  private readonly upgradeLvlEls: Record<UpgradeKind, HTMLElement>;
  private readonly upgradeCostEls: Record<UpgradeKind, HTMLElement>;

  private upgradePanelOpen = false;
  private waveNoticeHideTimer: number | null = null;
  private waveNoticeClearTimer: number | null = null;

  constructor(container: HTMLElement, handlers: HUDHandlers) {
    container.insertAdjacentHTML('beforeend', this.template());

    this.killsEl     = this.requireElement(container, '#hud-kills');
    this.healthEl    = this.requireElement(container, '#hud-health');
    this.waveEl      = this.requireElement(container, '#hud-wave');
    this.gunsEl      = this.requireElement(container, '#hud-guns');
    this.moneyEl     = this.requireElement(container, '#hud-money');
    this.buyCostEl   = this.requireElement(container, '#hud-buy-cost');
    this.statusEl    = this.requireElement(container, '#hud-status');
    this.waveNoticeEl = this.requireElement(container, '#hud-wave-notice');
    this.buyBtn      = this.requireElement<HTMLButtonElement>(container, '#hud-buy');
    this.upgradeBtn  = this.requireElement<HTMLButtonElement>(container, '#hud-upgrade');
    this.upgradePanelEl = this.requireElement(container, '#hud-upgrade-panel');

    this.upgradeBtns = {
      damage: this.requireElement<HTMLButtonElement>(container, '#upg-damage'),
      speed:  this.requireElement<HTMLButtonElement>(container, '#upg-speed'),
      hp:     this.requireElement<HTMLButtonElement>(container, '#upg-hp'),
    };
    this.upgradeLvlEls = {
      damage: this.requireElement(container, '#upg-damage-lvl'),
      speed:  this.requireElement(container, '#upg-speed-lvl'),
      hp:     this.requireElement(container, '#upg-hp-lvl'),
    };
    this.upgradeCostEls = {
      damage: this.requireElement(container, '#upg-damage-cost'),
      speed:  this.requireElement(container, '#upg-speed-cost'),
      hp:     this.requireElement(container, '#upg-hp-cost'),
    };

    this.buyBtn.addEventListener('click', handlers.onBuy);
    this.requireElement<HTMLButtonElement>(container, '#hud-reset').addEventListener('click', handlers.onReset);
    this.requireElement<HTMLButtonElement>(container, '#hud-pause').addEventListener('click', handlers.onPause);
    this.upgradeBtn.addEventListener('click', () => this.toggleUpgradePanel());

    for (const kind of UPGRADE_KINDS) {
      this.upgradeBtns[kind].addEventListener('click', () => handlers.onUpgrade(kind));
    }
  }

  setKills(n: number): void {
    this.killsEl.textContent = String(n);
  }

  setHealth(current: number, max: number): void {
    this.healthEl.textContent = `${current}/${max}`;
  }

  setWave(n: number): void {
    this.waveEl.textContent = String(n);
  }

  setGunCount(n: number): void {
    this.gunsEl.textContent = String(n);
  }

  setMoney(n: number): void {
    this.moneyEl.textContent = `$${n}`;
  }

  setBuyCost(n: number): void {
    this.buyCostEl.textContent = String(n);
  }

  setBuyEnabled(enabled: boolean): void {
    this.buyBtn.disabled = !enabled;
    this.buyBtn.classList.toggle('is-disabled', !enabled);
  }

  setUpgradeLevel(kind: UpgradeKind, level: number): void {
    this.upgradeLvlEls[kind].textContent = String(level);
  }

  setUpgradeCost(kind: UpgradeKind, cost: number): void {
    this.upgradeCostEls[kind].textContent = String(cost);
  }

  setUpgradeEnabled(kind: UpgradeKind, enabled: boolean): void {
    this.upgradeBtns[kind].disabled = !enabled;
    this.upgradeBtns[kind].classList.toggle('is-disabled', !enabled);
  }

  closeUpgradePanel(): void {
    if (!this.upgradePanelOpen) return;
    this.upgradePanelOpen = false;
    this.upgradePanelEl.classList.remove('is-open');
    this.upgradeBtn.classList.remove('is-active');
  }

  showWaveNotice(wave: number): void {
    if (this.waveNoticeHideTimer !== null) window.clearTimeout(this.waveNoticeHideTimer);
    if (this.waveNoticeClearTimer !== null) window.clearTimeout(this.waveNoticeClearTimer);

    this.waveNoticeEl.textContent = wave === TOTAL_WAVES ? 'FINAL WAVE' : `WAVE ${wave}`;
    this.waveNoticeEl.classList.remove('is-visible');
    window.requestAnimationFrame(() => this.waveNoticeEl.classList.add('is-visible'));

    this.waveNoticeHideTimer = window.setTimeout(() => {
      this.waveNoticeEl.classList.remove('is-visible');
    }, WAVE_NOTICE_VISIBLE_MS);

    this.waveNoticeClearTimer = window.setTimeout(() => {
      this.waveNoticeEl.textContent = '';
      this.waveNoticeHideTimer = null;
      this.waveNoticeClearTimer = null;
    }, WAVE_NOTICE_CLEAR_MS);
  }

  showVictory(): void {
    this.statusEl.textContent = 'VICTORY';
    this.statusEl.classList.add('is-visible');
    this.statusEl.classList.remove('text-[#ff4d00]');
    this.statusEl.classList.add('text-[#ffd400]');
  }

  showDefeat(): void {
    this.statusEl.textContent = 'DEFEAT';
    this.statusEl.classList.add('is-visible');
    this.statusEl.classList.remove('text-[#ffd400]');
    this.statusEl.classList.add('text-[#ff4d00]');
  }

  hideStatus(): void {
    this.statusEl.classList.remove('is-visible');
    this.statusEl.textContent = '';
  }

  private toggleUpgradePanel(): void {
    this.upgradePanelOpen = !this.upgradePanelOpen;
    this.upgradePanelEl.classList.toggle('is-open', this.upgradePanelOpen);
    this.upgradeBtn.classList.toggle('is-active', this.upgradePanelOpen);
  }

  private requireElement<T extends HTMLElement = HTMLElement>(container: HTMLElement, selector: string): T {
    const el = container.querySelector<T>(selector);
    if (!el) throw new Error(`HUD element not found: ${selector}`);
    return el;
  }

  private template(): string {
    return `
<div class="absolute top-3.5 left-3.5 text-sm leading-relaxed pointer-events-none [text-shadow:0_1px_2px_rgba(0,0,0,0.7)]">
  <div class="inline-block bg-[#120c08]/70 ring-1 ring-[#ff4d00]/25 rounded-md px-2.5 py-1.5 mb-1.5">
    <span class="opacity-70">Kills:</span>
    <span class="font-bold text-[#ffd400]" id="hud-kills">0</span>
  </div>
  <br/>
  <div class="inline-block bg-[#120c08]/70 ring-1 ring-[#ff4d00]/25 rounded-md px-2.5 py-1.5 mb-1.5">
    <span class="opacity-70">HP:</span>
    <span class="font-bold text-[#ff6b3d]" id="hud-health">10/10</span>
  </div>
  <br/>
  <div class="inline-block bg-[#120c08]/70 ring-1 ring-[#ff4d00]/25 rounded-md px-2.5 py-1.5 mb-1.5">
    <span class="opacity-70">Wave:</span>
    <span class="font-bold text-[#ffd400]" id="hud-wave">1</span>
    <span class="opacity-70">/ ${TOTAL_WAVES}</span>
  </div>
  <br/>
  <div class="inline-block bg-[#120c08]/70 ring-1 ring-[#ff4d00]/25 rounded-md px-2.5 py-1.5 mb-1.5">
    <span class="opacity-70">Cash:</span>
    <span class="font-bold text-[#ffd400]" id="hud-money">$0</span>
  </div>
  <br/>
  <div class="inline-block bg-[#120c08]/70 ring-1 ring-[#ff4d00]/25 rounded-md px-2.5 py-1.5">
    <span class="opacity-70">Guns:</span>
    <span class="font-bold text-[#ffd400]" id="hud-guns">0</span>
    <span class="opacity-70">/ ${GUN_SLOT_COUNT}</span>
  </div>
</div>

<div class="absolute top-3.5 right-3.5 flex gap-2">
  <button id="hud-pause" class="hud-icon-btn hud-icon-btn--neutral" aria-label="Pause">Pause</button>
  <button id="hud-reset" class="hud-icon-btn hud-icon-btn--danger" aria-label="Reset">Reset</button>
</div>

<div
  id="hud-status"
  class="status-overlay absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
         text-6xl md:text-7xl font-extrabold tracking-widest
         [text-shadow:0_4px_14px_rgba(0,0,0,0.8)]"
></div>

<div
  id="hud-wave-notice"
  class="wave-notice-overlay absolute top-[42%] left-1/2 -translate-x-1/2 -translate-y-1/2
         text-4xl md:text-5xl font-extrabold tracking-widest text-[#ffd400]
         [text-shadow:0_4px_14px_rgba(0,0,0,0.8)]"
></div>

<div class="absolute bottom-32 left-1/2 -translate-x-1/2 text-xs text-white/75 pointer-events-none text-center max-w-[90vw]">
  Drag a sphere onto another sphere of the same tier to merge it into the next color.
</div>

<div class="absolute bottom-5 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3">
  <div id="hud-upgrade-panel" class="upgrade-panel flex gap-2">
    <button id="upg-damage" class="upgrade-card">
      <div class="upgrade-card__title">Damage</div>
      <div class="upgrade-card__lvl">Lvl <span id="upg-damage-lvl">0</span></div>
      <div class="upgrade-card__cost">$<span id="upg-damage-cost">0</span></div>
    </button>
    <button id="upg-speed" class="upgrade-card">
      <div class="upgrade-card__title">Speed</div>
      <div class="upgrade-card__lvl">Lvl <span id="upg-speed-lvl">0</span></div>
      <div class="upgrade-card__cost">$<span id="upg-speed-cost">0</span></div>
    </button>
    <button id="upg-hp" class="upgrade-card">
      <div class="upgrade-card__title">HP</div>
      <div class="upgrade-card__lvl">Lvl <span id="upg-hp-lvl">0</span></div>
      <div class="upgrade-card__cost">$<span id="upg-hp-cost">0</span></div>
    </button>
  </div>

  <div class="flex gap-2.5 items-center">
    <button id="hud-buy" class="hud-action-btn hud-action-btn--buy">
      Buy Gun <span class="opacity-90">$<span id="hud-buy-cost">0</span></span>
    </button>
    <button id="hud-upgrade" class="hud-action-btn hud-action-btn--upgrade hud-action-btn--pulse">
      Upgrade
    </button>
  </div>
</div>
    `.trim();
  }
}
