import { Renderer } from './ui/Renderer.js';
import { GameController } from './logic/GameController.js';
import { StatisticsStore } from './logic/StatisticsStore.js';
import { SettingsStore } from './logic/SettingsStore.js';

async function loadConfig(settingsStore) {
  const [configResponse, defaultsResponse] = await Promise.all([
    fetch('./config/game-config.json'),
    fetch('./config/runtime-settings.json')
  ]);
  if (!configResponse.ok || !defaultsResponse.ok) throw new Error('Kunde inte läsa spelkonfigurationen.');
  const config = await configResponse.json();
  const defaults = await defaultsResponse.json();
  const settings = await settingsStore.load(defaults);
  Object.assign(config.game, settings);
  config.settings = settings;
  return config;
}

async function boot() {
  const root = document.querySelector('#app');
  try {
    const settingsStore = new SettingsStore();
    const config = await loadConfig(settingsStore);
    const renderer = new Renderer(root, config);
    const statistics = new StatisticsStore();
    const showStart = () => renderer.showStart(
      () => renderer.showCountdown(() => new GameController(renderer, config, showStart, statistics).start()),
      () => renderer.showSettings(config.settings, async settings => {
        const saved = await settingsStore.save(settings);
        Object.assign(config.game, saved); config.settings = saved;
        showStart();
      }, showStart, () => statistics.clear())
    );
    showStart();
  } catch (error) {
    root.innerHTML = `<p style="padding:2rem;color:white">${error.message}</p>`;
    console.error(error);
  }
}

boot();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(error => console.warn('Offline-läge kunde inte aktiveras.', error)));
}
