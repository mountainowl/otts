# Hindi validation audio analysis

Measured with FFmpeg `astats`, an 8 kHz high-pass filter, and `volumedetect` on equal-length segments.

| Metric                  | Original neural WAV | Tuned neural WAV |                     Change |
| ----------------------- | ------------------: | ---------------: | -------------------------: |
| Duration                |             20.03 s |          18.51 s |                    −1.52 s |
| Overall peak            |          −1.30 dBFS |       −0.92 dBFS | No clipping in either file |
| Overall RMS             |         −15.81 dBFS |      −15.58 dBFS |                   +0.23 dB |
| 8 kHz+ mean, first 5 s  |            −42.8 dB |         −46.9 dB |                    −4.1 dB |
| 8 kHz+ mean, middle 5 s |            −47.0 dB |         −49.3 dB |                    −2.3 dB |
| 8 kHz+ mean, ending     |            −43.3 dB |         −48.7 dB |                    −5.4 dB |

The original file was not clipped, so peak limiting alone could not explain or fix the reported static. Elevated high-frequency energy returned near the ending. Lower synthesis noise/variation plus local high-pass, clarity-controlled low-pass, gentle noise gating, short fades, and peak normalization reduced that energy across all measured segments, with the largest reduction at the ending.

These measurements support lower static; they do not prove human-equivalent naturalness. The replayable WAV remains the listening acceptance check.
