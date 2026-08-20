const escapeHTML = value => String(value).replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char]);

export class Renderer {
  constructor(root, config) { this.root = root; this.config = config; }

  showStart(onStart, onSettings) {
    this.root.innerHTML = `
      <section class="start-screen">
        <div class="start-content">
          <h1 class="game-title">ORENT SPEL</h1>
          <p class="start-instructions">Välj antal spelare och klara alla sju nivåer tillsammans.</p>
          <div class="player-count" role="group" aria-label="Antal spelare">${[1, 2, 3, 4].map(count => `<button type="button" data-player-count="${count}" class="${count === 1 ? 'is-selected' : ''}">${count}</button>`).join('')}</div>
          <div class="color-choices" aria-label="Aktiva spelarfärger">${this.config.players.map((player, index) => `<span class="color-choice ${index ? 'is-inactive' : ''}" data-player-color="${index + 1}" style="--player-color:${player.color}" aria-label="Spelarfärg"></span>`).join('')}</div>
          <button class="start-button" type="button">STARTA</button>
        </div>
        <button class="credits-button" type="button" aria-label="Visa information och tack">i</button>
      </section>`;
    let playerCount = 1;
    this.root.querySelectorAll('[data-player-count]').forEach(button => button.addEventListener('click', () => {
      playerCount = Number(button.dataset.playerCount);
      this.root.querySelectorAll('[data-player-count]').forEach(option => option.classList.toggle('is-selected', option === button));
      this.root.querySelectorAll('[data-player-color]').forEach(color => color.classList.toggle('is-inactive', Number(color.dataset.playerColor) > playerCount));
    }));
    this.root.querySelector('.start-button').addEventListener('click', () => onStart(playerCount), { once: true });
    this.root.querySelector('.credits-button').addEventListener('click', () => this.showCredits());
    this.addLongPress(this.root.querySelector('.game-title'), onSettings);
  }

  showCredits() {
    const modal = document.createElement('section');
    modal.className = 'credits-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-label', 'Information och tack');
    modal.innerHTML = `
      <div class="credits-card">
        <button class="credits-close" type="button" aria-label="Stäng information">×</button>
        <h2>Tack till</h2>
        <ul>
          <li>Codex</li>
          <li><a href="https://www.sverigesorterar.se" target="_blank" rel="noopener noreferrer">www.sverigesorterar.se</a></li>
          <li>Helsingborg Science Center</li>
        </ul>
      </div>`;
    this.root.append(modal);
    modal.querySelector('.credits-close').addEventListener('click', () => modal.remove());
    modal.addEventListener('click', event => { if (event.target === modal) modal.remove(); });
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

  showLevelIntro(level, players, onFinished) {
    this.root.innerHTML = `<section class="level-screen"><div class="level-card"><p class="level-kicker">${escapeHTML(level.difficultyLabel)}</p><h1>Nivå ${level.id}</h1><p>Samla <strong>${level.targetScore} poäng</strong> tillsammans</p><div class="level-bins">${level.categories.map(category => `<span style="--bin-color:${category.binColor}"><img src="${encodeURI(category.binAsset)}" alt="${escapeHTML(category.label)}"></span>`).join('')}</div><div class="active-colors">${players.map(player => `<span style="--player-color:${player.color}"></span>`).join('')}</div></div></section>`;
    window.setTimeout(onFinished, 2200);
  }

