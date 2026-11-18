#!/usr/bin/env python3
"""Torch-free DhVaani-0.5 inference: ONNX Runtime and NumPy only.

Adapted from Bbkblo/DhVaani-0.5-ONNX (Apache-2.0). Model weights retain
their upstream non-commercial licensing boundary; see THIRD_PARTY_NOTICES.md.
"""
from __future__ import annotations

import argparse
import logging
from functools import lru_cache
from pathlib import Path

import numpy as np
import onnxruntime as ort
import soundfile as sf
from numpy.lib.stride_tricks import sliding_window_view
from scipy.signal import resample_poly

PUNCT = set(";:,.!?；：，。！？")
SR = 24000
N_FFT = 1024
HOP = 256
N_MELS = 100
FEAT_SCALE = 0.1
TARGET_RMS = 0.1


def load_tokens(path: Path) -> dict:
    t2i = {}
    with open(path, encoding="utf-8") as f:
        for line in f:
            tok, tid = line.rstrip("\n").split("\t")
            t2i[tok] = int(tid)
    return t2i


def add_punctuation(text: str) -> str:
    text = text.strip()
    if not text:
        return "."
    if text[-1] not in PUNCT:
        text += "."
    return text


def texts_to_ids(text: str, t2i: dict) -> np.ndarray:
    ids = [t2i[ch] for ch in text if ch in t2i]
    if not ids:
        raise ValueError("tokenizer produced empty ids — check text / tokens.txt")
    return np.asarray(ids, dtype=np.int64)[None, :]


def rms_norm(wav: np.ndarray, target=TARGET_RMS):
    rms = float(np.sqrt(np.mean(wav**2)))
    if rms < target and rms > 0:
        wav = wav * (target / rms)
    return wav.astype(np.float32), rms


