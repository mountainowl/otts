import {
  DHVAANI_VOICE,
  HINDI_NEURAL_VOICE,
  KOKORO_HINDI_VOICE,
  KOKORO_VOICE,
} from './speech-service.js';

const ICONS = Object.freeze({
  plus: '<svg class="size-5" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 5v14M5 12h14"/></svg>',
  play: '<svg class="size-5" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m8 5 11 7-11 7Z"/></svg>',
  stop: '<svg class="size-5" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="6" y="6" width="12" height="12"/></svg>',
  spark:
    '<svg class="size-5" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m12 3 1.2 4.3L17 9l-3.8 1.7L12 15l-1.2-4.3L7 9l3.8-1.7L12 3Z"/></svg>',
  lock: '<svg class="size-4" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>',
  settings:
    '<svg class="size-5" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 7h10M18 7h2M4 17h2M10 17h10M14 4v6M7 14v6"/></svg>',
  clear:
    '<svg class="size-5" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m5 5 14 14M19 5 5 19"/></svg>',
  download:
    '<svg class="size-5" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 4v11m0 0 4-4m-4 4-4-4M5 20h14"/></svg>',
  pause:
    '<svg class="size-4" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M9 6v12M15 6v12"/></svg>',
  calm: '<svg class="size-4" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 10c2-2 4-2 6 0s4 2 6 0 4-2 4-2M4 15c2-2 4-2 6 0s4 2 6 0 4-2 4-2"/></svg>',
  warm: '<svg class="size-4" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="3"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3M5 5l2 2m10 10 2 2M19 5l-2 2M7 17l-2 2"/></svg>',
  reflective:
    '<svg class="size-4" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 3v5m0 8v5M3 12h5m8 0h5M6 6l3 3m6 6 3 3M18 6l-3 3M9 15l-3 3"/></svg>',
  energetic:
    '<svg class="size-4" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m13 2-7 12h6l-1 8 7-12h-6Z"/></svg>',
  emphasis:
    '<svg class="size-4" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M8 5h8M12 5v11M8 19h8"/></svg>',
});
export const LANGUAGES = Object.freeze([
  'en-US',
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
  'es-ES',
  'fr-FR',
  'de-DE',
  'it-IT',
  'ja-JP',
  'ko-KR',
  'pt-BR',
  'zh-CN',
  'ar-SA',
]);
const LANGUAGE_NAMES = Object.freeze({
  'brx-IN': 'Bodo (India)',
  'ks-IN': 'Kashmiri (India)',
  'sat-IN': 'Santali (India)',
});
const field =
  'mt-1.5 h-9 w-full rounded-md border border-[#d7d5d2] bg-white px-3 text-xs text-[#1b1a19] outline-none transition hover:border-[#aaa6a1] focus:border-[#d94b32] focus:ring-2 focus:ring-[#d94b32]/10';
const button =
  'inline-flex min-h-9 items-center justify-center gap-1.5 rounded-md px-3 text-xs font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d94b32] disabled:cursor-not-allowed disabled:opacity-40';
const primary = `${button} bg-[#d94b32] text-white hover:bg-[#b83a26]`;
const secondary = `${button} border border-[#d7d5d2] bg-white text-[#1b1a19] hover:border-[#8f8b86] hover:bg-[#f7f7f6]`;
const eyebrow =
  'text-[9px] font-semibold uppercase tracking-[0.15em] text-[#d94b32]';

const selected = (actual, expected) => (actual === expected ? 'selected' : '');

