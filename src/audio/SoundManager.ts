/**
 * SoundManager - Web Audio API based sound effects
 * Synthesizes sounds programmatically without external files
 */

type SoundType = 'start' | 'collision' | 'goal' | 'finish' | 'click';

class SoundManagerClass {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private _enabled: boolean = true;
  private _volume: number = 0.5;

  get enabled(): boolean {
    return this._enabled;
  }

  set enabled(value: boolean) {
    this._enabled = value;
    if (this.masterGain) {
      this.masterGain.gain.value = value ? this._volume : 0;
    }
  }

  get volume(): number {
    return this._volume;
  }

  set volume(value: number) {
    this._volume = Math.max(0, Math.min(1, value));
    if (this.masterGain && this._enabled) {
      this.masterGain.gain.value = this._volume;
    }
  }

  private init(): void {
    if (this.audioContext) return;

    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.masterGain = this.audioContext.createGain();
      this.masterGain.gain.value = this._enabled ? this._volume : 0;
      this.masterGain.connect(this.audioContext.destination);
    } catch (e) {
      console.warn('Web Audio API not supported');
    }
  }

  /**
   * Play a synthesized sound effect
   * @param type - The type of sound to play
   * @param intensity - Optional intensity for collision sounds (0-1)
   */
  play(type: SoundType, intensity?: number): void {
    if (!this._enabled) return;
    this.init();
    if (!this.audioContext || !this.masterGain) return;

    // Resume audio context if suspended (required for user gesture)
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    switch (type) {
      case 'start':
        this.playStart();
        break;
      case 'collision':
        this.playCollision(intensity);
        break;
      case 'goal':
        this.playGoal();
        break;
      case 'finish':
        this.playFinish();
        break;
      case 'click':
        this.playClick();
        break;
    }
  }

  /**
   * Game start sound - ascending arpeggio
   */
  private playStart(): void {
    const ctx = this.audioContext!;
    const now = ctx.currentTime;

    const frequencies = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6

    frequencies.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.value = freq;

      gain.gain.setValueAtTime(0, now + i * 0.1);
      gain.gain.linearRampToValueAtTime(0.3, now + i * 0.1 + 0.05);
      gain.gain.linearRampToValueAtTime(0, now + i * 0.1 + 0.2);

      osc.connect(gain);
      gain.connect(this.masterGain!);

      osc.start(now + i * 0.1);
      osc.stop(now + i * 0.1 + 0.3);
    });
  }

  /**
   * Collision sound - short impact with variable intensity
   * @param intensity - Impact strength (0-1), affects volume and pitch
   */
  private playCollision(intensity: number = 0.5): void {
    const ctx = this.audioContext!;
    const now = ctx.currentTime;

    // Clamp intensity between 0.2 and 1
    const clampedIntensity = Math.max(0.2, Math.min(1, intensity));

    // Create noise burst
    const duration = 0.03 + clampedIntensity * 0.04; // 30-70ms
    const bufferSize = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.15));
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    // Higher intensity = higher cutoff frequency for brighter sound
    filter.frequency.value = 400 + clampedIntensity * 600;

    const gain = ctx.createGain();
    // Volume based on intensity
    const volume = 0.08 + clampedIntensity * 0.15;
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain!);

    noise.start(now);
    noise.stop(now + duration);
  }

  /**
   * Goal reached sound - victory chord
   */
  private playGoal(): void {
    const ctx = this.audioContext!;
    const now = ctx.currentTime;

    // Major chord
    const frequencies = [523.25, 659.25, 783.99]; // C5, E5, G5

    frequencies.forEach((freq) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.value = freq;

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.8);

      osc.connect(gain);
      gain.connect(this.masterGain!);

      osc.start(now);
      osc.stop(now + 0.8);
    });
  }

  /**
   * Game finish sound - fanfare
   */
  private playFinish(): void {
    const ctx = this.audioContext!;
    const now = ctx.currentTime;

    // Fanfare sequence
    const notes = [
      { freq: 523.25, start: 0, dur: 0.15 },     // C5
      { freq: 659.25, start: 0.15, dur: 0.15 },  // E5
      { freq: 783.99, start: 0.3, dur: 0.15 },   // G5
      { freq: 1046.50, start: 0.45, dur: 0.4 },  // C6 (long)
    ];

    notes.forEach(({ freq, start, dur }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'square';
      osc.frequency.value = freq;

      gain.gain.setValueAtTime(0.15, now + start);
      gain.gain.setValueAtTime(0.15, now + start + dur - 0.05);
      gain.gain.linearRampToValueAtTime(0, now + start + dur);

      osc.connect(gain);
      gain.connect(this.masterGain!);

      osc.start(now + start);
      osc.stop(now + start + dur + 0.1);
    });
  }

  /**
   * UI click sound - short tick
   */
  private playClick(): void {
    const ctx = this.audioContext!;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.value = 1000;

    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);

    osc.connect(gain);
    gain.connect(this.masterGain!);

    osc.start(now);
    osc.stop(now + 0.05);
  }
}

export const SoundManager = new SoundManagerClass();
