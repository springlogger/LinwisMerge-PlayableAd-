import '@fortawesome/fontawesome-free/css/fontawesome.min.css';
import '@fortawesome/fontawesome-free/css/solid.min.css';
import './assets/styles/main.css';
import { Game } from './Game';

const DOUBLE_TAP_ZOOM_MS = 320;

let lastTouchEnd = 0;

document.addEventListener('dblclick', (event) => {
  event.preventDefault();
}, { capture: true });

document.addEventListener('touchend', (event) => {
  const now = window.performance.now();
  if (now - lastTouchEnd <= DOUBLE_TAP_ZOOM_MS) {
    event.preventDefault();
  }
  lastTouchEnd = now;
}, { passive: false, capture: true });

const appContainer = document.getElementById('app');
if (!appContainer) throw new Error('#app container not found in index.html');

const game = new Game(appContainer);
void (async () => {
  await game.init();
})();
