import {
  joinWavSegments,
  parsePerformanceScript,
  settingsForPerformance,
} from './performance-markup.js';

export const HINDI_NEURAL_VOICE = Object.freeze({
  name: 'Priyamvada — Natural neural',
  lang: 'hi-IN',
  voiceURI: 'piper:hi_IN-priyamvada-medium',
  localService: true,
});

export const KOKORO_VOICE = Object.freeze({
  name: 'Kokoro Heart — Natural neural',
  lang: 'en-US',
  voiceURI: 'kokoro:af_heart',
  localService: true,
});

export const KOKORO_HINDI_VOICE = Object.freeze({
  name: 'Kokoro Alpha — स्वाभाविक हिंदी',
  lang: 'hi-IN',
  voiceURI: 'kokoro:hf_alpha',
  localService: true,
});

export const DHVAANI_VOICE = Object.freeze({
  name: 'DhVaani 0.5 — CPU natural voice',
  lang: 'mul-IN',
  voiceURI: 'dhvaani:0.5',
  localService: true,
});

const MODEL_ROOT = './tts/models/hi_IN-priyamvada-medium';
const KOKORO_ROOT = './models/kokoro';
const DHVAANI_URL = 'http://127.0.0.1:8765/v1/audio/speech';
const DHVAANI_LANGUAGES = new Set([
  'as-IN',
  'bn-IN',
  'brx-IN',
  'doi-IN',
  'en-IN',
  'gu-IN',
  'hi-IN',
  'kn-IN',
  'ks-IN',
  'kok-IN',
  'mai-IN',
  'ml-IN',
  'mni-IN',
  'mr-IN',
  'ne-IN',
  'or-IN',
  'pa-IN',
  'sa-IN',
  'sat-IN',
  'sd-IN',
  'ta-IN',
  'te-IN',
  'ur-IN',
]);
const LOCAL_VOICES = Object.freeze([
  HINDI_NEURAL_VOICE,
  KOKORO_VOICE,
  KOKORO_HINDI_VOICE,
  DHVAANI_VOICE,
]);

/** Adds real PCM silence to a WAV so downloaded and replayed audio match. */
export async function prependWavSilence(blob, seconds = 0.45) {
  const source = new Uint8Array(await blob.arrayBuffer());
  const view = new DataView(source.buffer);
  if (source.length < 44 || view.getUint32(0, false) !== 0x52494646)
    return blob;

  let offset = 12;
  let sampleRate;
  let blockAlign;
  let dataSizeOffset;
  let dataStart;
  while (offset + 8 <= source.length) {
    const chunk = view.getUint32(offset, false);
    const size = view.getUint32(offset + 4, true);
    if (chunk === 0x666d7420 && size >= 16) {
      sampleRate = view.getUint32(offset + 12, true);
      blockAlign = view.getUint16(offset + 20, true);
    }
    if (chunk === 0x64617461) {
      dataSizeOffset = offset + 4;
      dataStart = offset + 8;
      break;
    }
    offset += 8 + size + (size % 2);
  }
  if (!sampleRate || !blockAlign || !dataStart) return blob;

  const silenceBytes = Math.round(seconds * sampleRate) * blockAlign;
  const output = new Uint8Array(source.length + silenceBytes);
  output.set(source.subarray(0, dataStart));
  output.set(source.subarray(dataStart), dataStart + silenceBytes);
  const result = new DataView(output.buffer);
  result.setUint32(4, output.length - 8, true);
  result.setUint32(
    dataSizeOffset,
    view.getUint32(dataSizeOffset, true) + silenceBytes,
    true,
  );
  return new Blob([output], { type: blob.type || 'audio/wav' });
}

/**
 * Converts model PCM into cleaner speech without hiding synthesis controls.
 * मॉडल के PCM से हल्का शोर हटाकर आवाज़ को साफ़ बनाता है।
 *
 * @param {Float32Array} input
 * @param {number} sampleRate
 * @param {{ clarity: number, volume: number }} settings
 * @returns {Float32Array}
 */
