import { describe, expect, it } from 'vitest';
import { HINDI_NEURAL_VOICE } from '../src/speech-service.js';
import { createSeedWorkspace } from '../src/storage.js';
import { DEFAULT_TTS_SETTINGS } from '../src/tts-settings.js';
import { LANGUAGES, renderApp } from '../src/view.js';

describe('audio workspace view', () => {
  it('offers Indian English and every scheduled Indian language', () => {
    expect(LANGUAGES.filter((code) => code.endsWith('-IN'))).toEqual([
      'en-IN',
      'as-IN',
      'bn-IN',
      'brx-IN',
      'doi-IN',
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
  });

  it('renders one transport toggle and nests the waveform in Voice Studio', () => {
    const workspace = createSeedWorkspace('2026-11-17T00:00:00.000Z');
    workspace.ttsSettings = DEFAULT_TTS_SETTINGS;
    const project = workspace.projects[0];
    const conversation = project.conversations[0];
    const html = renderApp({
      workspace,
      project,
      conversation,
      voices: [HINDI_NEURAL_VOICE],
      saveStatus: 'Saved locally',
    });

    expect(html.match(/data-action="toggle-playback"/g)).toHaveLength(1);
    expect(html.match(/data-action="insert-performance"/g)).toHaveLength(6);
    expect(html).toContain('data-markup="[pause=500]"');
    expect(html).toContain('data-pause-help');
    expect(html).not.toContain('data-action="stop"');
    expect(html.indexOf('id="waveform"')).toBeGreaterThan(
      html.indexOf('id="voice-heading"'),
    );
    expect(html.indexOf('id="waveform"')).toBeLessThan(
      html.indexOf('</section>'),
    );
  });
});
