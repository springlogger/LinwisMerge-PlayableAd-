type MenuHandlers = {
  onPlay: () => void;
};

type PauseMenuHandlers = {
  onContinue: () => void;
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
  private mainMenuEl: HTMLElement | null = null;
  private pauseMenuEl: HTMLElement | null = null;

  constructor(container: HTMLElement, handlers: MenuHandlers) {
    this.container = container;
    this.showMainMenu(handlers);
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

  private mainMenuTemplate(): string {
    return `
<div id="${MENU_ID}" class="${overlayClass}">
  ${this.actionButtonTemplate({ id: 'play-button', label: 'Play', variant: 'primary' })}
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
  </div>
</div>
    `.trim();
  }

  private actionButtonTemplate(options: {
    id: string;
    label: string;
    variant: ButtonVariant;
  }): string {
    return `
<button
  id="${options.id}"
  class="${buttonBaseClass} ${buttonVariantClass[options.variant]}"
>
  <span
    class="animated-border-fire absolute inset-0 rounded-full opacity-0 transition-opacity duration-300 group-hover:opacity-100"
  ></span>
  <span
    class="pointer-events-none absolute -inset-4.5 rounded-full animated-border-fire opacity-0 blur-xl transition-opacity duration-300 group-hover:opacity-90"
  ></span>
  <span
    class="relative z-10 block rounded-full bg-[#120c08] px-7 py-3 transition-colors duration-300 group-hover:bg-[#1a0905]"
  >
    ${options.label}
  </span>
</button>
    `.trim();
  }
}