export function polishPcm(input, sampleRate, settings) {
  const output = new Float32Array(input.length);
  const highPassHz = 70;
  const lowPassHz = 6800 + settings.clarity * 3000;
  const highPassAlpha = 1 / (1 + 2 * Math.PI * highPassHz * (1 / sampleRate));
  const lowPassAlpha =
    (2 * Math.PI * lowPassHz * (1 / sampleRate)) /
    (1 + 2 * Math.PI * lowPassHz * (1 / sampleRate));
  let previousInput = 0;
  let highPassed = 0;
  let lowPassed = 0;
  let peak = 0;

  for (let index = 0; index < input.length; index += 1) {
    highPassed = highPassAlpha * (highPassed + input[index] - previousInput);
    previousInput = input[index];
    lowPassed += lowPassAlpha * (highPassed - lowPassed);
    output[index] = lowPassed;
    peak = Math.max(peak, Math.abs(lowPassed));
  }

  // Never amplify model noise. The earlier peak-normalizing gate exaggerated
  // quiet artifacts and could sound like crackle near pauses.
  // मॉडल के हल्के शोर को बढ़ाते नहीं हैं; इससे विराम साफ़ रहते हैं।
  const gain = peak ? Math.min(1, settings.volume / peak) : 1;
  const fadeSamples = Math.min(
    Math.round(sampleRate * 0.012),
    output.length >> 1,
  );
  for (let index = 0; index < output.length; index += 1) {
    const fadeIn = Math.min(1, index / fadeSamples);
    const fadeOut = Math.min(1, (output.length - index - 1) / fadeSamples);
    output[index] *= gain * fadeIn * fadeOut;
  }
  return output;
}

/**
 * Offline speech facade. Callers consume lifecycle events instead of managing
 * model loading, PCM cleanup, object URLs, or browser utterances themselves.
 * ऑफ़लाइन स्पीच फ़साड: कॉलर को मॉडल, PCM और ऑडियो URL संभालना नहीं पड़ता।
 */
export class SpeechService {
  #kokoroWorker;
  #kokoroRequests = new Map();
  #kokoroRequestId = 0;
  #piperWorker;
  #piperRequests = new Map();
  #piperRequestId = 0;
  #dhvaaniAbort;
  #activeUrl;

  constructor({
    piper = globalThis.Piper,
    synthesis = globalThis.speechSynthesis,
  } = {}) {
    this.piper = piper;
    this.synthesis = synthesis;
  }

  get systemVoices() {
    return this.synthesis?.getVoices?.() ?? [];
  }

  voicesFor(language) {
    const voices = this.systemVoices.filter((voice) =>
      voice.lang.toLowerCase().startsWith(language.split('-')[0].toLowerCase()),
    );
    const dhvaani = DHVAANI_LANGUAGES.has(language) ? [DHVAANI_VOICE] : [];
    if (language === 'hi-IN')
      return [KOKORO_HINDI_VOICE, HINDI_NEURAL_VOICE, ...dhvaani, ...voices];
    if (language === 'en-US') return [KOKORO_VOICE, ...voices];
    if (language === 'en-IN') return [...dhvaani, KOKORO_VOICE, ...voices];
    return [...dhvaani, ...voices];
  }

  isNeural(voiceURI) {
    return LOCAL_VOICES.some((voice) => voice.voiceURI === voiceURI);
  }

  /**
   * Streams observable playback states as an async generator.
   * असिंक्रोनस जनरेटर तैयारी, प्रोसेसिंग और प्लेबैक की स्थिति देता है।
   *
   * @param {{ text: string, language: string, voiceURI: string, rate: number, pitch: number, settings: object }} request
   * @yields {{ state: string, url?: string, blob?: Blob, duration?: number }}
   */
  async *play(request) {
    this.stop({ release: true });
    const performance = parsePerformanceScript(request.text);
    const hasMarkup =
      performance.length > 1 ||
      performance[0]?.pauseBeforeMs > 0 ||
      performance[0]?.styles.length > 0 ||
      performance[0]?.text !== request.text.trim();
    if (hasMarkup) {
      if (this.isNeural(request.voiceURI))
        yield* this.#playPerformance(request, performance);
      else yield* this.#playSystemPerformance(request, performance);
      return;
    }
    if (request.voiceURI === HINDI_NEURAL_VOICE.voiceURI) {
      yield* this.#playNeural(request);
      return;
    }
    if (request.voiceURI === DHVAANI_VOICE.voiceURI) {
      yield* this.#playDhVaani(request);
      return;
    }
    if (
      [KOKORO_VOICE.voiceURI, KOKORO_HINDI_VOICE.voiceURI].includes(
        request.voiceURI,
      )
    ) {
      yield* this.#playKokoro(request);
      return;
    }
    yield* this.#playSystem(request);
  }

