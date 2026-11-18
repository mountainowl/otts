/**
 * Safe synthesis defaults for the bundled Hindi model.
 * बंडल किए गए हिंदी मॉडल के लिए सुरक्षित वॉइस डिफ़ॉल्ट।
 */
export const DEFAULT_TTS_SETTINGS = Object.freeze({
  initialPause: 0.45,
  speed: 0.96,
  expressiveness: 0.38,
  variation: 0.42,
  sentencePause: 0.3,
  clarity: 0.62,
  volume: 0.9,
});

const RANGES = Object.freeze({
  initialPause: [0, 2],
  speed: [0.7, 1.25],
  expressiveness: [0.2, 0.9],
  variation: [0.2, 0.9],
  sentencePause: [0.05, 0.8],
  clarity: [0, 1],
  volume: [0.5, 1],
});

/**
 * Clamps persisted or user-provided values to model-safe ranges.
 * सहेजी गई सेटिंग को मॉडल की सुरक्षित सीमा में रखता है।
 *
 * @param {Partial<typeof DEFAULT_TTS_SETTINGS>} candidate
 * @returns {typeof DEFAULT_TTS_SETTINGS}
 */
export function normalizeTtsSettings(candidate = {}) {
  return Object.fromEntries(
    Object.entries(DEFAULT_TTS_SETTINGS).map(([name, fallback]) => {
      const [minimum, maximum] = RANGES[name];
      const value = Number(candidate[name]);
      return [
        name,
        Number.isFinite(value)
          ? Math.min(maximum, Math.max(minimum, value))
          : fallback,
      ];
    }),
  );
}
