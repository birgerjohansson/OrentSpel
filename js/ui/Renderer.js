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

  showCountdown(onFinished) {
    this.root.innerHTML = `
      <section class="countdown-screen" aria-live="assertive" aria-label="Spelet börjar snart">
        <span class="countdown-label">GÖR ER REDO</span>
        <strong class="countdown-number">3</strong>
      </section>`;
    const number = this.root.querySelector('.countdown-number');
    let value = 3;
    const interval = window.setInterval(() => {
      value -= 1;
      if (value === 0) {
        window.clearInterval(interval);
        onFinished();
        return;
      }
      number.textContent = value;
      number.classList.remove('is-changing');
      void number.offsetWidth;
      number.classList.add('is-changing');
    }, 1000);
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
    timer.classList.toggle('is-urgent', seconds > 0 && seconds <= 5);
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

  showResults(scores, onRestart, onShowStatistics) {
    const ranking = [...this.config.players]
      .sort((first, second) => scores.get(second.id) - scores.get(first.id));
    this.root.innerHTML = `
      <section class="result-screen" aria-label="Resultat">
        <div class="result-card">
          <p class="result-kicker">ORENT SPEL · TIDEN ÄR SLUT</p>
          <h1>Resultat</h1>
          <ol class="result-list">${ranking.map((player, index) => `<li style="--player-color:${player.color}" aria-label="Placering ${index + 1}, ${scores.get(player.id)} poäng"><span class="result-place">${index + 1}</span><span class="player-dot"></span><strong>${scores.get(player.id)} p</strong></li>`).join('')}</ol>
          <div class="result-actions"><button class="stats-button" type="button" aria-label="Visa statistik">i</button><button class="restart-button" type="button">SPELA IGEN</button></div>
        </div>
      </section>`;
    this.root.querySelector('.restart-button').addEventListener('click', onRestart, { once: true });
    this.root.querySelector('.stats-button').addEventListener('click', onShowStatistics);
  }

  showStatistics(stats) {
    const categoryLabel = id => this.config.categories.find(category => category.id === id)?.label || id;
    const storeKey = Object.entries(stats.mistakes).sort(([, first], [, second]) => second - first)[0]?.[0];
    const [from, to] = storeKey ? storeKey.split(':') : [];
    const commonMistake = storeKey ? `${categoryLabel(from)} → ${categoryLabel(to)} (${stats.mistakes[storeKey]} gånger)` : 'Inga felsorteringar ännu';
    const modal = document.createElement('section');
    modal.className = 'statistics-modal';
    modal.setAttribute('role', 'dialog'); modal.setAttribute('aria-modal', 'true'); modal.setAttribute('aria-label', 'Statistik');
    modal.innerHTML = `<div class="statistics-card"><button class="statistics-close" type="button" aria-label="Stäng statistik">×</button><h2>Statistik</h2><dl><div><dt>Bästa poäng</dt><dd>${stats.bestScore} p</dd></div><div><dt>Rätt sorterat</dt><dd>${stats.correct}</dd></div><div><dt>Fel sorterat</dt><dd>${stats.wrong}</dd></div><div><dt>Vanligaste felsortering</dt><dd>${escapeHTML(commonMistake)}</dd></div></dl></div>`;
    this.root.append(modal);
    modal.querySelector('.statistics-close').addEventListener('click', () => modal.remove());
  }

  showSettings(settings, onSave, onClose, onResetStatistics) {
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
          <button class="reset-statistics" type="button" data-reset-statistics>ÅTERSTÄLL STATISTIK</button>
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
    this.root.querySelector('[data-reset-statistics]').addEventListener('click', event => {
      onResetStatistics();
      event.currentTarget.textContent = 'STATISTIK ÅTERSTÄLLD';
      event.currentTarget.disabled = true;
    });
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
