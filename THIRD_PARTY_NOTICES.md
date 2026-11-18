# Third-party notices

## Piper browser speech runtime

The local neural speech path uses ONNX Runtime Web and Piper phonemization assets derived from the open-source Piper browser reference implementation.

- ONNX Runtime: MIT License
- `@diffusionstudio/piper-wasm`: MIT License
- Piper: GPL-3.0 License

## Priyamvada Hindi voice

The bundled `hi_IN-priyamvada-medium` model is distributed by the Piper Voices project. Its training dataset is licensed under CC BY-NC-SA 4.0. This bundled model is suitable for personal and non-commercial use; replace it with an appropriately licensed model before commercial distribution.

## Kokoro-82M ONNX

- Model: `onnx-community/Kokoro-82M-v1.0-ONNX`, revision `1939ad2a8e416c0acfeecc08a694d14ef25f2231`
- Upstream model: `hexgrad/Kokoro-82M`
- Runtime: `kokoro-js`
- License: Apache-2.0
- Bundled files: `public/models/kokoro/`

The application bundles the quantized ONNX checkpoint with `af_heart` English and `hf_alpha` Hindi voices.

## Project Vaani / DhVaani 0.5

- Upstream model: `ARTPARK-IISc/DhVaani-0.5`
- CPU export and inference code: `Bbkblo/DhVaani-0.5-ONNX`
- Architecture: ZipVoice flow matching with a Vocos vocoder
- Bundled files: `models/dhvaani/`
- Runtime: ONNX Runtime CPU execution provider

The export repository labels its code and artifacts Apache-2.0, while the upstream
DhVaani distribution and training-data boundary are described as CC BY-NC 4.0.
This project therefore conservatively treats the bundled weights as non-commercial.
Confirm upstream rights before commercial redistribution.
