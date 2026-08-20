import { ItemFactory } from './ItemFactory.js';
import { isCorrectSort } from './SortRules.js';
import { GameState } from './GameState.js';
import { LevelManager } from './LevelManager.js';
import { SoundManager } from '../audio/SoundManager.js';
import { StatisticsStore } from './StatisticsStore.js';

export class GameController {
  constructor(renderer, config, levelConfig, playerCount, onReturnToStart, statistics = new StatisticsStore()) {
    this.renderer = renderer; this.config = config; this.onReturnToStart = onReturnToStart; this.statistics = statistics;
    this.players = config.players.slice(0, playerCount);
    this.levels = new LevelManager(config, levelConfig, playerCount);
    this.sound = new SoundManager(config.settings.soundEnabled);
    this.levelIndex = 0; this.campaignScore = 0; this.resultTimer = null;
    this.elements = new Map(); this.dragging = new Map();
  }

  start() { this.prepareLevel(); }

  prepareLevel() {
    this.level = this.levels.get(this.levelIndex);
    this.renderer.showLevelIntro(this.level, this.players, () => this.renderer.showCountdown(() => this.startLevel(), this.level.backgroundAsset));
  }

  startLevel() {
    this.state = new GameState(this.config, this.players);
    this.factory = new ItemFactory(this.config, this.level.categories);
    this.elements.clear(); this.dragging.clear(); this.lastTickSecond = null;
    this.renderer.showGame(this.state.teamScore, this.players, this.level);
    this.isRunning = true;
    this.endsAt = performance.now() + this.level.durationSeconds * 1000;
    this.bindEvents(); this.ensureItems(); this.updateClock();
    this.spawnTimer = window.setInterval(() => this.ensureItems(), this.config.game.spawnCheckMs);
    this.clockTimer = window.setInterval(() => this.updateClock(), 250);
  }

  bindEvents() {
    const area = this.renderer.playArea;
    area.addEventListener('pointerdown', event => this.beginDrag(event));
    area.addEventListener('pointermove', event => this.moveDrag(event));
    area.addEventListener('pointerup', event => this.endDrag(event));
    area.addEventListener('pointercancel', event => this.cancelDrag(event));
  }

  ensureItems() {
    if (!this.isRunning) return;
    for (const player of this.players) while (this.state.itemsForPlayer(player.id) < this.level.itemsPerPlayer) this.spawn(player);
  }

  spawn(player) {
    const item = this.factory.create(player.id);
    const element = this.renderer.addItem(item, player, this.findOpenPosition());
    item.element = element;
    this.state.addItem(item); this.elements.set(item.id, element);
    item.remainingLifetimeMs = this.randomItemLifetime();
    this.scheduleExpiry(item);
  }

  findOpenPosition() {
    const area = this.renderer.playArea.getBoundingClientRect();
    const width = Math.min(Math.max(68, area.width * .042), 116) * (this.config.settings.trashScale / 100);
    const height = width * 1.08;
    const binTops = [...this.renderer.root.querySelectorAll('.bin')].map(bin => bin.getBoundingClientRect().top - area.top);
    const safeBottom = Math.max(90, Math.min(...binTops) - height - 18);
    const existing = [...this.elements.values()].map(element => ({ x: parseFloat(element.style.left), y: parseFloat(element.style.top) }));
    for (let tries = 0; tries < 28; tries++) {
      const x = 8 + Math.random() * Math.max(1, area.width - width - 16);
      const top = Math.max(92, area.height * .15);
      const y = top + Math.random() * Math.max(1, safeBottom - top);
      if (existing.every(point => Math.hypot(point.x - x, point.y - y) > width * .75)) return { x, y };
    }
    return { x: Math.random() * Math.max(1, area.width - width), y: Math.max(92, Math.random() * Math.max(1, safeBottom)) };
  }

  beginDrag(event) {
    const element = event.target.closest('.trash-object');
    if (!element || this.dragging.has(event.pointerId)) return;
    const item = this.state.activeItems.get(element.dataset.itemId);
    if (!item || [...this.dragging.values()].some(drag => drag.item.id === item.id)) return;
    event.preventDefault();
    const rect = element.getBoundingClientRect();
    this.pauseExpiry(item);
    this.dragging.set(event.pointerId, { item, element, offsetX: event.clientX - rect.left, offsetY: event.clientY - rect.top });
    element.setPointerCapture(event.pointerId); element.classList.add('dragging');
  }

  moveDrag(event) {
    const drag = this.dragging.get(event.pointerId);
    if (!drag) return;
    const area = this.renderer.playArea.getBoundingClientRect();
    const x = Math.max(0, Math.min(area.width - drag.element.offsetWidth, event.clientX - area.left - drag.offsetX));
    const y = Math.max(0, Math.min(area.height - drag.element.offsetHeight, event.clientY - area.top - drag.offsetY));
    drag.element.style.left = `${x}px`; drag.element.style.top = `${y}px`;
  }

