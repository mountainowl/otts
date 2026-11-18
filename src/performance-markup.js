const PERFORMANCE_TAG =
  /\[((?:pause=\d{1,4}|calm|warm|reflective|energetic|emphasis=[^\],]+)(?:\s*,\s*(?:calm|warm|reflective|energetic|emphasis=[^\],]+))*)\]/giu;

/**
 * Splits a script into independently rendered performance segments.
 * पाठ को शैली और सटीक विराम वाले छोटे भागों में बाँटता है।
 */
export function parsePerformanceScript(script) {
  const segments = [];
  let cursor = 0;
  let pendingPauseMs = 0;
  let pendingDirectives = [];

  const pushText = (rawText) => {
    let text = rawText.trim();
    if (!text) return;
    const emphasis = pendingDirectives
      .find((directive) => directive.startsWith('emphasis='))
      ?.slice('emphasis='.length)
      .trim();
    if (emphasis && text.includes(emphasis))
      text = text.replace(emphasis, `—${emphasis}—`);
    segments.push({
      text,
      pauseBeforeMs: pendingPauseMs,
      styles: pendingDirectives.filter((directive) => !directive.includes('=')),
    });
    pendingPauseMs = 0;
    pendingDirectives = [];
  };

  for (const match of script.matchAll(PERFORMANCE_TAG)) {
    pushText(script.slice(cursor, match.index));
    const directives = match[1].split(',').map((part) => part.trim());
    const pause = directives.find((directive) =>
      directive.startsWith('pause='),
    );
    if (pause) pendingPauseMs += Math.min(4_000, Number(pause.slice(6)));
    pendingDirectives.push(
      ...directives.filter((directive) => !directive.startsWith('pause=')),
    );
    cursor = match.index + match[0].length;
  }
  pushText(script.slice(cursor));

  return segments.length
    ? segments
    : [{ text: script.trim(), pauseBeforeMs: 0, styles: [] }];
}

/** Maps only controls the active engines genuinely expose. */
export function settingsForPerformance(settings, styles = []) {
  const next = { ...settings };
  for (const style of styles) {
    if (style === 'calm') {
      next.speed *= 0.9;
      next.expressiveness *= 0.82;
      next.variation *= 0.82;
    } else if (style === 'warm') {
      next.speed *= 0.97;
      next.expressiveness *= 1.14;
      next.variation *= 1.05;
    } else if (style === 'reflective') {
      next.speed *= 0.88;
      next.expressiveness *= 1.08;
      next.variation *= 1.18;
    } else if (style === 'energetic') {
      next.speed *= 1.06;
      next.expressiveness *= 1.22;
      next.variation *= 1.16;
    }
  }
  next.speed = clamp(next.speed, 0.7, 1.25);
  next.expressiveness = clamp(next.expressiveness, 0.2, 0.9);
  next.variation = clamp(next.variation, 0.2, 0.9);
  return next;
}

/** Joins compatible PCM WAV chunks and inserts sample-accurate silence. */
export async function joinWavSegments(parts) {
  const parsed = await Promise.all(
    parts.map(async ({ blob, pauseBeforeMs = 0 }) => ({
      ...(await readWav(blob)),
      pauseBeforeMs,
    })),
  );
  if (!parsed.length) return new Blob([], { type: 'audio/wav' });
  const base = parsed[0];
  const chunks = [];
  let dataBytes = 0;
  for (const part of parsed) {
    if (
      part.sampleRate !== base.sampleRate ||
      part.blockAlign !== base.blockAlign
    )
      throw new Error('Generated WAV segments use incompatible formats.');
    const silence = new Uint8Array(
      Math.round((part.pauseBeforeMs / 1_000) * base.sampleRate) *
        base.blockAlign,
    );
    chunks.push(silence, part.data);
    dataBytes += silence.length + part.data.length;
  }
  const header = base.header.slice();
  const view = new DataView(
    header.buffer,
    header.byteOffset,
    header.byteLength,
  );
  view.setUint32(4, header.length + dataBytes - 8, true);
  view.setUint32(base.dataSizeOffset, dataBytes, true);
  return new Blob([header, ...chunks], { type: 'audio/wav' });
}

async function readWav(blob) {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let offset = 12;
  let sampleRate;
  let blockAlign;
  while (offset + 8 <= bytes.length) {
    const chunk = view.getUint32(offset, false);
    const size = view.getUint32(offset + 4, true);
    if (chunk === 0x666d7420) {
      sampleRate = view.getUint32(offset + 12, true);
      blockAlign = view.getUint16(offset + 20, true);
    }
    if (chunk === 0x64617461) {
      const dataStart = offset + 8;
      return {
        sampleRate,
        blockAlign,
        dataSizeOffset: offset + 4,
        header: bytes.slice(0, dataStart),
        data: bytes.slice(dataStart, dataStart + size),
      };
    }
    offset += 8 + size + (size % 2);
  }
  throw new Error('Generated audio is not a supported PCM WAV.');
}

function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}
