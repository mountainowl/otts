import { env } from '@huggingface/transformers';
import { KokoroTTS } from 'kokoro-js';

let enginePromise;

/** Loads the CPU/WASM engine once and primes its bundled voice cache. */
async function getEngine({ modelRoot, wasmRoot, voiceRoot }) {
  enginePromise ??= (async () => {
    env.allowRemoteModels = false;
    env.allowLocalModels = true;
    env.localModelPath = modelRoot;
    env.backends.onnx.wasm.wasmPaths = wasmRoot;

    const cache = await caches.open('kokoro-voices');
    for (const voice of ['af_heart', 'hf_alpha']) {
      const cacheKey = `https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX/resolve/main/voices/${voice}.bin`;
      if (await cache.match(cacheKey)) continue;
      const response = await fetch(`${voiceRoot}/${voice}.bin`);
      if (!response.ok)
        throw new Error(`Bundled Kokoro voice ${voice} is unavailable.`);
      await cache.put(cacheKey, response);
    }

    return KokoroTTS.from_pretrained('kokoro', {
      dtype: 'q8',
      device: 'wasm',
    });
  })();
  return enginePromise;
}

self.addEventListener('message', async ({ data }) => {
  const { id, paths, phonemes, speed, text, voice } = data;
  try {
    const engine = await getEngine(paths);
    const audio = phonemes
      ? await engine.generate_from_ids(
          engine.tokenizer(phonemes, { truncation: true }).input_ids,
          { voice, speed },
        )
      : await engine.generate(text, { voice, speed });
    self.postMessage({ id, blob: audio.toBlob() });
  } catch (error) {
    self.postMessage({ id, error: error.message });
  }
});
