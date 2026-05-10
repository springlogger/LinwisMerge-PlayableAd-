import './assets/styles/main.css';
import { Game } from './Game';


const appContainer = document.getElementById('app');
if (!appContainer) throw new Error('#app container not found in index.html');

const game = new Game(appContainer);
void (async () => {
  await game.init();
})();