/** HTML-escapes user content. उपयोगकर्ता के टेक्स्ट को सुरक्षित बनाता है। */
export function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
function languageName(code) {
  if (LANGUAGE_NAMES[code]) return LANGUAGE_NAMES[code];
  try {
    return new Intl.DisplayNames(['en'], { type: 'language' }).of(code);
  } catch {
    return code;
  }
}
/** Renders the available local/system voices with one selected value. */
function voiceOptions(items, selected) {
  if (!items.length) return '<option>No local voice found</option>';
  return items
    .map(
      (voice) =>
        `<option value="${escapeHtml(voice.voiceURI)}" ${voice.voiceURI === selected ? 'selected' : ''}>${escapeHtml(voice.name)} · ${voice.lang}</option>`,
    )
    .join('');
}
/** Renders project navigation; selection behavior remains in VaaniApp. */
function sidebar(workspace, project, conversation) {
  return `<aside class="border-b border-[#2d2b2a] bg-[#171716] p-4 text-stone-100 lg:min-h-[calc(100vh-56px)] lg:border-r lg:border-b-0 lg:p-5" aria-label="Projects and conversations">
  <div class="mb-5 flex items-center justify-between"><h1 class="flex flex-wrap items-baseline gap-1.5 tracking-tight"><span class="${eyebrow}">Workspace</span><span aria-hidden="true" class="text-stone-600">|</span><span>Projects</span></h1><button class="${button} size-9 border border-white/15 bg-white/5 p-0 text-white hover:bg-white/10" data-action="add-project" aria-label="Create project">${ICONS.plus}</button></div>
  <nav class="flex gap-2 overflow-x-auto lg:grid" aria-label="Projects">${workspace.projects.map((item) => `<button class="grid min-w-52 grid-cols-[36px_1fr] items-center gap-2.5 rounded-md border p-2 text-left ${item.id === project?.id ? 'border-white/15 bg-white/10' : 'border-transparent hover:bg-white/5'}" data-project-id="${item.id}"><span class="grid size-9 place-items-center rounded-md bg-[#d94b32] text-xs text-white">${escapeHtml(item.title.slice(0, 1).toUpperCase())}</span><span class="min-w-0"><strong class="block truncate">${escapeHtml(item.title)}</strong><small class="mt-0.5 block text-[10px] text-stone-400">${item.conversations.length} ${item.conversations.length === 1 ? 'conversation' : 'conversations'}</small></span></button>`).join('')}</nav>
  <div class="mt-7"><div class="mb-2 flex items-center justify-between px-1"><span class="text-[9px] uppercase tracking-[0.16em] text-stone-500">Conversations</span><button class="grid size-8 place-items-center rounded-md border border-white/15 text-stone-300 hover:bg-white/10" data-action="add-conversation" ${project ? '' : 'disabled'} aria-label="Add conversation">${ICONS.plus}</button></div>
  <div class="grid gap-1">${project?.conversations.length ? project.conversations.map((item) => `<button class="rounded-r-md border-l-2 px-3 py-2 text-left ${item.id === conversation?.id ? 'border-[#d94b32] bg-white/10' : 'border-transparent hover:bg-white/5'}" data-conversation-id="${item.id}"><span class="block truncate">${escapeHtml(item.title)}</span><small class="mt-0.5 block truncate text-[10px] text-stone-400">${escapeHtml(item.purpose || languageName(item.language))}</small></button>`).join('') : '<div class="px-3 py-4 text-xs text-stone-500">No conversations yet.</div>'}</div></div></aside>`;
}
/** Renders waveform controls; WaveformPlayer owns their runtime behavior. */
function waveform(conversation) {
  return `<div class="mt-3 border-t border-white/10 pt-3" aria-labelledby="sample-heading"><div class="flex items-start justify-between gap-2"><div><h3 id="sample-heading" class="flex flex-wrap items-baseline gap-1.5 text-lg font-black"><span class="${eyebrow}">Waveform editor</span><span aria-hidden="true" class="text-stone-500">|</span><span>Generated speech</span></h3><p class="mt-0.5 text-xs text-stone-400">Click to seek. Drag to select a segment.</p></div><div class="flex gap-1.5"><button class="${secondary} size-9 p-0" data-action="clear-region" aria-label="Clear selection" title="Clear selection">${ICONS.clear}</button><a class="${secondary} size-9 p-0 [&[aria-disabled=true]]:pointer-events-none [&[aria-disabled=true]]:opacity-40" id="download-speech" href="${conversation.sampleAudio || '#waveform'}" aria-label="Download" title="Download" aria-disabled="${!conversation.sampleAudio}" download="speech-sample.wav">${ICONS.download}</a></div></div><div id="waveform" class="mt-2 min-h-28 w-full cursor-crosshair border-y border-white/10 text-xs text-stone-400" aria-label="Interactive audio waveform"><span class="grid min-h-28 place-items-center">Generate with Kokoro or Priyamvada to display the waveform.</span></div><label class="mt-2 grid grid-cols-[auto_1fr_auto] items-center gap-2 text-xs text-stone-400"><span id="seek-current">0:00</span><span class="sr-only">Audio seek bar</span><input id="audio-seek" class="w-full cursor-pointer accent-[#b95338]" type="range" min="0" max="0" step="0.01" value="0" aria-label="Audio seek bar"/><span id="seek-duration">0:00</span></label></div>`;
}

