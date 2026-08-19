const STORAGE_KEY = 'orent-spel-statistics-v1';

const emptyStats = () => ({ bestScore: 0, correct: 0, wrong: 0, mistakes: {} });

export class StatisticsStore {
  load() {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
      return stored && typeof stored === 'object' ? { ...emptyStats(), ...stored, mistakes: stored.mistakes || {} } : emptyStats();
    } catch {
      return emptyStats();
    }
  }

  recordRound(state) {
    const stats = this.load();
    stats.bestScore = Math.max(stats.bestScore, state.teamScore);
    stats.correct += state.roundStats.correct;
    stats.wrong += state.roundStats.wrong;
    for (const [mistake, count] of Object.entries(state.roundStats.mistakes)) stats.mistakes[mistake] = (stats.mistakes[mistake] || 0) + count;
    this.save(stats);
    return stats;
  }

  clear() { localStorage.removeItem(STORAGE_KEY); }

  save(stats) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(stats)); } catch { /* Statistik är ett frivilligt lokalt tillägg. */ }
  }

  mostCommonMistake(stats) {
    const entry = Object.entries(stats.mistakes).sort(([, first], [, second]) => second - first)[0];
    return entry ? { key: entry[0], count: entry[1] } : null;
  }
}
