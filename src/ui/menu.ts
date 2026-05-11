type MenuHandlers = {
  onPlay: () => void;
  onToggleMusic: () => void;
  isMusicEnabled: () => boolean;
  onVolumeChange: (volume: number) => void;
  getVolume: () => number;
};

type PauseMenuHandlers = {
  onContinue: () => void;
  onToggleMusic: () => void;
  isMusicEnabled: () => boolean;
  onVolumeChange: (volume: number) => void;
  getVolume: () => number;
};

type ButtonVariant = 'primary' | 'neutral';

const MENU_ID = 'menu';
const PAUSE_MENU_ID = 'pause-menu';

const overlayClass = [
  'fixed inset-0 z-50 flex items-center justify-center',
  'bg-black/35 backdrop-blur-xs',
].join(' ');

const buttonBaseClass = [
  'group relative cursor-pointer overflow-hidden rounded-full p-0.75',
  'text-xl font-bold text-white',
  'transition-all duration-300 hover:-translate-y-0.5 active:translate-y-px',
  'shadow-[0_0_18px_rgba(0,0,0,0.35)]',
].join(' ');

const buttonVariantClass: Record<ButtonVariant, string> = {
  primary: [
    'bg-[#c43000]',
    'shadow-[0_0_18px_rgba(255,77,0,0.35)]',
    'hover:shadow-[0_0_35px_rgba(255,77,0,0.85)]',
  ].join(' '),
  neutral: [
    'bg-[#2a1f1b]',
    'shadow-[0_0_18px_rgba(255,138,10,0.18)]',
    'hover:shadow-[0_0_28px_rgba(255,138,10,0.35)]',
  ].join(' '),
};

export class Menu {
  private readonly container: HTMLElement;
  private readonly handlers: MenuHandlers;
  private mainMenuEl: HTMLElement | null = null;
  private pauseMenuEl: HTMLElement | null = null;
  private loadingEl: HTMLElement | null = null;

  constructor(container: HTMLElement, handlers: MenuHandlers) {
    this.container = container;
    this.handlers = handlers;
    this.showLoading();
  }

  setLoaded(): void {
    this.hideLoading();
    this.showMainMenu(this.handlers);
  }

  private showLoading(): void {
    this.container.insertAdjacentHTML('beforeend', this.loadingTemplate());
    this.loadingEl = this.requireElement('loading-screen');
  }

  private hideLoading(): void {
    this.loadingEl?.remove();
    this.loadingEl = null;
  }

  showPauseMenu(handlers: PauseMenuHandlers): void {
    if (this.pauseMenuEl) return;

    this.container.insertAdjacentHTML('beforeend', this.pauseMenuTemplate());
    this.pauseMenuEl = this.requireElement(PAUSE_MENU_ID);

    const continueBtn = this.pauseMenuEl.querySelector<HTMLButtonElement>('#continue-button');
    if (!continueBtn) throw new Error('#continue-button not found in pause menu');

    continueBtn.addEventListener('click', () => {
      this.hidePauseMenu();
      handlers.onContinue();
    });
    this.bindAudioControls(this.pauseMenuEl, handlers);
  }

  private showMainMenu(handlers: MenuHandlers): void {
    this.container.insertAdjacentHTML('beforeend', this.mainMenuTemplate());
    this.mainMenuEl = this.requireElement(MENU_ID);

    const playBtn = this.mainMenuEl.querySelector<HTMLButtonElement>('#play-button');
    if (!playBtn) throw new Error('#play-button not found in menu');

    playBtn.addEventListener('click', () => {
      this.hideMainMenu();
      handlers.onPlay();
    });
    this.bindAudioControls(this.mainMenuEl, handlers);
  }

  private hideMainMenu(): void {
    this.mainMenuEl?.remove();
    this.mainMenuEl = null;
  }

  private hidePauseMenu(): void {
    this.pauseMenuEl?.remove();
    this.pauseMenuEl = null;
  }

  private requireElement(id: string): HTMLElement {
    const el = this.container.querySelector<HTMLElement>(`#${id}`);
    if (!el) throw new Error(`#${id} not found`);
    return el;
  }

