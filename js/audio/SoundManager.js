export class SoundManager {
  constructor(enabled = true) { this.context = null; this.enabled = enabled; }

  play(kind) {
    if (!this.enabled) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    this.context ??= new AudioContext();
    if (this.context.state === 'suspended') this.context.resume();
    if (kind === 'fanfare') return this.playFanfare();
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    const now = this.context.currentTime;
    const sound = {
      tick: { type: 'square', start: 1040, end: 900, duration: .055, volume: .035 },
      correct: { type: 'sine', start: 570, end: 880, duration: .19, volume: .09 },
      wrong: { type: 'sawtooth', start: 150, end: 80, duration: .19, volume: .07 }
    }[kind] || { type: 'sine', start: 440, end: 440, duration: .1, volume: .05 };
    oscillator.type = sound.type;
    oscillator.frequency.setValueAtTime(sound.start, now);
    oscillator.frequency.exponentialRampToValueAtTime(sound.end, now + sound.duration * .75);
    gain.gain.setValueAtTime(.0001, now);
    gain.gain.exponentialRampToValueAtTime(sound.volume, now + .012);
    gain.gain.exponentialRampToValueAtTime(.0001, now + sound.duration);
    oscillator.connect(gain).connect(this.context.destination);
    oscillator.start(); oscillator.stop(now + sound.duration + .01);
  }

  playFanfare() {
    const now = this.context.currentTime;
    [523.25, 659.25, 783.99, 1046.5].forEach((frequency, index) => {
      const oscillator = this.context.createOscillator();
      const gain = this.context.createGain();
      const start = now + index * .11;
      oscillator.type = index === 3 ? 'triangle' : 'sine';
      oscillator.frequency.setValueAtTime(frequency, start);
      gain.gain.setValueAtTime(.0001, start);
      gain.gain.exponentialRampToValueAtTime(.075, start + .02);
      gain.gain.exponentialRampToValueAtTime(.0001, start + (index === 3 ? .38 : .18));
      oscillator.connect(gain).connect(this.context.destination);
      oscillator.start(start); oscillator.stop(start + (index === 3 ? .4 : .2));
    });
  }
}
