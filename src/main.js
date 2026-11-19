import './tailwind.css';
import { copyForMode } from './localization.js';
import { SpeechService } from './speech-service.js';
import { DEFAULT_TTS_SETTINGS } from './tts-settings.js';
import { renderApp } from './view.js';
import { WorkspaceStore } from './workspace-store.js';
import { WaveformPlayer } from './waveform-player.js';
import { matchesVoiceFilter } from './voice-filter.js';

const UI_COPY = Object.freeze({
  Workspace: 'कार्यस्थान',
  Projects: 'परियोजनाएँ',
  Conversations: 'वार्तालाप',
  Conversation: 'वार्तालाप',
  characters: 'अक्षर',
  Purpose: 'उद्देश्य',
  Language: 'भाषा',
  Description: 'विवरण',
  'Original text': 'मूल पाठ',
  'Performance syntax': 'अभिव्यक्ति संकेत',
  'Exact 500 ms silence': 'सटीक 500 मिलीसेकंड विराम',
  'Applies supported pace and expression controls to the following segment':
    'अगले अंश पर उपलब्ध गति और अभिव्यक्ति नियंत्रण लागू करता है',
  'Marks a word using model-readable punctuation':
    'मॉडल के अनुकूल विराम-चिह्न से शब्द पर बल देता है',
  'Commas, …, — and ? still shape natural phrasing.':
    'अल्पविराम, …, — और ? स्वाभाविक वाक्य-विन्यास को आकार देते हैं।',
  'Voice studio': 'वॉइस स्टूडियो',
  'Natural speech, on device': 'डिवाइस पर स्वाभाविक वाणी',
  'Offline neural': 'ऑफ़लाइन न्यूरल',
  Voice: 'आवाज़',
  Speed: 'वाक्-गति',
  Clarity: 'स्वर-स्पष्टता',
  Tune: 'समायोजित करें',
  Play: 'सुनें',
  Stop: 'रोकें',
  'Ready to play': 'सुनने के लिए तैयार',
  'Loading neural voice…': 'न्यूरल आवाज़ लोड हो रही है…',
  'Polishing speech…': 'वाणी को स्पष्ट किया जा रहा है…',
  'Waveform ready': 'वेवफ़ॉर्म तैयार है',
  'Loading Kokoro-82M locally…': 'Kokoro-82M स्थानीय रूप से लोड हो रहा है…',
  'Synthesizing with Kokoro…': 'Kokoro से वाणी तैयार हो रही है…',
  'Kokoro waveform ready': 'Kokoro वेवफ़ॉर्म तैयार है',
  'Playing system voice…': 'सिस्टम की आवाज़ सुनाई जा रही है…',
  Finished: 'पूर्ण हुआ',
  Stopped: 'रुका हुआ',
  'Drag across the waveform to select a segment':
    'केवल एक अंश सुनने के लिए ध्वनि-तरंग पर खींचें',
  'Selection cleared — full track active':
    'चुना अंश हटाया गया — पूरी ध्वनि सक्रिय है',
  'Play speech': 'वाणी सुनें',
  'Stop speech': 'वाणी रोकें',
  'Waveform editor': 'ध्वनि-तरंग संपादन',
  'Generated speech': 'तैयार वाणी',
  'Click to seek. Drag to select a segment.':
    'सुनने का स्थान चुनने के लिए क्लिक करें। केवल चुना अंश सुनने के लिए खींचें।',
  'Clear selection': 'चुना अंश हटाएँ',
  Download: 'डाउनलोड',
  'Audio seek bar': 'ऑडियो समय-पट्टी',
  'Interactive audio waveform': 'इंटरैक्टिव ध्वनि-तरंग',
  'Generate with Kokoro or Priyamvada to display the waveform.':
    'ध्वनि-तरंग देखने के लिए Kokoro या Priyamvada से वाणी तैयार करें।',
  'Label language': 'लेबल भाषा',
  'Offline voice': 'ऑफ़लाइन आवाज़',
  'Speech settings': 'वाणी सेटिंग्स',
  'Initial pause': 'आरंभिक विराम',
  'Speaking speed': 'वाक्-गति',
  Expression: 'अभिव्यक्ति / स्वर-शैली',
  'Voice variation': 'आरोह-अवरोह',
  'Sentence pause': 'वाक्य-विराम',
  'Clarity filter': 'स्वर-स्पष्टता',
  'Output level': 'ध्वनि-स्तर',
  'Cleaner default': 'स्वच्छ डिफ़ॉल्ट',
  'Lower expression and variation reduce late-sentence hiss.':
    'कम अभिव्यक्ति और आरोह-अवरोह से वाक्य के अंत की फुफकार घटती है।',
  'Reset defaults': 'डिफ़ॉल्ट पुनर्स्थापित करें',
  Done: 'पूर्ण',
  'New workspace': 'नया कार्यस्थान',
  'Create project': 'परियोजना बनाएँ',
  'Project name': 'परियोजना का नाम',
  Cancel: 'रद्द करें',
  'No conversations yet.': 'अभी कोई वार्तालाप नहीं है।',
  'No local voice found': 'कोई स्थानीय आवाज़ नहीं मिली',
  'Add conversation': 'वार्तालाप जोड़ें',
  'Create your first conversation': 'अपना पहला वार्तालाप बनाएँ',
  'Saved locally': 'स्थानीय रूप से सहेजा गया',
  'Private · stays on this device': 'निजी · इसी डिवाइस पर रहता है',
  'Close settings': 'सेटिंग्स बंद करें',
  'Open speech settings': 'वाणी सेटिंग्स खोलें',
  'Local filtering and noise gating; text never leaves this device.':
    'स्थानीय फ़िल्टरिंग और शोर नियंत्रण; पाठ इस डिवाइस से बाहर नहीं जाता।',
  'Apache-2.0 model bundled for fully offline English speech.':
    'पूरी तरह ऑफ़लाइन अंग्रेज़ी वाणी के लिए Apache-2.0 मॉडल साथ दिया गया है।',
});

