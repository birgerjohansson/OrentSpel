export class GameState {
  constructor(config, players = config.players) {
    this.config = config;
    this.scores = new Map(players.map(player => [player.id, 0]));
    this.teamScore = 0;
    this.activeItems = new Map();
    this.roundStats = { correct: 0, wrong: 0, mistakes: {} };
  }

  score(playerId, amount) {
    const value = (this.scores.get(playerId) ?? 0) + amount;
    this.scores.set(playerId, value);
    this.teamScore = Math.max(0, this.teamScore + amount);
    return this.teamScore;
  }

  itemsForPlayer(playerId) {
    return [...this.activeItems.values()].filter(item => item.playerId === playerId).length;
  }

  addItem(item) { this.activeItems.set(item.id, item); }
  removeItem(id) { this.activeItems.delete(id); }

  recordSort(item, binId, correct) {
    if (correct) { this.roundStats.correct += 1; return; }
    this.roundStats.wrong += 1;
    const key = `${item.categoryId}:${binId}`;
    this.roundStats.mistakes[key] = (this.roundStats.mistakes[key] || 0) + 1;
  }
}
