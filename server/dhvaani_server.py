#!/usr/bin/env python3
"""Local CPU-only HTTP bridge for the bundled DhVaani ONNX model.

यह सर्वर केवल localhost पर चलता है; पाठ इस डिवाइस से बाहर नहीं जाता।
"""

from __future__ import annotations

import json
import os
import tempfile
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

from dhvaani_onnx import synthesize


ROOT = Path(__file__).resolve().parents[1]
MODEL_DIR = ROOT / "models" / "dhvaani"
PROMPT_WAV = ROOT / "public" / "audio" / "hindi-sample.wav"
PROMPT_TEXT = (
    "पहाड़ों की गोद में बसा एक छोटा सा गाँव था, जहाँ चारों ओर हरियाली और शांत वातावरण था।"
    " सुबह की पहली किरण पड़ते ही पक्षियों की चहचहाहट से पूरा गाँव गूँज उठता था।"
    " वहाँ के लोग सादगी और प्रेम के साथ अपना जीवन बिताते थे।"
)


class DhVaaniHandler(BaseHTTPRequestHandler):
    """Minimal JSON/WAV API consumed by the browser application."""

    server_version = "SanjuDhVaani/1.0"

    def _headers(self, status: HTTPStatus, content_type: str) -> None:
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_OPTIONS(self) -> None:  # noqa: N802
        self._headers(HTTPStatus.NO_CONTENT, "text/plain")

    def do_GET(self) -> None:  # noqa: N802
        if self.path != "/health":
            self._json_error(HTTPStatus.NOT_FOUND, "Not found")
            return
        missing = [name for name in REQUIRED_FILES if not (MODEL_DIR / name).is_file()]
        status = HTTPStatus.SERVICE_UNAVAILABLE if missing else HTTPStatus.OK
        body = json.dumps(
            {"ready": not missing, "device": "cpu", "missing": missing},
            ensure_ascii=False,
        ).encode()
        self._headers(status, "application/json; charset=utf-8")
        self.wfile.write(body)

    def do_POST(self) -> None:  # noqa: N802
        if self.path != "/v1/audio/speech":
            self._json_error(HTTPStatus.NOT_FOUND, "Not found")
            return
        try:
            size = int(self.headers.get("Content-Length", "0"))
            request = json.loads(self.rfile.read(size))
            text = str(request.get("text", "")).strip()
            if not text or len(text) > 2_000:
                raise ValueError("Text must contain 1–2,000 characters.")

            settings = request.get("settings", {})
            expression = _clamp(settings.get("expressiveness", 0.38), 0.2, 0.9)
            variation = _clamp(settings.get("variation", 0.42), 0.2, 0.9)
            speed = _clamp(settings.get("speed", 0.96), 0.7, 1.25)
            steps = round(6 + variation * 7)
            guidance = 0.75 + expression * 0.5

            with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as output:
                output_path = Path(output.name)
            try:
                synthesize(
                    text=text,
                    prompt_wav=str(PROMPT_WAV),
                    prompt_text=PROMPT_TEXT,
                    onnx_dir=MODEL_DIR,
                    out_path=str(output_path),
                    num_step=steps,
                    guidance_scale=guidance,
                    speed=speed,
                    seed=int(request.get("seed", 666)),
                    int8=True,
                    threads=max(1, min(8, (os.cpu_count() or 2) // 2)),
                )
                audio = output_path.read_bytes()
            finally:
                output_path.unlink(missing_ok=True)

            self._headers(HTTPStatus.OK, "audio/wav")
            self.wfile.write(audio)
        except (ValueError, TypeError, json.JSONDecodeError) as error:
            self._json_error(HTTPStatus.BAD_REQUEST, str(error))
        except Exception as error:  # Keep implementation details out of the UI.
            self._json_error(HTTPStatus.INTERNAL_SERVER_ERROR, f"DhVaani failed: {error}")

    def _json_error(self, status: HTTPStatus, message: str) -> None:
        body = json.dumps({"error": message}, ensure_ascii=False).encode()
        self._headers(status, "application/json; charset=utf-8")
        self.wfile.write(body)

    def log_message(self, message: str, *args: object) -> None:
        print(f"DhVaani: {message % args}")


def _clamp(value: object, minimum: float, maximum: float) -> float:
    return min(maximum, max(minimum, float(value)))


REQUIRED_FILES = (
    "text_encoder_int8.onnx",
    "fm_decoder_int8.onnx",
    "vocoder_backbone.onnx",
    "vocos_head.npz",
    "mel_fb.npz",
    "tokens.txt",
)


if __name__ == "__main__":
    address = ("127.0.0.1", int(os.getenv("SANJU_TTS_PORT", "8765")))
    print(f"DhVaani CPU service: http://{address[0]}:{address[1]}")
    ThreadingHTTPServer(address, DhVaaniHandler).serve_forever()
