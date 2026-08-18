const escapeHTML = value => String(value).replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char]);

export class Renderer {
  constructor(root, config) { this.root = root; this.config = config; }

  showStart(onStart) {
    this.root.innerHTML = '<section class="start-screen"><div class="start-content"><h1>ORENT SPEL</h1><button class="start-button" type="button">STARTA</button></div></section>';
    this.root.querySelector('button').addEventListener('click', onStart, { once: true });
  }

  showGame(scores) {
    this.root.innerHTML = `
      <section class="game" aria-label="Sopsorteringsspel">
        <div class="hud">
          ${this.config.players.map(player => `<div class="player-score" data-score="${player.id}" style="--player-color:${player.color}"><span class="player-dot"></span><span>${player.name}</span><strong>${scores.get(player.id)}</strong></div>`).join('')}
          <output class="game-timer" aria-label="Tid kvar" style="--progress: 1"><span>02:00</span></output>
        </div>
        <div class="play-area" aria-label="Skräp att sortera"></div>
        <nav class="bins" aria-label="Soptunnor">${this.config.categories.map(category => `<button class="bin" type="button" data-bin="${category.id}" style="--bin-color:${category.binColor};--bin-text:${category.binText || '#fff'}"><span class="bin__icon">${escapeHTML(category.icon)}</span><span class="bin__name">${escapeHTML(category.label)}</span></button>`).join('')}</nav>
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
          <ol class="result-list">${ranking.map((player, index) => `<li style="--player-color:${player.color}"><span class="result-place">${index + 1}</span><span class="player-dot"></span><span>${player.name}</span><strong>${scores.get(player.id)} p</strong></li>`).join('')}</ol>
          <button class="restart-button" type="button">SPELA IGEN</button>
        </div>
      </section>`;
    this.root.querySelector('.restart-button').addEventListener('click', onRestart, { once: true });
  }
}
