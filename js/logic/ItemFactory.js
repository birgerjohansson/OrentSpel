export class ItemFactory {
  constructor(config, categories = config.categories) { this.config = config; this.categories = categories; this.sequence = 0; }

  create(playerId) {
    const category = this.pick(this.categories);
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
