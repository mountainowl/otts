/**
 * Selects one localized value for English, Hindi, or bilingual UI modes.
 *
 * Keeping this policy here prevents renderers and controllers from growing
 * nested language branches. भाषा चयन का नियम पूरे UI में एक जैसा रहता है।
 *
 * @param {{ en: string, hi: string }} copy Translated text pair.
 * @param {'en' | 'hi' | 'both'} mode Active label mode.
 * @param {string} [separator=' · '] Text used between bilingual labels.
 * @returns {string}
 */
export function copyForMode({ en, hi }, mode, separator = ' · ') {
  if (mode === 'hi') return hi;
  if (mode === 'both') return `${en}${separator}${hi}`;
  return en;
}
