import { ItemFactory } from './ItemFactory.js';
import { isCorrectSort } from './SortRules.js';
import { GameState } from './GameState.js';
import { SoundManager } from '../audio/SoundManager.js';

export class GameController {
  constructor(renderer, config) {
    this.renderer = renderer; this.config = config;
    this.state = new GameState(config); this.factory = new ItemFactory(config); this.sound = new SoundManager(config.settings.soundEnabled);
    this.elements = new Map(); this.dragging = new Map(); this.spawnTimer = null; this.clockTimer = null;
    this.isRunning = false; this.endsAt = 0;
  }

  start() {
    this.renderer.showGame(this.state.scores);
    this.isRunning = true;
    this.endsAt = performance.now() + this.config.game.roundDurationSeconds * 1000;
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
    for (const player of this.config.players) {
      while (this.state.itemsForPlayer(player.id) < this.config.game.minimumItemsPerPlayer) this.spawn(player);
    }
  }

  spawn(player) {
    const item = this.factory.create(player.id);
    const position = this.findOpenPosition();
    const element = this.renderer.addItem(item, player, position);
    item.element = element;
    this.state.addItem(item); this.elements.set(item.id, element);
    item.expiry = window.setTimeout(() => this.expire(item), this.config.game.itemLifetimeMs);
  }

  findOpenPosition() {
    const area = this.renderer.playArea.getBoundingClientRect();
    const width = Math.min(Math.max(68, area.width * .042), 116);
    const height = width * 1.08;
    const binTops = [...this.renderer.root.querySelectorAll('.bin')].map(bin => bin.getBoundingClientRect().top - area.top);
    const safeBottom = Math.max(90, Math.min(...binTops) - height - 18);
    const existing = [...this.elements.values()].map(element => ({ x: parseFloat(element.style.left), y: parseFloat(element.style.top) }));
    for (let tries = 0; tries < 28; tries++) {
      const x = 8 + Math.random() * Math.max(1, area.width - width - 16);
      const y = Math.max(92, area.height * .15) + Math.random() * Math.max(1, safeBottom - Math.max(92, area.height * .15));
      if (existing.every(point => Math.hypot(point.x - x, point.y - y) > width * .75)) return { x, y };
    }
    return { x: Math.random() * Math.max(1, area.width - width), y: Math.max(92, Math.random() * Math.max(1, safeBottom)) };
  }

  beginDrag(event) {
    const element = event.target.closest('.trash-object');
    if (!element || this.dragging.has(event.pointerId)) return;
    const item = this.state.activeItems.get(element.dataset.itemId);
    if (!item) return;
    event.preventDefault();
    const rect = element.getBoundingClientRect();
    this.dragging.set(event.pointerId, { item, element, offsetX: event.clientX - rect.left, offsetY: event.clientY - rect.top });
    element.setPointerCapture(event.pointerId); element.classList.add('dragging');
  }

  moveDrag(event) {
    const drag = this.dragging.get(event.pointerId);
    if (!drag) return;
    const area = this.renderer.playArea.getBoundingClientRect();
    const width = drag.element.offsetWidth; const height = drag.element.offsetHeight;
    const x = Math.max(0, Math.min(area.width - width, event.clientX - area.left - drag.offsetX));
    const y = Math.max(0, Math.min(area.height - height, event.clientY - area.top - drag.offsetY));
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
    const points = correct ? this.config.game.correctScore : this.config.game.wrongScore;
    const score = this.state.score(item.playerId, points);
    this.renderer.updateScore(item.playerId, score);
    this.renderer.flashBin(binId, correct);
    this.renderer.feedback(x, y, `${points > 0 ? '+' : ''}${points}`, !correct);
    this.sound.play(correct ? 'correct' : 'wrong');
    this.remove(item);
    window.setTimeout(() => this.ensureItems(), 80);
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

  updateClock() {
    const remaining = Math.max(0, Math.ceil((this.endsAt - performance.now()) / 1000));
    this.renderer.updateTimer(remaining);
    if (remaining === 0) this.finish();
  }

  finish() {
    if (!this.isRunning) return;
    this.isRunning = false;
    window.clearInterval(this.spawnTimer);
    window.clearInterval(this.clockTimer);
    for (const item of this.state.activeItems.values()) window.clearTimeout(item.expiry);
    this.dragging.clear();
    this.renderer.showResults(this.state.scores, () => {
      const nextRound = new GameController(this.renderer, this.config);
      nextRound.start();
    });
  }
}