const PAUSE_COPY = Object.freeze({
  en: 'Pause naturally: use … for a short pause, or end a sentence and add a blank line for a longer pause.',
  hi: 'स्वाभाविक विराम: छोटे विराम के लिए … का उपयोग करें, या लंबे विराम के लिए वाक्य समाप्त करके एक खाली पंक्ति जोड़ें।',
});

/** Resolves dynamic English UI copy using the central Hindi dictionary. */
function localizedText(english, mode) {
  const hindi =
    UI_COPY[english] ??
    (english.startsWith('Selection ')
      ? english.replace('Selection ', 'चुना अंश ')
      : undefined);
  return hindi ? copyForMode({ en: english, hi: hindi }, mode) : english;
}

/** Translates the small set of dynamic text-node formats produced by views. */
function localizedNodeText(value, mode) {
  if (UI_COPY[value]) return localizedText(value, mode);
  if (/^\d+ characters$/.test(value)) {
    const count = value.split(' ')[0];
    return `${count} ${localizedText('characters', mode)}`;
  }
  if (value.endsWith(' / Conversation'))
    return value.replace('Conversation', localizedText('Conversation', mode));
  return value;
}

function localizeAttribute(element, attribute, mode) {
  const english = element.getAttribute(attribute);
  if (UI_COPY[english])
    element.setAttribute(attribute, localizedText(english, mode));
}

/** Applies the saved English, Hindi, or bilingual label preference. */
function applyLabelLanguage(root, mode) {
  const walker = root.ownerDocument.createTreeWalker(
    root,
    NodeFilter.SHOW_TEXT,
  );
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const value = node.textContent.trim();
    node.textContent = localizedNodeText(value, mode);
  }
  for (const element of root.querySelectorAll('[aria-label]'))
    localizeAttribute(element, 'aria-label', mode);
  for (const element of root.querySelectorAll('[title]'))
    localizeAttribute(element, 'title', mode);
  const pauseHelp = root.querySelector('[data-pause-help]');
  if (pauseHelp) pauseHelp.textContent = copyForMode(PAUSE_COPY, mode, ' ');
  for (const hint of root.querySelectorAll(
    '[data-setting] ~ *, [data-setting]',
  )) {
    const hindi = hint.closest('label')?.querySelector('small[lang="hi"]');
    if (hindi) hindi.classList.add('hidden');
  }
}

/**
 * Application controller with one-time delegated DOM events.
 * एक ही बार DOM इवेंट जोड़कर ऐप की स्थिति और दृश्य को नियंत्रित करता है।
 */
export class VaaniApp {
  #generationStartedAt = 0;
  #generationTimer;
  #saveStatus = 'Saved locally';
  #speechRun = 0;
  #speaking = false;
  #waveform;

