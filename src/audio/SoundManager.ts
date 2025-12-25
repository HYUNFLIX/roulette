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
   * Collision sound - natural marble impact with variety
   * @param intensity - Impact strength (0-1), affects volume and pitch
   */
  private playCollision(intensity: number = 0.5): void {
    const ctx = this.audioContext!;
    const now = ctx.currentTime;

    // Clamp intensity between 0.1 and 1
    const clampedIntensity = Math.max(0.1, Math.min(1, intensity));

    // Random pitch variation for natural feel
    const pitchVariation = 0.9 + Math.random() * 0.2;

    // Base frequency varies with intensity (higher impact = lower thud + higher click)
    const baseFreq = (300 + clampedIntensity * 400) * pitchVariation;

    // Duration based on intensity
    const duration = 0.04 + clampedIntensity * 0.06;

    // Layer 1: Sharp attack "click" sound
    const clickOsc = ctx.createOscillator();
    const clickGain = ctx.createGain();
    const clickFilter = ctx.createBiquadFilter();

    clickOsc.type = 'triangle';
    clickOsc.frequency.setValueAtTime(baseFreq * 2, now);
    clickOsc.frequency.exponentialRampToValueAtTime(baseFreq * 0.5, now + duration);

    clickFilter.type = 'bandpass';
    clickFilter.frequency.value = baseFreq * 1.5;
    clickFilter.Q.value = 2;

    const clickVol = 0.15 * clampedIntensity;
    clickGain.gain.setValueAtTime(clickVol, now);
    clickGain.gain.exponentialRampToValueAtTime(0.001, now + duration * 0.8);

    clickOsc.connect(clickFilter);
    clickFilter.connect(clickGain);
    clickGain.connect(this.masterGain!);

    clickOsc.start(now);
    clickOsc.stop(now + duration);

    // Layer 2: Body resonance (lower frequency)
    const bodyOsc = ctx.createOscillator();
    const bodyGain = ctx.createGain();

    bodyOsc.type = 'sine';
    bodyOsc.frequency.setValueAtTime(baseFreq * 0.5, now);
    bodyOsc.frequency.exponentialRampToValueAtTime(baseFreq * 0.3, now + duration);

    const bodyVol = 0.1 * clampedIntensity;
    bodyGain.gain.setValueAtTime(bodyVol, now);
    bodyGain.gain.exponentialRampToValueAtTime(0.001, now + duration * 1.2);

    bodyOsc.connect(bodyGain);
    bodyGain.connect(this.masterGain!);

    bodyOsc.start(now);
    bodyOsc.stop(now + duration * 1.5);

    // Layer 3: Short noise burst for texture (soft)
    const noiseLength = 0.015;
    const bufferSize = Math.floor(ctx.sampleRate * noiseLength);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.1));
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'highpass';
    noiseFilter.frequency.value = 2000;

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.03 * clampedIntensity, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + noiseLength);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.masterGain!);

    noise.start(now);
    noise.stop(now + noiseLength);
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
