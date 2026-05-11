const zombieDeathUrl = new URL('../assets/sound/555412__tonsil5__zombie-death-1.wav', import.meta.url).href;
const coinUrl = new URL('../assets/sound/213988__fenrirfangs__coin-fall-3.wav', import.meta.url).href;
const shootUrl = new URL('../assets/sound/348164__djfroyd__laser-one-shot-1.wav', import.meta.url).href;
const musicUrls = [
  new URL('../assets/sound/monume-retro-arcade-game-music-498052.mp3', import.meta.url).href,
];

const ZOMBIE_DEATH_VOLUME = 0.14;
const ZOMBIE_DEATH_RATE = 0.78;
const ZOMBIE_DEATH_COOLDOWN_MS = 140;
const COIN_VOLUME = 0.07;
const COIN_RATE = 1.0;
const COIN_COOLDOWN_MS = 65;
const COIN_START_OFFSET_SECONDS = 0;
const SHOOT_VOLUME = 0.04;
const SHOOT_RATE = 1.0;
const SHOOT_COOLDOWN_MS = 40;
const MUSIC_NORMAL_FILTER_HZ = 18000;
const MUSIC_MUFFLED_FILTER_HZ = 620;

interface SoundOptions {
  volume: number;
  playbackRate: number;
  cooldownMs: number;
  startAtSeconds?: number;
}

interface SoundState {
  readonly pool: HTMLAudioElement[];
  lastPlayedAt: number;
  nextIndex: number;
}

export class AudioSystem {
  private readonly sounds = new Map<string, SoundState>();
  private readonly music = new Audio(this.pickMusicUrl());
  private audioContext: AudioContext | null = null;
  private musicFilter: BiquadFilterNode | null = null;
  private musicGain: GainNode | null = null;
  private musicEnabled = true;
  private musicMuffled = false;
  private musicVolume = 0.025;

  constructor() {
    this.register('zombieDeath', zombieDeathUrl, 3);
    this.register('coin', coinUrl, 4);
    this.register('shoot', shootUrl, 8);
    this.music.loop = true;
    this.music.preload = 'auto';
    this.applyMusicMix();
  }

  startMusic(): void {
    if (!this.musicEnabled) return;

    this.ensureMusicGraph();
    this.applyMusicMix();
    void this.audioContext?.resume();
    void this.music.play().catch(() => undefined);
  }

  setMusicEnabled(enabled: boolean): void {
    this.musicEnabled = enabled;
    if (!enabled) {
      this.music.pause();
      return;
    }

    this.startMusic();
  }

  toggleMusic(): boolean {
    this.setMusicEnabled(!this.musicEnabled);
    return this.musicEnabled;
  }

  isMusicEnabled(): boolean {
    return this.musicEnabled;
  }

  setMusicVolume(volume: number): void {
    this.musicVolume = volume;
    this.applyMusicMix();
  }

  getMusicVolume(): number {
    return this.musicVolume;
  }

  setMusicMuffled(muffled: boolean): void {
    this.musicMuffled = muffled;
    this.applyMusicMix();
  }

  playZombieDeath(): void {
    this.play('zombieDeath', {
      volume: ZOMBIE_DEATH_VOLUME,
      playbackRate: ZOMBIE_DEATH_RATE + (Math.random() - 0.5) * 0.06,
      cooldownMs: ZOMBIE_DEATH_COOLDOWN_MS,
    });
  }

  playCoin(): void {
    this.play('coin', {
      volume: COIN_VOLUME,
      playbackRate: COIN_RATE + (Math.random() - 0.5) * 0.08,
      cooldownMs: COIN_COOLDOWN_MS,
      startAtSeconds: COIN_START_OFFSET_SECONDS,
    });
  }

  playShoot(): void {
    this.play('shoot', {
      volume: SHOOT_VOLUME,
      playbackRate: SHOOT_RATE + (Math.random() - 0.5) * 0.15,
      cooldownMs: SHOOT_COOLDOWN_MS,
    });
  }

  private register(name: string, url: string, poolSize: number): void {
    const pool = Array.from({ length: poolSize }, () => {
      const audio = new Audio(url);
      audio.preload = 'auto';
      return audio;
    });

    this.sounds.set(name, {
      pool,
      lastPlayedAt: -Infinity,
      nextIndex: 0,
    });
  }

  private play(name: string, options: SoundOptions): void {
    const sound = this.sounds.get(name);
    if (!sound) return;

    const now = window.performance.now();
    if (now - sound.lastPlayedAt < options.cooldownMs) return;

    const audio = sound.pool[sound.nextIndex];
    sound.nextIndex = (sound.nextIndex + 1) % sound.pool.length;
    sound.lastPlayedAt = now;

    audio.pause();
    audio.currentTime = options.startAtSeconds ?? 0;
    audio.volume = options.volume;
    audio.playbackRate = options.playbackRate;
    void audio.play().catch(() => {
      sound.lastPlayedAt = -Infinity;
    });
  }

  private pickMusicUrl(): string {
    return musicUrls[Math.floor(Math.random() * musicUrls.length)];
  }

  private ensureMusicGraph(): void {
    if (this.audioContext || this.musicFilter || this.musicGain) return;

    try {
      this.audioContext = new AudioContext();
      const source = this.audioContext.createMediaElementSource(this.music);
      
      this.musicFilter = this.audioContext.createBiquadFilter();
      this.musicFilter.type = 'lowpass';
      
      this.musicGain = this.audioContext.createGain();

      source.connect(this.musicFilter);
      this.musicFilter.connect(this.musicGain);
      this.musicGain.connect(this.audioContext.destination);
    } catch {
      this.audioContext = null;
      this.musicFilter = null;
      this.musicGain = null;
    }
  }

  private applyMusicMix(): void {
    const targetVolume = this.musicMuffled ? this.musicVolume * 0.4 : this.musicVolume;

    if (!this.musicFilter || !this.audioContext || !this.musicGain) {
      this.music.volume = targetVolume;
      return;
    }

    this.music.volume = 1.0;
    this.musicGain.gain.setTargetAtTime(targetVolume, this.audioContext.currentTime, 0.08);

    const targetFrequency = this.musicMuffled ? MUSIC_MUFFLED_FILTER_HZ : MUSIC_NORMAL_FILTER_HZ;
    this.musicFilter.frequency.setTargetAtTime(targetFrequency, this.audioContext.currentTime, 0.08);
  }
}
