import { describe, expect, it } from 'vitest';
import {
  HINDI_TEXT,
  STORAGE_KEY,
  createConversation,
  createProject,
  createSeedWorkspace,
  loadWorkspace,
  saveWorkspace,
} from '../src/storage.js';

function memoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  };
}

describe('workspace storage', () => {
  it('seeds the supplied Hindi validation conversation', () => {
    const workspace = createSeedWorkspace('2026-11-17T00:00:00.000Z');
    const conversation = workspace.projects[0].conversations[0];

    expect(workspace.uiLanguage).toBe('en');
    expect(conversation.language).toBe('hi-IN');
    expect(conversation.voiceURI).toBe('piper:hi_IN-priyamvada-medium');
    expect(conversation.text).toBe(HINDI_TEXT);
    expect(conversation.sampleAudio).toBe('./audio/hindi-sample.wav');
  });

  it('round-trips a workspace through local storage', () => {
    const storage = memoryStorage();
    const workspace = createSeedWorkspace();

    saveWorkspace(workspace, storage);

    expect(loadWorkspace(storage)).toEqual(workspace);
  });

  it('recovers from invalid saved data', () => {
    const storage = memoryStorage({ [STORAGE_KEY]: '{broken' });
    expect(loadWorkspace(storage).projects).toHaveLength(1);
  });

  it('creates projects and conversations with editable metadata', () => {
    const project = createProject(' Lessons ', ' Weekly training ');
    const conversation = createConversation();

    expect(project).toMatchObject({
      title: 'Lessons',
      description: 'Weekly training',
      conversations: [],
    });
    expect(conversation).toMatchObject({
      title: 'Untitled conversation',
      language: 'en-US',
      text: '',
    });
  });
});
