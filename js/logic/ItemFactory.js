export class ItemFactory {
  constructor(config) { this.config = config; this.sequence = 0; }

  create(playerId) {
    const category = this.pick(this.config.categories);
    const assets = category.assets || [];
    return {
      id: `trash-${++this.sequence}`,
      playerId,
      categoryId: category.id,
      categoryLabel: category.label,
      asset: assets.length ? this.pick(assets) : null,
      symbol: category.symbol || category.icon,
      createdAt: performance.now()
    };
  }

  pick(items) { return items[Math.floor(Math.random() * items.length)]; }
}
