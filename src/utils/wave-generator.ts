export interface WaveGeneratorConfig {
  period: number;
  randomMin: number;
  randomMax: number;
  amplitudeMin: number;
  amplitudeMax: number;
}

export class WaveGenerator {
  private config: WaveGeneratorConfig;
  private phase: number = 0;
  private lastUpdate: number = Date.now();

  constructor(config: WaveGeneratorConfig) {
    this.config = config;
  }

  updateConfig(config: Partial<WaveGeneratorConfig>) {
    this.config = { ...this.config, ...config };
  }

  getNextValue(): number {
    const now = Date.now();
    const deltaTime = now - this.lastUpdate;

    let period = this.config.period;
    period += Math.random() * (this.config.randomMax - this.config.randomMin) + this.config.randomMin;

    this.phase += deltaTime / period;
    this.phase %= 2;

    this.lastUpdate = now;

    let normalizedPhase: number;
    if (this.phase < 1) {
      normalizedPhase = this.phase;
    } else {
      normalizedPhase = 2 - this.phase;
    }

    const amplitudeRange = this.config.amplitudeMax - this.config.amplitudeMin;
    const value = this.config.amplitudeMin + normalizedPhase * amplitudeRange;

    return value;
  }
}