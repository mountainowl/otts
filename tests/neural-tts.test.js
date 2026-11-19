import { describe, expect, it } from 'vitest';
import {
  DHVAANI_VOICE,
  HINDI_NEURAL_VOICE,
  KOKORO_HINDI_VOICE,
  KOKORO_VOICE,
  SpeechService,
  polishPcm,
  prependWavSilence,
} from '../src/speech-service.js';

describe('Hindi neural voice', () => {
  it('identifies the bundled neural voice without treating system voices as neural', () => {
    expect(HINDI_NEURAL_VOICE).toMatchObject({
      lang: 'hi-IN',
      localService: true,
      voiceURI: 'piper:hi_IN-priyamvada-medium',
    });
    const speech = new SpeechService({ piper: {}, synthesis: undefined });
    expect(speech.isNeural(HINDI_NEURAL_VOICE.voiceURI)).toBe(true);
    expect(speech.isNeural('com.apple.voice.compact.hi-IN.Lekha')).toBe(false);
  });

  it('filters, fades, and peak-limits generated PCM', () => {
    const input = Float32Array.from([0.8, 0.5, 0.01, -0.01, -0.5, -0.8]);
    const output = polishPcm(input, 22050, { clarity: 0.62, volume: 0.9 });

    expect(output).toHaveLength(input.length);
    expect(output[0]).toBe(0);
    expect(output.at(-1)).toBeCloseTo(0);
    expect(Math.max(...output.map(Math.abs))).toBeLessThanOrEqual(0.9);
  });

  it('offers bundled English engines only for English conversations', () => {
    const speech = new SpeechService({ synthesis: undefined });

    expect(speech.voicesFor('en-US')).toEqual([KOKORO_VOICE]);
    expect(speech.voicesFor('hi-IN')).toEqual([
      KOKORO_HINDI_VOICE,
      HINDI_NEURAL_VOICE,
      DHVAANI_VOICE,
    ]);
    expect(speech.voicesFor('ta-IN')).toEqual([DHVAANI_VOICE]);
    expect(speech.voicesFor('fr-FR')).toEqual([]);
    expect(speech.isNeural(KOKORO_VOICE.voiceURI)).toBe(true);
    expect(speech.isNeural(KOKORO_HINDI_VOICE.voiceURI)).toBe(true);
    expect(speech.isNeural(DHVAANI_VOICE.voiceURI)).toBe(true);
  });

  it('deduplicates the bilingual searchable voice catalog', () => {
    const duplicateEnglish = {
      name: 'English duplicate',
      lang: 'en-US',
      voiceURI: 'system:duplicate',
    };
    const speech = new SpeechService({
      synthesis: {
        getVoices: () => [duplicateEnglish, duplicateEnglish],
      },
    });

    const catalog = speech.voiceCatalogFor('hi-IN');
    expect(
      catalog.filter(({ voiceURI }) => voiceURI === 'system:duplicate'),
    ).toHaveLength(1);
    expect(catalog.map(({ voiceURI }) => voiceURI)).toEqual(
      expect.arrayContaining([
        KOKORO_HINDI_VOICE.voiceURI,
        KOKORO_VOICE.voiceURI,
      ]),
    );
  });

  it('prepends configurable silence to generated WAV files', async () => {
    const bytes = new Uint8Array(48);
    const view = new DataView(bytes.buffer);
    for (const [offset, text] of [
      [0, 'RIFF'],
      [8, 'WAVE'],
      [12, 'fmt '],
      [36, 'data'],
    ])
      [...text].forEach((character, index) =>
        view.setUint8(offset + index, character.charCodeAt(0)),
      );
    view.setUint32(4, 40, true);
    view.setUint32(16, 16, true);
    view.setUint32(24, 1000, true);
    view.setUint16(32, 2, true);
    view.setUint32(40, 4, true);

    const output = await prependWavSilence(new Blob([bytes]), 0.5);
    const result = new DataView(await output.arrayBuffer());

    expect(output.size).toBe(1048);
    expect(result.getUint32(4, true)).toBe(1040);
    expect(result.getUint32(40, true)).toBe(1004);
  });
});
