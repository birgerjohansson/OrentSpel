import { Renderer } from './ui/Renderer.js';
import { GameController } from './logic/GameController.js';

async function loadConfig() {
  const response = await fetch('./config/game-config.json');
  if (!response.ok) throw new Error('Kunde inte läsa spelkonfigurationen.');
  return response.json();
}

async function boot() {
  const root = document.querySelector('#app');
  try {
    const config = await loadConfig();
    const renderer = new Renderer(root, config);
    renderer.showStart(() => new GameController(renderer, config).start());
  } catch (error) {
    root.innerHTML = `<p style="padding:2rem;color:white">${error.message}</p>`;
    console.error(error);
  }
}

boot();
