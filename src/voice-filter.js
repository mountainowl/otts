/** Maps a BCP-47 voice language to the two user-facing filter groups. */
export function voiceLanguageGroup(language = '') {
  const primary = language.toLowerCase().split('-')[0];
  if (primary === 'hi') return 'hi';
  if (primary === 'en') return 'en';
  if (primary === 'mul') return 'both';
  return 'other';
}

/**
 * Applies the search and language checkboxes to one voice description.
 * Multilingual local models remain visible when either language is enabled.
 */
export function matchesVoiceFilter(
  voice,
  query,
  { english = true, hindi = true } = {},
) {
  const group = voiceLanguageGroup(voice.lang);
  const languageMatches =
    (group === 'both' && (english || hindi)) ||
    (group === 'en' && english) ||
    (group === 'hi' && hindi);
  if (!languageMatches) return false;
  const normalizedQuery = query.trim().toLocaleLowerCase();
  if (!normalizedQuery) return true;
  return `${voice.name} ${voice.lang}`
    .toLocaleLowerCase()
    .includes(normalizedQuery);
}
