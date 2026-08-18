export class GameState {
  constructor(config) {
    this.config = config;
    this.scores = new Map(config.players.map(player => [player.id, 0]));
    this.activeItems = new Map();
  }

  score(playerId, amount) {
    const value = (this.scores.get(playerId) ?? 0) + amount;
    this.scores.set(playerId, value);
    return value;
  }

  itemsForPlayer(playerId) {
    return [...this.activeItems.values()].filter(item => item.playerId === playerId).length;
  }

  addItem(item) { this.activeItems.set(item.id, item); }
  removeItem(id) { this.activeItems.delete(id); }
}