function localVoiceNote(voiceURI) {
  if (voiceURI === DHVAANI_VOICE.voiceURI)
    return '<strong class="text-[#ff8268]">DhVaani 0.5 · CPU.</strong> 27-language local speech through the bundled localhost service; no GPU or cloud connection.';
  if (voiceURI === HINDI_NEURAL_VOICE.voiceURI)
    return '<strong class="text-[#ff8268]">Priyamvada neural voice.</strong> Local filtering and noise gating; text never leaves this device.';
  if (voiceURI === KOKORO_VOICE.voiceURI)
    return '<strong class="text-[#ff8268]">Kokoro-82M ONNX.</strong> Apache-2.0 model bundled for fully offline English speech.';
  if (voiceURI === KOKORO_HINDI_VOICE.voiceURI)
    return '<strong class="text-[#ff8268]">Kokoro-82M हिंदी.</strong> स्थानीय हिंदी ध्वनि और ध्वन्यात्मक प्रसंस्करण; पाठ इस डिवाइस पर रहता है।';
  return '';
}

function performanceToolbar() {
  const items = [
    ['pause', '[pause=500]', 'Add 500 ms pause'],
    ['calm', '[calm]', 'Calm delivery'],
    ['warm', '[warm]', 'Warm delivery'],
    ['reflective', '[reflective]', 'Reflective delivery'],
    ['energetic', '[energetic]', 'Energetic delivery'],
    ['emphasis', 'emphasis', 'Emphasize selected words'],
  ];
  return `<div class="flex gap-1 sm:flex-col" aria-label="Performance controls">${items
    .map(
      ([icon, markup, label]) =>
        `<button class="${secondary} size-9 shrink-0 p-0" type="button" data-action="insert-performance" data-markup="${markup}" aria-label="${label}" title="${label}">${ICONS[icon]}</button>`,
    )
    .join('')}</div>`;
}

