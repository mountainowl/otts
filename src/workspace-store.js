import {
  createConversation,
  createProject,
  loadWorkspace,
  saveWorkspace,
} from './storage.js';
import { normalizeTtsSettings } from './tts-settings.js';

/**
 * Owns workspace mutation and persistence behind one small interface.
 * वर्कस्पेस में बदलाव और लोकल सेव को एक छोटे इंटरफ़ेस में रखता है।
 */
export class WorkspaceStore {
  #saveTimer;

  /** @param {Storage} storage Browser-compatible key/value storage. */
  constructor(storage = globalThis.localStorage) {
    this.storage = storage;
    this.state = loadWorkspace(storage);
    this.state.uiLanguage = ['en', 'hi', 'both'].includes(this.state.uiLanguage)
      ? this.state.uiLanguage
      : 'en';
    this.state.ttsSettings = normalizeTtsSettings(this.state.ttsSettings);
  }

  /** सक्रिय प्रोजेक्ट देता है। Returns the active project. */
  get activeProject() {
    return (
      this.state.projects.find(({ id }) => id === this.state.activeProjectId) ??
      this.state.projects[0]
    );
  }

  /** सक्रिय वार्तालाप देता है। Returns the active conversation. */
  get activeConversation() {
    const project = this.activeProject;
    return (
      project?.conversations.find(
        ({ id }) => id === this.state.activeConversationId,
      ) ?? project?.conversations[0]
    );
  }

  selectProject(id) {
    this.state.activeProjectId = id;
    this.state.activeConversationId = this.activeProject?.conversations[0]?.id;
    this.save();
  }

  selectConversation(id) {
    this.state.activeConversationId = id;
    this.save();
  }

  addProject(title, description) {
    const project = createProject(title, description);
    this.state.projects.push(project);
    this.state.activeProjectId = project.id;
    this.state.activeConversationId = undefined;
    this.save();
    return project;
  }

  addConversation() {
    if (!this.activeProject) return undefined;
    const conversation = createConversation();
    this.activeProject.conversations.unshift(conversation);
    this.state.activeConversationId = conversation.id;
    this.save();
    return conversation;
  }

  /**
   * Updates one conversation field and debounces disk-backed browser storage.
   * एक फ़ील्ड बदलकर लोकल सेव को थोड़ी देर तक समेटता है।
   */
  updateConversation(field, value, onSaved) {
    if (!this.activeConversation) return;
    this.activeConversation[field] = value;
    this.activeConversation.updatedAt = new Date().toISOString();
    clearTimeout(this.#saveTimer);
    this.#saveTimer = setTimeout(() => {
      this.save();
      onSaved?.();
    }, 250);
  }

  updateSetting(name, value) {
    this.state.ttsSettings = normalizeTtsSettings({
      ...this.state.ttsSettings,
      [name]: value,
    });
    this.save();
  }

  updateUiLanguage(value) {
    this.state.uiLanguage = ['en', 'hi', 'both'].includes(value) ? value : 'en';
    this.save();
  }

  /** डेटा को इसी डिवाइस पर सहेजता है। Persists state on this device. */
  save() {
    saveWorkspace(this.state, this.storage);
  }
}