  showGame(teamScore, players, level) {
    const trashScale = this.config.settings.trashScale / 100;
    const binScale = this.config.settings.binScale / 100;
    const trashSize = Math.min(Math.max(68, window.innerWidth * .042), 116) * trashScale;
    const preferredBinWidth = window.innerWidth * .14 * binScale;
    const availableBinWidth = window.innerWidth * .94 / level.categories.length;
    const binWidth = Math.max(64, Math.min(preferredBinWidth, availableBinWidth));
    this.root.innerHTML = `
      <section class="game" aria-label="Sopsorteringsspel" style="--trash-size:${trashSize}px;--bin-width:${binWidth}px;--bin-count:${level.categories.length}">
        <div class="hud">
          <div class="level-indicator">NIVÅ ${level.id}</div>
          <div class="team-progress" aria-label="Framsteg mot nivåmålet">
            <span class="score-colors">${players.map(player => `<i style="--player-color:${player.color}"></i>`).join('')}</span>
            <div class="progress-meter" data-team-progress role="progressbar" aria-label="Sorterat skräp" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" style="--team-progress:0%"><span></span></div>
          </div>
          <output class="game-timer" aria-label="Tid kvar" style="--progress: 1"><span>02:00</span></output>
        </div>
        <div class="play-area" aria-label="Skräp att sortera"></div>
        <nav class="bins" aria-label="Soptunnor">${level.categories.map(category => `<button class="bin" type="button" data-bin="${category.id}" aria-label="${escapeHTML(category.label)}" style="--bin-color:${category.binColor};--bin-text:${category.binText || '#fff'}"><span class="bin__icon"><img src="${encodeURI(category.binAsset)}" alt=""></span></button>`).join('')}</nav>
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

  updateTeamScore(score, target) {
    const meter = this.root.querySelector('[data-team-progress]');
    const progress = Math.max(0, Math.min(100, Math.round(score / target * 100)));
    meter.style.setProperty('--team-progress', `${progress}%`);
    meter.setAttribute('aria-valuenow', String(progress));
  }

  updateTimer(seconds, totalSeconds) {
    const minutes = Math.floor(seconds / 60);
    const remainder = String(seconds % 60).padStart(2, '0');
    const timer = this.root.querySelector('.game-timer');
    timer.style.setProperty('--progress', String(seconds / totalSeconds));
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

  showLevelComplete(level, nextLevel, onNext) {
    this.root.innerHTML = `<section class="result-screen"><div class="result-card success-card"><p class="result-kicker">MÅLET ÄR NÅTT</p><h1>Nivå ${level.id} klar!</h1><p>Nästa nivå har ${nextLevel.categories.length} tunnor och snabbare skräp.</p><strong class="next-level">Nivå ${nextLevel.id}</strong></div></section>`;
    window.setTimeout(onNext, 2400);
  }

  showLevelFailed(level, score, onRetry, onStart) {
    this.root.innerHTML = `<section class="result-screen"><div class="result-card failed-card"><p class="result-kicker">TIDEN ÄR SLUT</p><h1>Nivå ${level.id}</h1><p>Ni fick <strong>${score} av ${level.targetScore} poäng</strong>.</p><div class="result-actions"><button class="secondary-button" type="button" data-start>TILL STARTSIDAN</button><button class="restart-button" type="button" data-retry>FÖRSÖK IGEN</button></div></div></section>`;
    this.root.querySelector('[data-retry]').addEventListener('click', onRetry, { once: true });
    this.root.querySelector('[data-start]').addEventListener('click', onStart, { once: true });
  }

  showCampaignComplete(score, levelCount, onRestart, onShowStatistics) {
    this.root.innerHTML = `<section class="result-screen" aria-label="Slutresultat"><div class="result-card success-card"><p class="result-kicker">ALLA NIVÅER KLARA</p><h1>Fantastiskt!</h1><p>Ni klarade ${levelCount} nivåer och samlade totalt</p><strong class="campaign-score">${score} poäng</strong><div class="result-actions"><button class="stats-button" type="button" aria-label="Visa statistik">i</button><button class="restart-button" type="button">TILL STARTSIDAN</button></div></div></section>`;
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
    modal.innerHTML = `<div class="statistics-card"><button class="statistics-close" type="button" aria-label="Stäng statistik">×</button><h2>Statistik</h2><dl><div><dt>Bästa lagpoäng</dt><dd>${stats.bestScore} p</dd></div><div><dt>Rätt sorterat</dt><dd>${stats.correct}</dd></div><div><dt>Fel sorterat</dt><dd>${stats.wrong}</dd></div><div><dt>Vanligaste felsortering</dt><dd>${escapeHTML(commonMistake)}</dd></div></dl></div>`;
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
            <div class="setting-row difficulty-row"><span>Svårighetsgrad</span><div class="difficulty-options">${['easy', 'normal', 'hard'].map((value, index) => `<button type="button" data-difficulty="${value}" class="${settings.difficulty === value ? 'is-selected' : ''}">${['LÄTT', 'NORMAL', 'SVÅR'][index]}</button>`).join('')}</div></div>
            ${this.settingControl('Skräpstorlek', 'trashScale', settings.trashScale, '%', 60, 130, 10, '%')}
            ${this.settingControl('Tunnstorlek', 'binScale', settings.binScale, '%', 60, 130, 10, '%')}
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
    this.root.querySelectorAll('[data-difficulty]').forEach(button => button.addEventListener('click', () => this.root.querySelectorAll('[data-difficulty]').forEach(option => option.classList.toggle('is-selected', option === button))));
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
        await onSave({ difficulty: this.root.querySelector('[data-difficulty].is-selected').dataset.difficulty, soundEnabled: this.root.querySelector('.sound-toggle').dataset.sound === 'true', trashScale: get('trashScale'), binScale: get('binScale') });
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