/** Renders the active conversation editor and its integrated Voice Studio. */
function editor(project, conversation, voices, _status, settings) {
  if (!conversation)
    return `<div class="grid min-h-[60vh] place-items-center text-center"><div><span class="mx-auto grid size-14 place-items-center rounded-2xl bg-stone-900 text-white">${ICONS.spark}</span><h2 class="mt-5 text-2xl font-black">Create your first conversation</h2><p class="mx-auto mt-2 max-w-sm text-sm text-stone-500">Keep scripts, context, and voice settings together inside this project.</p><button class="${primary} mt-5" data-action="add-conversation">${ICONS.plus} Add conversation</button></div></div>`;
  const selectedVoice = voices.some(
    (voice) => voice.voiceURI === conversation.voiceURI,
  )
    ? conversation.voiceURI
    : voices[0]?.voiceURI || '';
  const localNote = localVoiceNote(selectedVoice);
  return `<div class="flex min-w-0 flex-wrap items-baseline gap-1.5"><span class="text-xs text-stone-500">${escapeHtml(project.title)} / Conversation</span><span aria-hidden="true" class="text-stone-400">|</span><input class="min-w-48 flex-1 bg-transparent text-3xl font-black tracking-tight outline-none focus:underline focus:decoration-[#d94b32]" data-field="title" aria-label="Conversation title" value="${escapeHtml(conversation.title)}" maxlength="80" /></div>
  <div class="mt-7 grid gap-4 sm:grid-cols-2"><label class="text-xs font-bold text-stone-600">Purpose<input class="${field}" data-field="purpose" value="${escapeHtml(conversation.purpose)}" /></label><label class="text-xs font-bold text-stone-600">Language<select class="${field}" data-field="language">${LANGUAGES.map((code) => `<option value="${code}" ${code === conversation.language ? 'selected' : ''}>${escapeHtml(languageName(code))} · ${code}</option>`).join('')}</select></label><label class="text-xs font-bold text-stone-600 sm:col-span-2">Description<input class="${field}" data-field="description" value="${escapeHtml(conversation.description)}" /></label></div>
  <div class="mt-6"><div class="mb-2 flex justify-between"><label class="text-xs font-bold text-stone-600" for="script-text">Original text</label><span class="text-xs text-stone-500" id="character-count">${conversation.text.length.toLocaleString()} characters</span></div><div class="grid gap-1.5 sm:grid-cols-[minmax(0,1fr)_auto]"><textarea class="min-h-52 w-full resize-y rounded-md border border-[#d7d5d2] bg-white p-3 text-sm leading-7 outline-none focus:border-[#d94b32] focus:ring-2 focus:ring-[#d94b32]/10" id="script-text" data-field="text" dir="auto">${escapeHtml(conversation.text)}</textarea>${performanceToolbar()}</div><p class="mt-2 text-xs text-stone-500" data-pause-help></p><details class="mt-2 border-l-2 border-[#d94b32] pl-3 text-xs text-stone-500"><summary class="cursor-pointer text-stone-700">Performance syntax</summary><div class="mt-2 grid gap-1 leading-5"><code>[pause=500]</code><span>Exact 500 ms silence</span><code>[calm] [warm] [reflective] [energetic]</code><span>Applies supported pace and expression controls to the following segment</span><code>[emphasis=हरियाली]</code><span>Marks a word using model-readable punctuation</span><span>Commas, …, — and ? still shape natural phrasing.</span></div></details></div>
  <section class="mt-5 rounded-md bg-[#171716] p-3 text-stone-100 shadow-sm sm:p-4" aria-labelledby="voice-heading"><h2 id="voice-heading" class="flex flex-wrap items-baseline gap-1.5"><span class="${eyebrow}">Voice studio</span><span aria-hidden="true" class="text-stone-600">|</span><span>Natural speech, on device</span></h2>
  <div class="mt-3 grid items-end gap-2.5 sm:grid-cols-[minmax(220px,1fr)_auto_auto_auto]"><label><span class="sr-only">Voice</span><select class="${field}" aria-label="Voice" data-field="voiceURI" ${voices.length ? '' : 'disabled'}>${voiceOptions(voices, selectedVoice)}</select></label><div><span class="block text-xs text-stone-400">Speed</span><strong>${settings.speed.toFixed(2)}×</strong></div><div><span class="block text-xs text-stone-400">Clarity</span><strong>${Math.round(settings.clarity * 100)}%</strong></div><button class="${secondary}" data-action="open-settings">${ICONS.settings} Tune</button></div>
  ${localNote ? `<p class="mt-3 rounded-md bg-white/8 p-2.5 text-xs leading-4 text-stone-300">${localNote}</p>` : ''}
  <div class="mt-3 flex flex-wrap items-center gap-2 border-t border-white/10 pt-3"><button class="${primary} min-w-28" data-action="toggle-playback" aria-label="Play speech" ${!conversation.text || !voices.length ? 'disabled' : ''}><span data-play-icon>${ICONS.play}</span><span class="hidden" data-stop-icon>${ICONS.stop}</span><span data-label>Play</span></button><span class="text-xs text-stone-400" id="transport-status">Ready to play</span></div>${waveform(conversation)}</section>`;
}
const HINDI_SETTING_LABELS = Object.freeze({
  initialPause: 'आरंभिक विराम',
  speed: 'वाक्-गति',
  expressiveness: 'अभिव्यक्ति / स्वर-शैली',
  variation: 'आरोह-अवरोह',
  sentencePause: 'वाक्य-विराम',
  clarity: 'स्वर-स्पष्टता',
  volume: 'ध्वनि-स्तर',
});