  constructor(
    root,
    { store = new WorkspaceStore(), speech = new SpeechService() } = {},
  ) {
    this.root = root;
    this.store = store;
    this.speech = speech;
  }

  /** ऐप शुरू करता है। Starts rendering and voice discovery. */
  start() {
    this.root.addEventListener('click', (event) => this.#onClick(event));
    this.root.addEventListener('input', (event) => this.#onInput(event));
    this.root.addEventListener('change', (event) => this.#onChange(event));
    this.root.addEventListener('submit', (event) => this.#onSubmit(event));
    globalThis.speechSynthesis?.addEventListener('voiceschanged', () =>
      this.render(),
    );
    this.render();
  }

  /** मौजूदा स्टेट को UI में दिखाता है। Renders current state. */
  render({ openSettings = false } = {}) {
    this.#waveform?.destroy();
    const conversation = this.store.activeConversation;
    const voices = conversation
      ? this.speech.voiceCatalogFor(conversation.language)
      : [];
    this.root.innerHTML = renderApp({
      workspace: this.store.state,
      project: this.store.activeProject,
      conversation,
      voices,
      saveStatus: this.#saveStatus,
    });
    applyLabelLanguage(this.root, this.store.state.uiLanguage);
    this.#setStatus('');
    if (openSettings) this.root.querySelector('#settings-dialog')?.showModal();
    const audio = conversation?.sampleAudio;
    if (audio) this.#mountWaveform(audio);
  }

  #mountWaveform(url, { autoplay = false } = {}) {
    this.#waveform?.destroy();
    const container = this.root.querySelector('#waveform');
    if (!container) return;
    container.replaceChildren();
    this.#waveform = new WaveformPlayer(container, {
      onStateChange: (playing) => this.#setTransportState(playing),
      onStatus: (message) => this.#setStatus(message),
      onTimeChange: (seconds) => this.#setSeekTime(seconds),
      onReady: (duration) => this.#setSeekDuration(duration),
    });
    this.#waveform.load(url, { autoplay });
  }

  #setStatus(message) {
    const status = this.root.querySelector('#transport-status');
    if (!status) return;
    if (
      [
        'Loading neural voice…',
        'Polishing speech…',
        'Loading Kokoro-82M locally…',
        'Synthesizing with Kokoro…',
        'Loading DhVaani CPU model…',
        'Generating natural speech on CPU…',
      ].includes(message)
    ) {
      const spinner = status.ownerDocument.createElement('span');
      spinner.className =
        'block size-4 animate-spin rounded-full border-2 border-white/25 border-t-[#ff9b82]';
      spinner.setAttribute('aria-hidden', 'true');
      const label = status.ownerDocument.createElement('span');
      label.dataset.progressLabel = '';
      label.textContent = localizedText(message, this.store.state.uiLanguage);
      const elapsed = status.ownerDocument.createElement('time');
      elapsed.dataset.progressElapsed = '';
      elapsed.className = 'tabular-nums text-stone-500';
      status.dataset.busy = 'true';
      status.replaceChildren(spinner, label, elapsed);
      status.setAttribute(
        'aria-label',
        localizedText(message, this.store.state.uiLanguage),
      );
      return;
    }
    delete status.dataset.busy;
    status.removeAttribute('aria-label');
    status.textContent = [
      'Finished',
      'Waveform ready',
      'Kokoro waveform ready',
    ].includes(message)
      ? ''
      : localizedText(message, this.store.state.uiLanguage);
  }

