self.window = self;
self.importScripts(
  './tts/vendor/ort/ort.wasm.min.js',
  './tts/vendor/phonemize/piper_phonemize.js',
  './tts/piper-browser.js',
);

let enginePromise;

// One worker owns both phonemization and synthesis so neither blocks the UI.
self.addEventListener('message', async ({ data }) => {
  const { action, id } = data;
  try {
    if (action === 'phonemize') {
      const phonemizer = await self.Piper.getPhonemizer();
      self.postMessage({
        id,
        result: phonemizer.phonemize(data.texts, data.language),
      });
      return;
    }

    enginePromise ??= self.Piper.createEngine(data.onnxUrl, data.configUrl);
    const engine = await enginePromise;
    const samples = await engine.speak(data.text, data.options);
    self.postMessage(
      { id, result: { samples, sampleRate: engine.sampleRate } },
      [samples.buffer],
    );
  } catch (error) {
    self.postMessage({ id, error: error.message });
  }
});
