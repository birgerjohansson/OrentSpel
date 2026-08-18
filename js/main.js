import { Renderer } from './ui/Renderer.js';
import { GameController } from './logic/GameController.js';

async function loadConfig() {
  const [configResponse, settingsResponse] = await Promise.all([
    fetch('./config/game-config.json'),
    fetch('/api/settings', { cache: 'no-store' })
  ]);
  if (!configResponse.ok || !settingsResponse.ok) throw new Error('Kunde inte läsa spelkonfigurationen.');
  const config = await configResponse.json();
  const settings = await settingsResponse.json();
  Object.assign(config.game, settings);
  config.settings = settings;
  return config;
}

async function boot() {
  const root = document.querySelector('#app');
  try {
    const config = await loadConfig();
    const renderer = new Renderer(root, config);
    const showStart = () => renderer.showStart(
      () => new GameController(renderer, config).start(),
      () => renderer.showSettings(config.settings, async settings => {
        const response = await fetch('/api/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(settings) });
        if (!response.ok) throw new Error('Kunde inte spara inställningarna.');
        const saved = await response.json();
        Object.assign(config.game, saved); config.settings = saved;
        showStart();
      }, showStart)
    );
    showStart();
  } catch (error) {
    root.innerHTML = `<p style="padding:2rem;color:white">${error.message}</p>`;
    console.error(error);
  }
}

boot();
