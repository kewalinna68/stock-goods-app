/**
 * Zero-dependency Web Audio API Sound Effects for Grocery POS & Inventory
 * No external media files required. Synthesized directly in the browser.
 */

const SOUND_STORAGE_KEY = 'grocery_stock_sound_enabled';

class SoundEffectsService {
  private ctx: AudioContext | null = null;
  private soundEnabled: boolean = true;

  constructor() {
    // Load sound preference from localStorage
    const saved = localStorage.getItem(SOUND_STORAGE_KEY);
    if (saved !== null) {
      this.soundEnabled = saved === 'true';
    }
  }

  public isEnabled(): boolean {
    return this.soundEnabled;
  }

  public setEnabled(enabled: boolean): void {
    this.soundEnabled = enabled;
    localStorage.setItem(SOUND_STORAGE_KEY, String(enabled));
  }

  public toggle(): boolean {
    const next = !this.soundEnabled;
    this.setEnabled(next);
    if (next) {
      this.playBeep();
    }
    return next;
  }

  private getContext(): AudioContext | null {
    if (!this.soundEnabled) return null;

    try {
      if (!this.ctx) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          this.ctx = new AudioContextClass();
        }
      }

      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }

      return this.ctx;
    } catch {
      return null;
    }
  }

  /**
   * Cash Register "Ka-Ching!" sound effect
   * Synthesizes mechanical lever click + bright resonant bell and coin shimmer
   */
  public playKaChing(): void {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // 1. Initial mechanical register latch / click
      const clickOsc = ctx.createOscillator();
      const clickGain = ctx.createGain();
      clickOsc.type = 'square';
      clickOsc.frequency.setValueAtTime(800, now);
      clickOsc.frequency.exponentialRampToValueAtTime(200, now + 0.04);
      clickGain.gain.setValueAtTime(0.2, now);
      clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      clickOsc.connect(clickGain);
      clickGain.connect(ctx.destination);
      clickOsc.start(now);
      clickOsc.stop(now + 0.05);

      // 2. Main Bell Chime #1 (High frequency bell ring)
      const bell1 = ctx.createOscillator();
      const bellGain1 = ctx.createGain();
      bell1.type = 'sine';
      bell1.frequency.setValueAtTime(1568, now + 0.03); // G6
      bellGain1.gain.setValueAtTime(0.35, now + 0.03);
      bellGain1.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      bell1.connect(bellGain1);
      bellGain1.connect(ctx.destination);
      bell1.start(now + 0.03);
      bell1.stop(now + 0.65);

      // 3. Main Bell Chime #2 (Higher sparkle harmonic)
      const bell2 = ctx.createOscillator();
      const bellGain2 = ctx.createGain();
      bell2.type = 'triangle';
      bell2.frequency.setValueAtTime(2637, now + 0.07); // E7
      bellGain2.gain.setValueAtTime(0.28, now + 0.07);
      bellGain2.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
      bell2.connect(bellGain2);
      bellGain2.connect(ctx.destination);
      bell2.start(now + 0.07);
      bell2.stop(now + 0.75);

      // 4. Coin clink shimmer
      const coin = ctx.createOscillator();
      const coinGain = ctx.createGain();
      coin.type = 'sine';
      coin.frequency.setValueAtTime(3520, now + 0.12); // A7
      coinGain.gain.setValueAtTime(0.2, now + 0.12);
      coinGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      coin.connect(coinGain);
      coinGain.connect(ctx.destination);
      coin.start(now + 0.12);
      coin.stop(now + 0.5);
    } catch (e) {
      console.warn('Audio playKaChing error', e);
    }
  }

  /**
   * Retail Barcode Scanner "Beep"
   * Clean 1760Hz (A6) high-pitch scanner sound
   */
  public playBeep(): void {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1760, now);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.25, now + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.075);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.08);
    } catch (e) {
      console.warn('Audio playBeep error', e);
    }
  }

  /**
   * Low Stock Warning alert sound
   * Special two-tone descending alarm chord indicating stock <= minStock
   */
  public playWarningLowStock(): void {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // Tone 1: 659Hz (E5)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(659, now);
      gain1.gain.setValueAtTime(0.18, now);
      gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.13);

      // Tone 2: 440Hz (A4) low alert warning
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sawtooth';
      osc2.frequency.setValueAtTime(440, now + 0.14);
      gain2.gain.setValueAtTime(0.25, now + 0.14);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.14);
      osc2.stop(now + 0.46);
    } catch (e) {
      console.warn('Audio playWarningLowStock error', e);
    }
  }

  /**
   * Stock In / Action Success Chime (ascending pleasant notes)
   */
  public playSuccess(): void {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const notes = [523.25, 659.25, 783.99]; // C5, E5, G5

      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const start = now + i * 0.07;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.001, start);
        gain.gain.linearRampToValueAtTime(0.2, start + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.2);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(start);
        osc.stop(start + 0.22);
      });
    } catch (e) {
      console.warn('Audio playSuccess error', e);
    }
  }
}

export const audioService = new SoundEffectsService();
