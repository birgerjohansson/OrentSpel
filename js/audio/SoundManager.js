export class SoundManager {
  constructor() { this.context = null; }

  play(kind) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    this.context ??= new AudioContext();
    if (this.context.state === 'suspended') this.context.resume();
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    const good = kind === 'correct';
    oscillator.type = good ? 'sine' : 'sawtooth';
    oscillator.frequency.setValueAtTime(good ? 570 : 150, this.context.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(good ? 880 : 80, this.context.currentTime + .14);
    gain.gain.setValueAtTime(.0001, this.context.currentTime);
    gain.gain.exponentialRampToValueAtTime(.09, this.context.currentTime + .015);
    gain.gain.exponentialRampToValueAtTime(.0001, this.context.currentTime + .19);
    oscillator.connect(gain).connect(this.context.destination);
    oscillator.start(); oscillator.stop(this.context.currentTime + .2);
  }
}
