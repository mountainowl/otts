import { describe, expect, it } from 'vitest';
import { matchesVoiceFilter, voiceLanguageGroup } from '../src/voice-filter.js';

describe('voice filtering', () => {
  it.each([
    ['hi-IN', 'hi'],
    ['en-US', 'en'],
    ['mul-IN', 'both'],
    ['fr-FR', 'other'],
  ])('groups %s as %s', (language, expected) => {
    expect(voiceLanguageGroup(language)).toBe(expected);
  });

  it('combines text search with independent Hindi and English filters', () => {
    const hindi = { name: 'Kokoro Alpha', lang: 'hi-IN' };
    const english = { name: 'Microsoft Zira', lang: 'en-US' };
    expect(
      matchesVoiceFilter(hindi, 'alpha', { hindi: true, english: false }),
    ).toBe(true);
    expect(
      matchesVoiceFilter(english, '', { hindi: true, english: false }),
    ).toBe(false);
    expect(
      matchesVoiceFilter(english, 'zira', { hindi: false, english: true }),
    ).toBe(true);
  });

  it('shows multilingual voices for either language but none when both are off', () => {
    const multilingual = { name: 'DhVaani', lang: 'mul-IN' };
    expect(
      matchesVoiceFilter(multilingual, '', { hindi: true, english: false }),
    ).toBe(true);
    expect(
      matchesVoiceFilter(multilingual, '', { hindi: false, english: true }),
    ).toBe(true);
    expect(
      matchesVoiceFilter(multilingual, '', { hindi: false, english: false }),
    ).toBe(false);
  });
});