def resample(wav: np.ndarray, orig_sr: int, target_sr: int) -> np.ndarray:
    if orig_sr == target_sr:
        return wav.astype(np.float32)
    g = np.gcd(orig_sr, target_sr)
    return resample_poly(wav, target_sr // g, orig_sr // g).astype(np.float32)


_FB = None
_WIN = None


def _load_mel_assets(onnx_dir: Path | None = None):
    global _FB, _WIN
    if _FB is not None:
        return
    cand = []
    if onnx_dir is not None:
        cand.append(Path(onnx_dir) / "mel_fb.npz")
    cand.append(Path("/home/user/onnx/dhvaani/mel_fb.npz"))
    for p in cand:
        if p.is_file():
            z = np.load(p)
            _FB = z["fb"].astype(np.float32)  # (n_fft//2+1, n_mels)
            _WIN = z["window"].astype(np.float32)
            return
    # fallback: periodic Hann + triangular HTK (less accurate)
    n = np.arange(N_FFT, dtype=np.float32)
    _WIN = (0.5 - 0.5 * np.cos(2 * np.pi * n / N_FFT)).astype(np.float32)
    n_freqs = N_FFT // 2 + 1
    f_max = SR / 2.0
    def hz_to_mel(f):
        return 2595.0 * np.log10(1.0 + np.asarray(f) / 700.0)
    def mel_to_hz(m):
        return 700.0 * (10 ** (np.asarray(m) / 2595.0) - 1.0)
    m = np.linspace(hz_to_mel(0.0), hz_to_mel(f_max), N_MELS + 2)
    hz = mel_to_hz(m)
    fft_freqs = np.linspace(0, f_max, n_freqs)
    fb = np.zeros((n_freqs, N_MELS), dtype=np.float32)
    for i in range(N_MELS):
        l, c, r = hz[i], hz[i + 1], hz[i + 2]
        left = (fft_freqs - l) / max(c - l, 1e-9)
        right = (r - fft_freqs) / max(r - c, 1e-9)
        fb[:, i] = np.clip(np.minimum(left, right), 0, 1)
    _FB = fb


def vocos_fbank(wav: np.ndarray, sr: int = SR, onnx_dir: Path | None = None) -> np.ndarray:
    """(T, 100) log-mel matching ZipVoice VocosFbank / torchaudio HTK."""
    _load_mel_assets(onnx_dir)
    wav = np.asarray(wav, dtype=np.float32)
    if wav.ndim > 1:
        wav = wav.mean(axis=-1)
    pad = N_FFT // 2
    wav_p = np.pad(wav, (pad, pad), mode="constant")
    if wav_p.size < N_FFT:
        wav_p = np.pad(wav_p, (0, N_FFT - wav_p.size))
    n_frames = 1 + (len(wav_p) - N_FFT) // HOP
    frames = np.lib.stride_tricks.as_strided(
        wav_p,
        shape=(n_frames, N_FFT),
        strides=(wav_p.strides[0] * HOP, wav_p.strides[0]),
    ).copy()
    spec = np.fft.rfft(frames * _WIN, n=N_FFT, axis=1)
    mag = np.abs(spec).astype(np.float32)
    mel = mag @ _FB  # (T, 100)
    logmel = np.log(np.clip(mel, 1e-7, None))
    duration = len(wav) / sr
    num_frames = int((round(duration * sr) + HOP // 2) // HOP)
    if logmel.shape[0] > num_frames:
        logmel = logmel[:num_frames]
    elif logmel.shape[0] < num_frames:
        logmel = np.pad(logmel, ((0, num_frames - logmel.shape[0]), (0, 0)), mode="edge")
    return logmel.astype(np.float32)


def get_time_steps(num_step=16, t_shift=0.5):
    t = np.linspace(0.0, 1.0, num_step + 1, dtype=np.float32)
    t = t_shift * t / (1.0 + (t_shift - 1.0) * t)
    return t.astype(np.float32)


@lru_cache(maxsize=8)
def session(path: Path, threads=1) -> ort.InferenceSession:
    so = ort.SessionOptions()
    so.inter_op_num_threads = threads
    so.intra_op_num_threads = threads
    so.graph_optimization_level = ort.GraphOptimizationLevel.ORT_ENABLE_ALL
    return ort.InferenceSession(str(path), sess_options=so, providers=["CPUExecutionProvider"])


def run(sess, **feeds):
    ins = {i.name: feeds[i.name] for i in sess.get_inputs() if i.name in feeds}
    # allow positional fallback by order
    if len(ins) != len(sess.get_inputs()):
        names = [i.name for i in sess.get_inputs()]
        vals = list(feeds.values())
        ins = {n: v for n, v in zip(names, vals)}
    out = sess.run(None, ins)
    return out[0]


def istft_same(spec: np.ndarray, window: np.ndarray, n_fft: int, hop: int, win_length: int):
    """Vocos ISTFT with padding='same'. spec: (B, n_fft//2+1, T) complex64."""
    B, N, T = spec.shape
    pad = (win_length - hop) // 2
    ifft = np.fft.irfft(spec, n=n_fft, axis=1)  # (B, win_length, T)
    ifft = ifft * window[None, :, None]
    output_size = (T - 1) * hop + win_length
    y = np.zeros((B, output_size), dtype=np.float32)
    env = np.zeros((output_size,), dtype=np.float32)
    w2 = window.astype(np.float32) ** 2
    for t in range(T):
        sl = slice(t * hop, t * hop + win_length)
        y[:, sl] += ifft[:, :, t]
        env[sl] += w2
    y = y[:, pad : output_size - pad]
    env = env[pad : output_size - pad]
    env = np.maximum(env, 1e-11)
    return y / env[None, :]


class VocosONNX:
    def __init__(self, backbone_path: Path, head_path: Path, threads=1):
        self.bb = session(backbone_path, threads)
        z = np.load(head_path)
        self.W = z["linear_weight"].astype(np.float32)  # (1026, 512)
        self.b = z["linear_bias"].astype(np.float32)
        self.window = z["window"].astype(np.float32)
        self.n_fft = int(z["n_fft"])
        self.hop = int(z["hop_length"])
        self.win_length = int(z["win_length"])

    def decode(self, mels: np.ndarray) -> np.ndarray:
        # mels (B, 100, T)
        hidden = run(self.bb, mels=mels.astype(np.float32))  # (B, T, 512)
        x = hidden @ self.W.T + self.b  # (B, T, 1026)
        x = np.transpose(x, (0, 2, 1))  # (B, 1026, T)
        mag, p = np.split(x, 2, axis=1)
        mag = np.exp(np.clip(mag, None, np.log(1e2)))
        S = mag * (np.cos(p) + 1j * np.sin(p))
        wav = istft_same(S, self.window, self.n_fft, self.hop, self.win_length)
        return np.clip(wav, -1.0, 1.0)


def synthesize(
    text: str,
    prompt_wav: str,
    prompt_text: str,
    onnx_dir: Path,
    out_path: str,
    num_step=16,
    guidance_scale=1.0,
    speed=1.0,
    t_shift=0.5,
    seed=666,
    int8=True,
    threads=1,
):
    rng = np.random.RandomState(seed)
    onnx_dir = Path(onnx_dir)
    suffix = "_int8" if int8 else ""
    te = session(onnx_dir / f"text_encoder{suffix}.onnx", threads)
    fm = session(onnx_dir / f"fm_decoder{suffix}.onnx", threads)
    voc = VocosONNX(onnx_dir / "vocoder_backbone.onnx", onnx_dir / "vocos_head.npz", threads)
    t2i = load_tokens(onnx_dir / "tokens.txt")

    wav, sr = sf.read(prompt_wav, always_2d=False)
    wav = np.asarray(wav, dtype=np.float32)
    if wav.ndim > 1:
        wav = wav.mean(axis=1)
    wav = resample(wav, sr, SR)
    wav, prompt_rms = rms_norm(wav)

    feats = vocos_fbank(wav, SR, onnx_dir=onnx_dir)  # (T, 100)
    prompt_features = (feats[None, :, :] * FEAT_SCALE).astype(np.float32)  # (1, T, 100)
    prompt_len = np.array(prompt_features.shape[1], dtype=np.int64)

    text = add_punctuation(text)
    prompt_text = add_punctuation(prompt_text)
    tokens = texts_to_ids(text, t2i)
    prompt_tokens = texts_to_ids(prompt_text, t2i)
    speed_t = np.array(float(speed), dtype=np.float32)

    text_condition = run(
        te,
        tokens=tokens,
        prompt_tokens=prompt_tokens,
        prompt_features_len=prompt_len,
        speed=speed_t,
    ).astype(np.float32)

    B, num_frames, feat_dim = text_condition.shape
    x = rng.randn(B, num_frames, feat_dim).astype(np.float32)
    speech_condition = np.zeros((B, num_frames, feat_dim), dtype=np.float32)
    pl = int(prompt_len)
    speech_condition[:, : min(pl, num_frames), :] = prompt_features[:, : min(pl, num_frames), :]

    ts = get_time_steps(num_step, t_shift)
    gs = np.array(float(guidance_scale), dtype=np.float32)

    for step in range(num_step):
        t = np.array(float(ts[step]), dtype=np.float32)  # rank-0 float32
        v = run(
            fm,
            t=t,
            x=x,
            text_condition=text_condition,
            speech_condition=speech_condition,
            guidance_scale=gs,
        ).astype(np.float32)
        dt = float(ts[step + 1] - ts[step])
        x = x + v * dt

    pred = x[:, pl:, :]  # drop prompt frames
    mels = np.transpose(pred, (0, 2, 1)) / FEAT_SCALE  # (B, 100, T)
    audio = voc.decode(mels)[0]
    if prompt_rms < TARGET_RMS:
        audio = audio * (prompt_rms / TARGET_RMS)
    # Preserve dynamics while leaving 1 dB of headroom. बिना क्लिपिंग के
    # स्वाभाविक उतार-चढ़ाव बनाए रखने के लिए हल्का peak normalization।
    peak = float(np.max(np.abs(audio))) if audio.size else 0.0
    if peak > 0.891:
        audio *= 0.891 / peak
    audio = np.clip(audio, -0.891, 0.891).astype(np.float32)
    Path(out_path).parent.mkdir(parents=True, exist_ok=True)
    sf.write(out_path, audio, SR)
    return audio


def main():
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
    ap = argparse.ArgumentParser()
    ap.add_argument("--text", required=True)
    ap.add_argument("--prompt-wav", required=True)
    ap.add_argument("--prompt-text", required=True)
    ap.add_argument("--out", default="/home/user/audio/dhvaani_torchfree.wav")
    ap.add_argument("--onnx-dir", default="/home/user/onnx/dhvaani")
    ap.add_argument("--num-step", type=int, default=16)
    ap.add_argument("--guidance-scale", type=float, default=1.0)
    ap.add_argument("--speed", type=float, default=1.0)
    ap.add_argument("--seed", type=int, default=666)
    ap.add_argument("--fp32", action="store_true")
    ap.add_argument("--threads", type=int, default=2)
    a = ap.parse_args()
    import time

    t0 = time.time()
    audio = synthesize(
        a.text,
        a.prompt_wav,
        a.prompt_text,
        Path(a.onnx_dir),
        a.out,
        num_step=a.num_step,
        guidance_scale=a.guidance_scale,
        speed=a.speed,
        seed=a.seed,
        int8=not a.fp32,
        threads=a.threads,
    )
    dt = time.time() - t0
    logging.info(
        "wrote %s  dur=%.2fs  wall=%.1fs  RTF=%.2f",
        a.out,
        len(audio) / SR,
        dt,
        dt / max(len(audio) / SR, 1e-6),
    )


if __name__ == "__main__":
    main()
