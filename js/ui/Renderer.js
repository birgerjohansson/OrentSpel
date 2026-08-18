const escapeHTML = value => String(value).replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char]);

export class Renderer {
  constructor(root, config) { this.root = root; this.config = config; }

  showStart(onStart, onSettings) {
    this.root.innerHTML = `
      <section class="start-screen">
        <div class="start-content">
          <h1 class="game-title">ORENT SPEL</h1>
          <p class="start-instructions">Varje spelare väljer en färg.<br>Sortera sedan avfallet i rätt tunna.</p>
          <div class="color-choices" aria-label="Välj en av dessa spelarfärger">${this.config.players.map(player => `<span class="color-choice" style="--player-color:${player.color}" aria-label="Spelarfärg"></span>`).join('')}</div>
          <button class="start-button" type="button">STARTA</button>
        </div>
      </section>`;
    this.root.querySelector('.start-button').addEventListener('click', onStart, { once: true });
    this.addLongPress(this.root.querySelector('.game-title'), onSettings);
  }

  showGame(scores) {
    this.root.innerHTML = `
      <section class="game" aria-label="Sopsorteringsspel">
        <div class="hud">
          ${this.config.players.map(player => `<div class="player-score" data-score="${player.id}" style="--player-color:${player.color}" aria-label="Poäng"><strong>${scores.get(player.id)}</strong></div>`).join('')}
          <output class="game-timer" aria-label="Tid kvar" style="--progress: 1"><span>02:00</span></output>
        </div>
        <div class="play-area" aria-label="Skräp att sortera"></div>
        <nav class="bins" aria-label="Soptunnor">${this.config.categories.map(category => `<button class="bin" type="button" data-bin="${category.id}" aria-label="${escapeHTML(category.label)}" style="--bin-color:${category.binColor};--bin-text:${category.binText || '#fff'}"><span class="bin__icon"><img src="${encodeURI(category.binAsset)}" alt=""></span></button>`).join('')}</nav>
      </section>`;
    this.game = this.root.querySelector('.game');
    this.playArea = this.root.querySelector('.play-area');
  }

  addItem(item, player, position) {
    const element = document.createElement('article');
    element.className = 'trash-object is-arriving';
    element.dataset.itemId = item.id;
    element.dataset.playerId = item.playerId;
    element.style.setProperty('--object-color', player.color);
    element.style.left = `${position.x}px`;
    element.style.top = `${position.y}px`;
    element.setAttribute('aria-label', `${item.categoryLabel}, ${player.name}`);
    element.innerHTML = `<img src="${encodeURI(item.asset)}" alt="" draggable="false">`;
    this.playArea.append(element);
    window.setTimeout(() => element.classList.remove('is-arriving'), 300);
    return element;
  }

  removeItem(element, expired = false) {
    if (!element?.isConnected) return;
    if (!expired) { element.remove(); return; }
    element.classList.add('is-expiring');
    window.setTimeout(() => element.remove(), 300);
  }

  updateScore(playerId, score) { this.root.querySelector(`[data-score="${playerId}"] strong`).textContent = score; }

  updateTimer(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainder = String(seconds % 60).padStart(2, '0');
    const timer = this.root.querySelector('.game-timer');
    timer.style.setProperty('--progress', String(seconds / this.config.game.roundDurationSeconds));
    timer.querySelector('span').textContent = `${minutes}:${remainder}`;
  }

  flashBin(binId, success) {
    const bin = this.root.querySelector(`[data-bin="${binId}"]`);
    if (!bin) return;
    bin.classList.remove('is-success', 'is-error');
    void bin.offsetWidth;
    bin.classList.add(success ? 'is-success' : 'is-error');
  }

  feedback(x, y, text, bad = false) {
    const element = document.createElement('span');
    element.className = `feedback${bad ? ' feedback--bad' : ''}`;
    element.textContent = text;
    element.style.left = `${x}px`; element.style.top = `${y}px`;
    this.game.append(element);
    window.setTimeout(() => element.remove(), 780);
  }

