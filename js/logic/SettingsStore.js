const STORAGE_KEY = 'orent-spel-settings-v1';

export class SettingsStore {
  async load(defaultSettings) {
    const localSettings = this.readLocal();
    try {
      const response = await fetch('/api/settings', { cache: 'no-store' });
      if (response.ok) {
        const settings = await response.json();
        this.writeLocal(settings);
        return { ...defaultSettings, ...settings };
      }
    } catch { /* Statisk hosting har ingen API-endpoint. */ }
    return { ...defaultSettings, ...(localSettings || {}) };
  }

  async save(settings) {
    this.writeLocal(settings);
    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      if (response.ok) return { ...settings, ...await response.json() };
    } catch { /* Lokalt lagrade inställningar fungerar utan server. */ }
    return settings;
  }

  readLocal() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)); } catch { return null; }
  }

  writeLocal(settings) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(settings)); } catch { /* Spelinställningar är ett frivilligt lokalt tillägg. */ }
  }
}