  private bindAudioControls(
    root: HTMLElement,
    handlers: Pick<MenuHandlers, 'onToggleMusic' | 'isMusicEnabled' | 'onVolumeChange' | 'getVolume'>,
  ): void {
    const button = root.querySelector<HTMLButtonElement>('[data-music-toggle]');
    if (!button) throw new Error('[data-music-toggle] not found in menu');

    const label = button.querySelector<HTMLElement>('[data-button-label]');
    if (!label) throw new Error('[data-button-label] not found in music button');

    const syncLabel = (): void => {
      label.textContent = handlers.isMusicEnabled() ? 'Music: On' : 'Music: Off';
    };

    syncLabel();
    button.addEventListener('click', () => {
      handlers.onToggleMusic();
      syncLabel();
    });

    const slider = root.querySelector<HTMLInputElement>('[data-volume-slider]');
    if (slider) {
      slider.value = handlers.getVolume().toString();
      const onChange = (e: Event) => {
        const target = e.target as HTMLInputElement;
        handlers.onVolumeChange(parseFloat(target.value));
      };
      slider.addEventListener('input', onChange);
      slider.addEventListener('change', onChange);
    }
  }

  private mainMenuTemplate(): string {
    return `
<div id="${MENU_ID}" class="${overlayClass}">
  <div class="flex flex-col items-center gap-y-5 justify-center">
    ${this.actionButtonTemplate({ id: 'play-button', label: 'Play', variant: 'primary' })}
    ${this.actionButtonTemplate({
      id: 'music-button',
      label: 'Music: On',
      variant: 'neutral',
      attributes: 'data-music-toggle',
    })}
    ${this.volumeSliderTemplate('music-volume')}
  </div>
</div>
    `.trim();
  }

  private loadingTemplate(): string {
    return `
<div id="loading-screen" class="${overlayClass}">
  <div class="flex flex-col items-center gap-y-5 justify-center">
    <div class="w-14 h-14 border-4 border-[#c43000] border-t-transparent rounded-full animate-spin shadow-[0_0_15px_rgba(255,77,0,0.5)]"></div>
    <div class="text-white font-bold tracking-widest text-xl [text-shadow:0_2px_4px_rgba(0,0,0,0.8)] animate-pulse">LOADING...</div>
  </div>
</div>
    `.trim();
  }

  private pauseMenuTemplate(): string {
    return `
<div id="${PAUSE_MENU_ID}" class="${overlayClass}">
  <div class="flex flex-col items-center gap-y-10 justify-center">
    <div class="text-4xl md:text-5xl font-extrabold tracking-widest [text-shadow:0_4px_14px_rgba(0,0,0,0.8)]">
      PAUSED
    </div>
    ${this.actionButtonTemplate({ id: 'continue-button', label: 'Continue', variant: 'neutral' })}
    ${this.actionButtonTemplate({
      id: 'pause-music-button',
      label: 'Music: On',
      variant: 'neutral',
      attributes: 'data-music-toggle',
    })}
    ${this.volumeSliderTemplate('pause-music-volume')}
  </div>
</div>
    `.trim();
  }

  private actionButtonTemplate(options: {
    id: string;
    label: string;
    variant: ButtonVariant;
    attributes?: string;
  }): string {
    return `
<button
  id="${options.id}"
  class="${buttonBaseClass} ${buttonVariantClass[options.variant]}"
  ${options.attributes ?? ''}
>
  <span
    class="animated-border-fire absolute inset-0 rounded-full opacity-0 transition-opacity duration-300 group-hover:opacity-100"
  ></span>
  <span
    class="pointer-events-none absolute -inset-4.5 rounded-full animated-border-fire opacity-0 blur-xl transition-opacity duration-300 group-hover:opacity-90"
  ></span>
  <span
    class="relative z-10 block rounded-full bg-[#120c08] px-7 py-3 transition-colors duration-300 group-hover:bg-[#1a0905]"
    data-button-label
  >
    ${options.label}
  </span>
</button>
    `.trim();
  }

  private volumeSliderTemplate(id: string): string {
    return `
<div class="flex items-center gap-3 w-48 mt-2 opacity-90 transition-opacity hover:opacity-100">
  <span class="text-white/70 text-sm font-bold tracking-wider">VOL</span>
  <input
    type="range"
    id="${id}"
    data-volume-slider
    min="0"
    max="0.05"
    step="0.001"
    class="w-full h-3 bg-[#2a1f1b] rounded-lg appearance-none cursor-pointer outline-none shadow-[0_0_10px_rgba(255,138,10,0.1)] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-8 [&::-webkit-slider-thumb]:h-8 [&::-webkit-slider-thumb]:bg-[#ff8a0a] [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(255,138,10,0.5)] [&::-moz-range-thumb]:w-8 [&::-moz-range-thumb]:h-8 [&::-moz-range-thumb]:bg-[#ff8a0a] [&::-moz-range-thumb]:border-none [&::-moz-range-thumb]:rounded-full"
  />
</div>
    `.trim();
  }
}