function settingControl(name, label, hindi, value, minimum, maximum, step) {
  hindi = HINDI_SETTING_LABELS[name] ?? hindi;
  const display = ['initialPause', 'sentencePause'].includes(name)
    ? `${value.toFixed(2)} s`
    : `${Math.round(value * 100)}%`;
  return `<label class="grid grid-cols-[1fr_auto] gap-2 rounded-md border border-[#dedcd9] bg-[#f7f7f6] p-3 text-xs"><span>${label}<small class="mt-1 block font-normal text-stone-500" lang="hi">${hindi}</small></span><output class="text-[#d94b32]" data-setting-output="${name}">${display}</output><input class="col-span-2 accent-[#d94b32]" type="range" data-setting="${name}" min="${minimum}" max="${maximum}" step="${step}" value="${value}" /></label>`;
}
function settingsDialog(settings, uiLanguage) {
  const languageSetting = `<label class="grid grid-cols-[1fr_auto] gap-2 rounded-md border border-[#dedcd9] bg-[#f7f7f6] p-3 text-xs font-medium sm:col-span-2">Label language<select class="${field} col-span-2" data-ui-language><option value="en" ${selected(uiLanguage, 'en')}>English</option><option value="hi" ${selected(uiLanguage, 'hi')}>हिंदी</option><option value="both" ${selected(uiLanguage, 'both')}>English + हिंदी</option></select></label>`;
  return `<dialog id="settings-dialog" class="m-auto w-[min(720px,calc(100vw-32px))] rounded-md bg-white p-0 text-[#1b1a19] shadow-2xl [&::backdrop]:bg-black/65 [&::backdrop]:backdrop-blur-sm"><form method="dialog" class="grid gap-4 p-5"><div class="flex justify-between"><div><span class="${eyebrow}">Offline voice</span><h2 class="mt-1">Speech settings</h2><p class="mt-1 text-xs text-stone-500" lang="hi">आवाज़ की गति, भाव और स्पष्टता बदलें।</p></div><button type="button" class="${secondary} size-9 p-0" data-action="close-settings" aria-label="Close settings">×</button></div><div class="grid gap-2 sm:grid-cols-2">${languageSetting}${settingControl('initialPause', 'Initial pause', 'शुरुआत का विराम', settings.initialPause, 0, 2, 0.05)}${settingControl('speed', 'Speaking speed', 'बोलने की गति', settings.speed, 0.7, 1.25, 0.01)}${settingControl('expressiveness', 'Expression', 'भाव की मात्रा', settings.expressiveness, 0.2, 0.9, 0.01)}${settingControl('variation', 'Voice variation', 'आवाज़ में बदलाव', settings.variation, 0.2, 0.9, 0.01)}${settingControl('sentencePause', 'Sentence pause', 'वाक्य के बीच विराम', settings.sentencePause, 0.05, 0.8, 0.01)}${settingControl('clarity', 'Clarity filter', 'आवाज़ की स्पष्टता', settings.clarity, 0, 1, 0.01)}${settingControl('volume', 'Output level', 'आवाज़ का स्तर', settings.volume, 0.5, 1, 0.01)}</div><div class="border-l-2 border-[#d94b32] bg-[#fff1ed] p-3 text-xs"><strong>Cleaner default</strong><p class="mt-1 text-stone-600">Lower expression and variation reduce late-sentence hiss.</p></div><div class="flex justify-end gap-2"><button type="button" class="${secondary}" data-action="reset-settings">Reset defaults</button><button type="button" class="${primary}" data-action="close-settings">Done</button></div></form></dialog>`;
}
/** Produces the app shell from state. दिए गए स्टेट से पूरा ऐप HTML बनाता है। */
export function renderApp({
  workspace,
  project,
  conversation,
  voices,
  saveStatus,
}) {
  return `<a class="fixed left-4 top-[-4rem] z-50 rounded-md bg-[#171716] px-4 py-3 text-white focus:top-4" href="#workspace">Skip to workspace</a><header class="flex h-14 items-center justify-between border-b border-[#dedcd9] bg-white px-4 sm:px-6"><a class="flex items-center gap-2 tracking-tight" href="#workspace" aria-label="Vaani home"><span class="grid size-8 place-items-center rounded-md bg-[#171716] text-[#ff8268]">${ICONS.spark}</span>Vaani</a><div class="flex items-center gap-3"><button class="${secondary} size-9 p-0" data-action="open-settings" aria-label="Open speech settings">${ICONS.settings}</button></div></header><main class="grid min-h-[calc(100vh-56px)] lg:grid-cols-[248px_minmax(0,1fr)]" id="workspace">${sidebar(workspace, project, conversation)}<section class="min-w-0 bg-[#f4f4f3] px-4 py-6 sm:px-7 lg:px-10" aria-label="Speech editor"><div class="mx-auto max-w-5xl">${editor(project, conversation, voices, saveStatus, workspace.ttsSettings)}</div></section></main><dialog id="project-dialog" class="m-auto w-[min(460px,calc(100vw-32px))] rounded-md bg-white p-0 shadow-2xl [&::backdrop]:bg-black/65"><form id="project-form" class="grid gap-4 p-5"><div><span class="${eyebrow}">New workspace</span><h2 class="mt-1">Create project</h2></div><label class="text-xs">Project name<input class="${field}" name="title" required maxlength="60" /></label><label class="text-xs">Description<textarea class="${field} h-auto py-3" name="description" rows="3" maxlength="180"></textarea></label><div class="flex justify-end gap-2"><button type="button" data-action="cancel-project" class="${secondary}">Cancel</button><button class="${primary}">Create project</button></div></form></dialog>${settingsDialog(workspace.ttsSettings, workspace.uiLanguage)}`;
}
