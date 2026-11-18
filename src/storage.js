export const STORAGE_KEY = 'vaani-workspace-v1';

export const HINDI_TEXT =
  'पहाड़ों की गोद में बसा एक छोटा सा गाँव था, जहाँ चारों ओर हरियाली और शांत वातावरण था। सुबह की पहली किरण पड़ते ही पक्षियों की चहचहाहट से पूरा गाँव गूँज उठता था। वहाँ के लोग सादगी और प्रेम के साथ अपना जीवन बिताते थे।';

const createId = () =>
  globalThis.crypto?.randomUUID?.() ??
  `local-${Date.now()}-${Math.random().toString(16).slice(2)}`;

export function createSeedWorkspace(now = new Date().toISOString()) {
  const projectId = createId();
  const conversationId = createId();

  return {
    version: 1,
    uiLanguage: 'en',
    activeProjectId: projectId,
    activeConversationId: conversationId,
    projects: [
      {
        id: projectId,
        title: 'Hindi stories',
        description: 'Warm, natural narration drafts in Hindi.',
        createdAt: now,
        conversations: [
          {
            id: conversationId,
            title: 'पहाड़ों का गाँव',
            purpose: 'Story narration',
            description: 'Hindi validation sample',
            language: 'hi-IN',
            text: HINDI_TEXT,
            rate: 0.92,
            pitch: 1,
            voiceURI: 'piper:hi_IN-priyamvada-medium',
            createdAt: now,
            updatedAt: now,
            sampleAudio: './audio/hindi-sample.wav',
          },
        ],
      },
    ],
  };
}

export function loadWorkspace(storage = globalThis.localStorage) {
  try {
    const saved = storage?.getItem(STORAGE_KEY);
    if (!saved) return createSeedWorkspace();
    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed.projects)) throw new Error('Invalid workspace');
    return parsed;
  } catch {
    return createSeedWorkspace();
  }
}

export function saveWorkspace(workspace, storage = globalThis.localStorage) {
  storage?.setItem(STORAGE_KEY, JSON.stringify(workspace));
}

export function createProject(title, description = '') {
  return {
    id: createId(),
    title: title.trim(),
    description: description.trim(),
    createdAt: new Date().toISOString(),
    conversations: [],
  };
}

export function createConversation() {
  const now = new Date().toISOString();
  return {
    id: createId(),
    title: 'Untitled conversation',
    purpose: '',
    description: '',
    language: 'en-US',
    text: '',
    rate: 1,
    pitch: 1,
    voiceURI: '',
    createdAt: now,
    updatedAt: now,
  };
}