  endDrag(event) {
    const drag = this.dragging.get(event.pointerId);
    if (!drag) return;
    const target = this.binAtPosition(event.clientX, event.clientY);
    this.finishDrag(event.pointerId);
    if (target) this.sort(drag.item, target.dataset.bin, event.clientX, event.clientY);
  }

  cancelDrag(event) { if (this.dragging.has(event.pointerId)) this.finishDrag(event.pointerId); }

  finishDrag(pointerId) {
    const drag = this.dragging.get(pointerId); if (!drag) return;
    if (drag.element.hasPointerCapture(pointerId)) drag.element.releasePointerCapture(pointerId);
    drag.element.classList.remove('dragging'); this.dragging.delete(pointerId);
    if (this.state.activeItems.has(drag.item.id)) this.scheduleExpiry(drag.item);
  }

  binAtPosition(x, y) {
    return [...this.renderer.root.querySelectorAll('.bin')].find(bin => {
      const rect = bin.getBoundingClientRect();
      return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
    });
  }

  sort(item, binId, x, y) {
    if (!this.isRunning || !this.state.activeItems.has(item.id)) return;
    const correct = isCorrectSort(item, binId);
    this.state.recordSort(item, binId, correct);
    const points = correct ? this.config.game.correctScore : this.config.game.wrongScore;
    const score = this.state.score(item.playerId, points);
    this.renderer.updateTeamScore(score, this.level.targetScore);
    this.renderer.flashBin(binId, correct);
    this.renderer.feedback(x, y, `${points > 0 ? '+' : ''}${points}`, !correct);
    this.sound.play(correct ? 'correct' : 'wrong');
    this.remove(item);
    if (score >= this.level.targetScore) {
      this.isRunning = false; this.stopTimers();
      window.setTimeout(() => this.completeLevel(), 450);
    } else window.setTimeout(() => this.ensureItems(), 80);
  }

  expire(item) {
    if (!this.isRunning || !this.state.activeItems.has(item.id)) return;
    this.remove(item, true);
    window.setTimeout(() => this.ensureItems(), 340);
  }

  remove(item, expired = false) {
    window.clearTimeout(item.expiry);
    this.state.removeItem(item.id); this.elements.delete(item.id);
    this.renderer.removeItem(item.element, expired);
  }

  randomItemLifetime() { return Math.round(this.level.itemLifetimeMs * (.75 + Math.random() * .5)); }

  scheduleExpiry(item) {
    window.clearTimeout(item.expiry);
    item.expiresAt = performance.now() + item.remainingLifetimeMs;
    item.expiry = window.setTimeout(() => this.expire(item), item.remainingLifetimeMs);
  }

  pauseExpiry(item) {
    window.clearTimeout(item.expiry);
    item.remainingLifetimeMs = Math.max(1, item.expiresAt - performance.now());
  }

  updateClock() {
    const remaining = Math.max(0, Math.ceil((this.endsAt - performance.now()) / 1000));
    this.renderer.updateTimer(remaining, this.level.durationSeconds);
    if (remaining > 0 && remaining <= 5 && remaining !== this.lastTickSecond) { this.sound.play('tick'); this.lastTickSecond = remaining; }
    if (remaining === 0) this.failLevel();
  }

  stopTimers() {
    window.clearInterval(this.spawnTimer); window.clearInterval(this.clockTimer);
    for (const item of this.state.activeItems.values()) window.clearTimeout(item.expiry);
    this.dragging.clear();
  }

  completeLevel() {
    this.campaignScore += this.state.teamScore;
    const statistics = this.statistics.recordRound(this.state);
    this.sound.play('fanfare');
    if (this.levelIndex === this.levels.count - 1) {
      this.renderer.showCampaignComplete(this.campaignScore, this.levels.count, () => this.returnToStart(), () => this.renderer.showStatistics(statistics));
      this.resultTimer = window.setTimeout(() => this.returnToStart(), 60000);
      return;
    }
    const completed = this.level;
    this.levelIndex += 1;
    const next = this.levels.get(this.levelIndex);
    this.renderer.showLevelComplete(completed, next, () => this.prepareLevel());
  }

  failLevel() {
    if (!this.isRunning) return;
    this.isRunning = false; this.stopTimers();
    this.statistics.recordRound(this.state);
    this.renderer.showLevelFailed(this.level, this.state.teamScore, () => {
      window.clearTimeout(this.resultTimer);
      this.renderer.showCountdown(() => this.startLevel(), this.level.backgroundAsset);
    }, () => this.returnToStart());
    this.resultTimer = window.setTimeout(() => this.returnToStart(), 60000);
  }

  returnToStart() { window.clearTimeout(this.resultTimer); this.onReturnToStart(); }
}
