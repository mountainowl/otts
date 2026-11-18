import { describe, expect, it } from 'vitest';
import {
  joinWavSegments,
  parsePerformanceScript,
  settingsForPerformance,
} from '../src/performance-markup.js';

function wav(samples, sampleRate = 1_000) {
  const bytes = new Uint8Array(44 + samples.length * 2);
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
  view.setUint32(4, bytes.length - 8, true);
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  view.setUint32(40, samples.length * 2, true);
  return new Blob([bytes], { type: 'audio/wav' });
}

describe('performance markup', () => {
  it('parses exact pauses, styles, and emphasis without speaking the tags', () => {
    expect(
      parsePerformanceScript(
        '[calm] पहला वाक्य। [pause=500] [warm, emphasis=हरियाली] हरियाली थी।',
      ),
    ).toEqual([
      { text: 'पहला वाक्य।', pauseBeforeMs: 0, styles: ['calm'] },
      {
        text: '—हरियाली— थी।',
        pauseBeforeMs: 500,
        styles: ['warm'],
      },
    ]);
  });

  it('maps performance styles into bounded synthesis controls', () => {
    const settings = settingsForPerformance(
      { speed: 0.96, expressiveness: 0.38, variation: 0.42 },
      ['reflective'],
    );
    expect(settings.speed).toBeCloseTo(0.8448);
    expect(settings.expressiveness).toBeGreaterThan(0.38);
    expect(settings.variation).toBeGreaterThan(0.42);
  });

  it('inserts sample-accurate silence while joining PCM WAV segments', async () => {
    const output = await joinWavSegments([
      { blob: wav([1, 2]), pauseBeforeMs: 0 },
      { blob: wav([3, 4]), pauseBeforeMs: 500 },
    ]);
    const view = new DataView(await output.arrayBuffer());
    expect(output.size).toBe(44 + (2 + 500 + 2) * 2);
    expect(view.getUint32(40, true)).toBe((2 + 500 + 2) * 2);
  });
});