  async *#playNeural({ text, settings }) {
    yield { state: 'loading', message: 'Loading neural voice…' };
    const blob = await this.#generateNeural(text, settings);
    yield { state: 'processing', message: 'Polishing speech…' };
    this.#activeUrl = URL.createObjectURL(blob);
    yield await this.#ready(blob, settings.initialPause);
    yield { state: 'finished', message: 'Waveform ready' };
  }

  async #generateNeural(text, settings) {
    const { samples, sampleRate } = await this.#requestPiper('synthesize', {
      text,
      onnxUrl: `${MODEL_ROOT}.onnx`,
      configUrl: `${MODEL_ROOT}.onnx.json`,
      options: {
        lengthScale: 1 / settings.speed,
        noiseScale: settings.expressiveness,
        noiseW: settings.variation,
        sentenceSilence: settings.sentencePause,
      },
    });
    const polished = polishPcm(samples, sampleRate, settings);
    return this.piper.toWav(polished, sampleRate);
  }

  async *#playKokoro({ text, language, voiceURI, settings }) {
    yield { state: 'loading', message: 'Loading Kokoro-82M locally…' };
    yield { state: 'processing', message: 'Synthesizing with Kokoro…' };
    const voice = voiceURI.split(':')[1];
    let phonemes;
    if (language === 'hi-IN') {
      [{ phonemes }] = await this.#requestPiper('phonemize', {
        texts: [text],
        language: 'hi',
      });
      phonemes = phonemes.join('');
    }
    const blob = await this.#generateKokoro({
      text,
      phonemes,
      voice,
      speed: settings.speed,
    });
    yield await this.#ready(blob, settings.initialPause);
    yield { state: 'finished', message: 'Kokoro waveform ready' };
  }

  /** Generates multilingual speech in the isolated localhost CPU process. */
  async *#playDhVaani({ text, language, settings }) {
    yield { state: 'loading', message: 'Loading DhVaani CPU model…' };
    yield { state: 'processing', message: 'Generating natural speech on CPU…' };
    const blob = await this.#generateDhVaani({ text, language, settings });
    yield await this.#ready(blob, settings.initialPause);
    yield { state: 'finished', message: 'DhVaani waveform ready' };
  }

  async #generateDhVaani({ text, language, settings }) {
    this.#dhvaaniAbort = new AbortController();
    let response;
    try {
      response = await fetch(DHVAANI_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, language, settings }),
        signal: this.#dhvaaniAbort.signal,
      });
    } catch (error) {
      if (error.name === 'AbortError') throw error;
      throw new Error(
        'DhVaani CPU service is not running. Use npm run dev:cpu.',
      );
    } finally {
      this.#dhvaaniAbort = undefined;
    }
    if (!response.ok) {
      const detail = await response.json().catch(() => ({}));
      throw new Error(
        detail.error || `DhVaani returned HTTP ${response.status}.`,
      );
    }
    return response.blob();
  }

  async *#playPerformance(request, performance) {
    yield { state: 'loading', message: 'Preparing performance…' };
    const parts = [];
    for (const [index, segment] of performance.entries()) {
      yield {
        state: 'processing',
        message: `Generating segment ${index + 1}/${performance.length}…`,
      };
      const settings = settingsForPerformance(request.settings, segment.styles);
      let blob;
      if (request.voiceURI === HINDI_NEURAL_VOICE.voiceURI) {
        blob = await this.#generateNeural(segment.text, settings);
      } else if (request.voiceURI === DHVAANI_VOICE.voiceURI) {
        blob = await this.#generateDhVaani({
          ...request,
          text: segment.text,
          settings,
        });
      } else {
        const voice = request.voiceURI.split(':')[1];
        let phonemes;
        if (request.language === 'hi-IN') {
          [{ phonemes }] = await this.#requestPiper('phonemize', {
            texts: [segment.text],
            language: 'hi',
          });
          phonemes = phonemes.join('');
        }
        blob = await this.#generateKokoro({
          text: segment.text,
          phonemes,
          voice,
          speed: settings.speed,
        });
      }
      parts.push({ blob, pauseBeforeMs: segment.pauseBeforeMs });
    }
    const blob = await joinWavSegments(parts);
    yield await this.#ready(blob, request.settings.initialPause);
    yield { state: 'finished', message: 'Performance waveform ready' };
  }

  async *#playSystemPerformance(request, performance) {
    for (const segment of performance) {
      if (segment.pauseBeforeMs)
        await new Promise((resolve) =>
          setTimeout(resolve, segment.pauseBeforeMs),
        );
      const settings = settingsForPerformance(request.settings, segment.styles);
      yield* this.#playSystem({
        ...request,
        text: segment.text,
        rate: request.rate * (settings.speed / request.settings.speed),
      });
    }
  }

  async *#playSystem({ text, language, voiceURI, rate, pitch }) {
    if (!this.synthesis) throw new Error('System speech is unavailable.');
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language;
    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.voice =
      this.systemVoices.find((voice) => voice.voiceURI === voiceURI) ?? null;
    const finished = new Promise((resolve, reject) => {
      utterance.onend = resolve;
      utterance.onerror = reject;
    });
    this.synthesis.speak(utterance);
    yield { state: 'playing', message: 'Playing system voice…' };
    await finished;
    yield { state: 'finished', message: 'Finished' };
  }

  /** ऑडियो रोकता है। Stops active neural and system playback. */
  stop({ release = false } = {}) {
    this.synthesis?.cancel?.();
    this.#dhvaaniAbort?.abort();
    this.#dhvaaniAbort = undefined;
    if (this.#kokoroWorker && this.#kokoroRequests.size) {
      this.#kokoroWorker.terminate();
      this.#kokoroWorker = undefined;
      for (const { reject } of this.#kokoroRequests.values())
        reject(new DOMException('Speech generation stopped.', 'AbortError'));
      this.#kokoroRequests.clear();
    }
    if (this.#piperWorker && this.#piperRequests.size) {
      this.#piperWorker.terminate();
      this.#piperWorker = undefined;
      for (const { reject } of this.#piperRequests.values())
        reject(new DOMException('Speech generation stopped.', 'AbortError'));
      this.#piperRequests.clear();
    }
    if (release && this.#activeUrl) {
      URL.revokeObjectURL(this.#activeUrl);
      this.#activeUrl = undefined;
    }
  }

  #generateKokoro(request) {
    if (!this.#kokoroWorker) {
      this.#kokoroWorker = new Worker(
        new URL('./kokoro-worker.js', import.meta.url),
        { type: 'module' },
      );
      this.#kokoroWorker.addEventListener('message', ({ data }) => {
        const pending = this.#kokoroRequests.get(data.id);
        if (!pending) return;
        this.#kokoroRequests.delete(data.id);
        if (data.error) pending.reject(new Error(data.error));
        else pending.resolve(data.blob);
      });
      this.#kokoroWorker.addEventListener('error', (error) => {
        for (const { reject } of this.#kokoroRequests.values()) reject(error);
        this.#kokoroRequests.clear();
      });
    }
    const id = ++this.#kokoroRequestId;
    return new Promise((resolve, reject) => {
      this.#kokoroRequests.set(id, { resolve, reject });
      this.#kokoroWorker.postMessage({
        id,
        ...request,
        paths: {
          modelRoot: new URL('./models/', document.baseURI).href,
          voiceRoot: new URL(`${KOKORO_ROOT}/voices`, document.baseURI).href,
          wasmRoot: new URL(`${KOKORO_ROOT}/wasm/`, document.baseURI).href,
        },
      });
    });
  }

  #requestPiper(action, request) {
    if (!globalThis.Worker)
      return Promise.reject(new Error('Neural speech worker is unavailable.'));
    if (!this.#piperWorker) {
      this.#piperWorker = new Worker(
        new URL('./piper-worker.js', document.baseURI),
      );
      this.#piperWorker.addEventListener('message', ({ data }) => {
        const pending = this.#piperRequests.get(data.id);
        if (!pending) return;
        this.#piperRequests.delete(data.id);
        if (data.error) pending.reject(new Error(data.error));
        else pending.resolve(data.result);
      });
      this.#piperWorker.addEventListener('error', (error) => {
        for (const { reject } of this.#piperRequests.values()) reject(error);
        this.#piperRequests.clear();
      });
    }
    const id = ++this.#piperRequestId;
    return new Promise((resolve, reject) => {
      this.#piperRequests.set(id, { resolve, reject });
      this.#piperWorker.postMessage({ id, action, ...request });
    });
  }

  async #ready(blob, initialPause) {
    blob = await prependWavSilence(blob, initialPause);
    this.#activeUrl = URL.createObjectURL(blob);
    return { state: 'ready', blob, url: this.#activeUrl };
  }
}
