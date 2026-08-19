export class LevelManager {
  constructor(config, levelConfig, playerCount) {
    this.config = config;
    this.levelConfig = levelConfig;
    this.playerCount = playerCount;
  }

  get count() { return this.levelConfig.levels.length; }

  get(index) {
    const source = this.levelConfig.levels[index];
    const difficulty = this.levelConfig.difficulty[this.config.settings.difficulty] || this.levelConfig.difficulty.normal;
    return {
      ...source,
      index,
      categories: source.categoryIds.map(id => this.config.categories.find(category => category.id === id)).filter(Boolean),
      durationSeconds: Math.round(source.durationSeconds * difficulty.durationMultiplier),
      itemLifetimeMs: Math.round(source.itemLifetimeMs * difficulty.lifetimeMultiplier),
      targetScore: Math.ceil(source.baseTarget * this.playerCount * difficulty.targetMultiplier / 10) * 10,
      difficultyLabel: difficulty.label
    };
  }
}
