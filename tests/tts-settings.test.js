import { describe, expect, it } from 'vitest';
import {
  DEFAULT_TTS_SETTINGS,
  normalizeTtsSettings,
} from '../src/tts-settings.js';

describe('TTS settings', () => {
  it('merges defaults and clamps unsafe persisted values', () => {
    expect(
      normalizeTtsSettings({ speed: 99, clarity: -1, volume: 'invalid' }),
    ).toMatchObject({
      speed: 1.25,
      clarity: 0,
      volume: DEFAULT_TTS_SETTINGS.volume,
    });
  });
});