  /** Keeps slow CPU generation visibly alive and cancelable. */
  #startGenerationProgress() {
    this.#generationStartedAt = performance.now();
    clearInterval(this.#generationTimer);
    this.#generationTimer = setInterval(() => {
      const elapsed = this.root.querySelector('[data-progress-elapsed]');
      if (!elapsed) return;
      const seconds = Math.floor(
        (performance.now() - this.#generationStartedAt) / 1_000,
      );
      elapsed.textContent = `${this.#formatTime(seconds)} elapsed`;
    }, 1_000);
  }

  #stopGenerationProgress() {
    clearInterval(this.#generationTimer);
    this.#generationTimer = undefined;
  }

  #setTransportState(playing) {
    this.#speaking = playing;
    const button = this.root.querySelector('[data-action="toggle-playback"]');
    if (!button) return;
    button.dataset.playing = String(playing);
    const mode = this.store.state.uiLanguage;
    const action = playing ? 'Stop' : 'Play';
    button.setAttribute(
      'aria-label',
      localizedText(playing ? 'Stop speech' : 'Play speech', mode),
    );
    button.querySelector('[data-label]').textContent = localizedText(
      action,
      mode,
    );
    button
      .querySelector('[data-play-icon]')
      ?.classList.toggle('hidden', playing);
    button
      .querySelector('[data-stop-icon]')
      ?.classList.toggle('hidden', !playing);
  }

  #setSeekTime(seconds) {
    const seek = this.root.querySelector('#audio-seek');
    if (seek) seek.value = String(seconds);
    const current = this.root.querySelector('#seek-current');
    if (current) current.textContent = this.#formatTime(seconds);
  }

  #setSeekDuration(duration) {
    const seek = this.root.querySelector('#audio-seek');
    if (seek) seek.max = String(duration);
    const total = this.root.querySelector('#seek-duration');
    if (total) total.textContent = this.#formatTime(duration);
  }

  #formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    return `${minutes}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
  }

  async #speak() {
    if (this.#speaking) return;
    const conversation = this.store.activeConversation;
    const voiceURI = this.root.querySelector('[data-field="voiceURI"]')?.value;
    if (!conversation?.text || !voiceURI) return;
    const button = this.root.querySelector('[data-action="toggle-playback"]');
    const run = ++this.#speechRun;
    this.#setTransportState(true);
    button.disabled = false;
    this.#startGenerationProgress();
    try {
      for await (const event of this.speech.play({
        text: conversation.text,
        language: conversation.language,
        voiceURI,
        rate: conversation.rate,
        pitch: conversation.pitch,
        settings: this.store.state.ttsSettings,
      })) {
        if (run !== this.#speechRun) return;
        if (event.message) {
          this.#setStatus(event.message);
        }
        if (event.state === 'playing') {
          button.disabled = false;
          this.#setTransportState(true);
        }
        if (event.state === 'ready') this.#useGeneratedAudio(event.url);
        if (event.state === 'finished') this.#setTransportState(false);
      }
    } catch (error) {
      console.error('Speech generation failed', error);
      if (run === this.#speechRun)
        this.#setStatus(`Speech generation failed — ${error.message}`);
    } finally {
      this.#stopGenerationProgress();
      if (run === this.#speechRun) {
        if (!this.#waveform?.isPlaying) this.#setTransportState(false);
        button.disabled = false;
      }
    }
  }

  #useGeneratedAudio(url) {
    const download = this.root.querySelector('#download-speech');
    if (download) {
      download.href = url;
      download.setAttribute('aria-disabled', 'false');
    }
    this.#mountWaveform(url, { autoplay: true });
  }

  #invalidateGeneratedAudio() {
    this.#stop();
    const waveform = this.root.querySelector('#waveform');
    this.#waveform?.destroy();
    this.#waveform = undefined;
    this.store.updateConversation('sampleAudio', '');
    if (waveform) waveform.innerHTML = '';
    this.#setSeekDuration(0);
    this.#setSeekTime(0);
  }

  #onClick(event) {
    const button = event.target.closest('button');
    const projectId = button?.dataset.projectId;
    const conversationId = button?.dataset.conversationId;
    if (projectId)
      return this.#select(() => this.store.selectProject(projectId));
    if (conversationId)
      return this.#select(() => this.store.selectConversation(conversationId));

    const actions = {
      'add-project': () =>
        this.root.querySelector('#project-dialog')?.showModal(),
      'cancel-project': () =>
        this.root.querySelector('#project-dialog')?.close(),
      'add-conversation': () => {
        this.store.addConversation();
        this.render();
        this.root.querySelector('[data-field="title"]')?.select();
      },
      'open-settings': () =>
        this.root.querySelector('#settings-dialog')?.showModal(),
      'close-settings': () => {
        this.root.querySelector('#settings-dialog')?.close();
        this.render();
      },
      'reset-settings': () => {
        for (const [name, value] of Object.entries(DEFAULT_TTS_SETTINGS))
          this.store.updateSetting(name, value);
        this.render({ openSettings: true });
      },
      'toggle-playback': () => this.#togglePlayback(),
      'clear-region': () => this.#waveform?.clearRegion(),
      'insert-performance': () => this.#insertPerformance(button),
    };
    actions[button?.dataset.action]?.();
  }

  /** Inserts real, parsed performance markup at the current text selection. */
  #insertPerformance(button) {
    const textarea = this.root.querySelector('#script-text');
    if (!textarea || !button?.dataset.markup) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = textarea.value.slice(start, end);
    const markup = button.dataset.markup;
    let replacement;
    if (markup === 'emphasis') {
      const target = selected || 'शब्द';
      replacement = `[emphasis=${target}] ${selected || target}`;
    } else {
      replacement = selected ? `${markup} ${selected}` : `${markup} `;
    }
    textarea.setRangeText(replacement, start, end, 'end');
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
    textarea.focus();
  }

  #stop() {
    this.#speechRun += 1;
    this.speech.stop();
    this.#speaking = false;
    this.#waveform?.stop();
    this.#stopGenerationProgress();
    const play = this.root.querySelector('[data-action="toggle-playback"]');
    if (play) play.disabled = false;
    this.#setTransportState(false);
    this.#setStatus('');
  }

  #togglePlayback() {
    if (this.#speaking) return this.#stop();
    if (this.#waveform?.isReady) return this.#waveform.toggle();
    this.#speak();
  }

  #select(change) {
    this.#stop();
    this.speech.stop({ release: true });
    change();
    this.render();
  }

  #onInput(event) {
    if (event.target.matches('[data-voice-search]')) {
      this.#applyVoiceFilter();
      return;
    }
    if (event.target.id === 'audio-seek') {
      const seconds = Number(event.target.value);
      this.#waveform?.seek(seconds);
      this.#setSeekTime(seconds);
      return;
    }
    const setting = event.target.dataset.setting;
    if (setting) {
      const value = Number(event.target.value);
      this.store.updateSetting(setting, value);
      const output = this.root.querySelector(
        `[data-setting-output="${setting}"]`,
      );
      if (output)
        output.textContent = ['initialPause', 'sentencePause'].includes(setting)
          ? `${value.toFixed(2)} s`
          : `${Math.round(value * 100)}%`;
      return;
    }

    const field = event.target.dataset.field;
    if (!field || ['language', 'voiceURI'].includes(field)) return;
    this.#saveStatus = 'Saving…';
    this.store.updateConversation(field, event.target.value, () => {
      this.#saveStatus = 'Saved locally';
      const status = this.root.querySelector('.save-status');
      if (status) status.innerHTML = '<i></i>Saved locally';
    });
    const save = this.root.querySelector('.save-status');
    if (save) save.innerHTML = '<i></i>Saving…';
    if (field === 'text') {
      this.#invalidateGeneratedAudio();
      this.root.querySelector('#character-count').textContent =
        `${event.target.value.length.toLocaleString()} characters`;
      this.root.querySelector('[data-action="toggle-playback"]').disabled =
        !event.target.value;
    }
  }

  #onChange(event) {
    if (event.target.matches('[data-voice-language]')) {
      this.#applyVoiceFilter();
      return;
    }
    if (event.target.matches('[data-ui-language]')) {
      this.store.updateUiLanguage(event.target.value);
      this.render({ openSettings: true });
      return;
    }
    const field = event.target.dataset.field;
    if (!['language', 'voiceURI'].includes(field)) return;
    this.#invalidateGeneratedAudio();
    this.store.updateConversation(field, event.target.value);
    this.store.save();
    this.render();
  }

  /** Applies voice search and language checkboxes without rerendering the app. */
  #applyVoiceFilter() {
    const query = this.root.querySelector('[data-voice-search]')?.value ?? '';
    const filters = {
      hindi: this.root.querySelector('[data-voice-language="hi"]')?.checked,
      english: this.root.querySelector('[data-voice-language="en"]')?.checked,
    };
    const select = this.root.querySelector('[data-field="voiceURI"]');
    if (!select) return;
    let visible = 0;
    for (const option of select.options) {
      const matches = matchesVoiceFilter(
        {
          name: option.dataset.voiceName ?? '',
          lang: option.dataset.voiceLang,
        },
        query,
        filters,
      );
      option.hidden = !matches;
      option.disabled = !matches;
      if (matches) visible += 1;
    }
    this.root
      .querySelector('[data-voice-empty]')
      ?.classList.toggle('hidden', visible > 0);
  }

  #onSubmit(event) {
    if (event.target.id !== 'project-form') return;
    event.preventDefault();
    const data = new FormData(event.target);
    this.store.addProject(data.get('title'), data.get('description'));
    this.root.querySelector('#project-dialog')?.close();
    this.render();
  }
}

new VaaniApp(document.querySelector('#app')).start();