  showResults(scores, onRestart) {
    const ranking = [...this.config.players]
      .sort((first, second) => scores.get(second.id) - scores.get(first.id));
    this.root.innerHTML = `
      <section class="result-screen" aria-label="Resultat">
        <div class="result-card">
          <p class="result-kicker">ORENT SPEL · TIDEN ÄR SLUT</p>
          <h1>Resultat</h1>
          <ol class="result-list">${ranking.map((player, index) => `<li style="--player-color:${player.color}" aria-label="Placering ${index + 1}, ${scores.get(player.id)} poäng"><span class="result-place">${index + 1}</span><span class="player-dot"></span><strong>${scores.get(player.id)} p</strong></li>`).join('')}</ol>
          <button class="restart-button" type="button">SPELA IGEN</button>
        </div>
      </section>`;
    this.root.querySelector('.restart-button').addEventListener('click', onRestart, { once: true });
  }

  showSettings(settings, onSave, onClose) {
    this.root.innerHTML = `
      <section class="settings-screen" aria-label="Spelinställningar">
        <div class="settings-card">
          <h1>Inställningar</h1>
          <p>Ändringarna sparas automatiskt för nästa omgång.</p>
          <div class="settings-list">
            ${this.settingControl('Speltid', 'roundDurationSeconds', settings.roundDurationSeconds, 'sek', 10, 300, 10, 'sek')}
            ${this.settingControl('Skräp per färg', 'minimumItemsPerPlayer', settings.minimumItemsPerPlayer, '', 1, 6, 1, '')}
            ${this.settingControl('Skräp försvinner efter', 'itemLifetimeMs', settings.itemLifetimeMs / 1000, 'sek', 5, 30, 1, 'sek')}
            <div class="setting-row"><span>Ljud</span><button class="sound-toggle ${settings.soundEnabled ? 'is-on' : ''}" type="button" data-sound="${settings.soundEnabled}">${settings.soundEnabled ? 'PÅ' : 'AV'}</button></div>
          </div>
          <p class="settings-status" data-settings-status aria-live="polite"></p>
          <div class="settings-actions"><button class="secondary-button" type="button" data-close>AVBRYT</button><button class="restart-button" type="button" data-save>SPARA</button></div>
        </div>
      </section>`;
    this.root.querySelectorAll('[data-adjust]').forEach(button => button.addEventListener('click', () => {
      const input = this.root.querySelector(`[data-setting="${button.dataset.adjust}"]`);
      const next = Number(input.value) + Number(button.dataset.delta);
      input.value = String(Math.max(Number(input.min), Math.min(Number(input.max), next)));
    }));
    this.root.querySelector('.sound-toggle').addEventListener('click', event => {
      const button = event.currentTarget; const enabled = button.dataset.sound !== 'true';
      button.dataset.sound = String(enabled); button.textContent = enabled ? 'PÅ' : 'AV'; button.classList.toggle('is-on', enabled);
    });
    this.root.querySelector('[data-close]').addEventListener('click', onClose);
    this.root.querySelector('[data-save]').addEventListener('click', async event => {
      const saveButton = event.currentTarget;
      if (saveButton.disabled) return;
      const get = key => Number(this.root.querySelector(`[data-setting="${key}"]`).value);
      saveButton.disabled = true;
      try {
        await onSave({ roundDurationSeconds: get('roundDurationSeconds'), minimumItemsPerPlayer: get('minimumItemsPerPlayer'), itemLifetimeMs: get('itemLifetimeMs') * 1000, soundEnabled: this.root.querySelector('.sound-toggle').dataset.sound === 'true' });
      } catch (error) {
        this.root.querySelector('[data-settings-status]').textContent = 'Kunde inte spara. Kontrollera serveranslutningen och försök igen.';
        saveButton.disabled = false;
      }
    });
  }

  settingControl(label, key, value, suffix, min, max, step, ariaSuffix) {
    return `<div class="setting-row"><span>${label}</span><div class="stepper"><button type="button" data-adjust="${key}" data-delta="-${step}" aria-label="Minska ${label}">−</button><output><input type="number" data-setting="${key}" value="${value}" min="${min}" max="${max}" step="${step}" readonly>${suffix ? ` ${suffix}` : ''}</output><button type="button" data-adjust="${key}" data-delta="${step}" aria-label="Öka ${label}">+</button></div></div>`;
  }

  addLongPress(element, callback) {
    let timer;
    const clear = () => window.clearTimeout(timer);
    element.addEventListener('pointerdown', event => { event.preventDefault(); timer = window.setTimeout(callback, 3000); });
    element.addEventListener('pointerup', clear); element.addEventListener('pointerleave', clear); element.addEventListener('pointercancel', clear);
  }
}
