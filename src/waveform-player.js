import WaveSurfer from 'wavesurfer.js';
import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions.esm.js';

/**
 * Owns waveform rendering, seeking, and bounded region playback.
 * वेवफ़ॉर्म, खोज और चुने हुए हिस्से के प्लेबैक को नियंत्रित करता है।
 */
export class WaveformPlayer {
  #region;
  #ready = false;

  constructor(
    container,
    {
      onStateChange = () => {},
      onStatus = () => {},
      onTimeChange = () => {},
      onReady = () => {},
    } = {},
  ) {
    this.onStateChange = onStateChange;
    this.onStatus = onStatus;
    this.onTimeChange = onTimeChange;
    this.onReady = onReady;
    this.regions = RegionsPlugin.create();
    this.wave = WaveSurfer.create({
      container,
      plugins: [this.regions],
      height: 112,
      waveColor: '#a8a29e',
      progressColor: '#d94b32',
      cursorColor: '#292524',
      barWidth: 2,
      barGap: 2,
      barRadius: 2,
      normalize: true,
    });
    this.regions.enableDragSelection({ color: 'rgba(232, 93, 63, 0.18)' });
    this.regions.on('region-created', (region) => {
      this.#region?.remove();
      this.#region = region;
      this.onStatus(
        `Selection ${this.#time(region.start)}–${this.#time(region.end)}`,
      );
    });
    this.regions.on('region-updated', (region) => {
      this.#region = region;
      this.onStatus(
        `Selection ${this.#time(region.start)}–${this.#time(region.end)}`,
      );
    });
    this.wave.on('play', () => this.onStateChange(true));
    this.wave.on('pause', () => this.onStateChange(false));
    this.wave.on('timeupdate', (seconds) => this.onTimeChange(seconds));
    this.wave.on('decode', (duration) => this.onReady(duration));
    this.wave.on('finish', () => {
      this.onStateChange(false);
      this.onStatus('Finished');
    });
  }

  get isReady() {
    return this.#ready;
  }

  get isPlaying() {
    return this.wave.isPlaying();
  }

  async load(url, { autoplay = false } = {}) {
    await this.wave.load(url);
    this.#ready = true;
    this.onStatus('Drag across the waveform to select a segment');
    if (autoplay) await this.toggle();
  }

  async toggle() {
    if (this.wave.isPlaying()) return this.stop();
    if (this.#region) {
      await this.wave.play(this.#region.start, this.#region.end);
      return;
    }
    await this.wave.play();
  }

  stop() {
    this.wave.pause();
  }

  seek(seconds) {
    this.wave.setTime(seconds);
  }

  clearRegion() {
    this.#region?.remove();
    this.#region = undefined;
    this.onStatus('Selection cleared — full track active');
  }

  destroy() {
    this.wave.destroy();
  }

  #time(seconds) {
    const minutes = Math.floor(seconds / 60);
    return `${minutes}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
  }
}
