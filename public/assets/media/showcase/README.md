# Synthetic media fixture provenance

These files are original test artifacts generated locally for Axiom Learning Runtime. They contain
no patient data, clinical source material or third-party media.

- `axiom-media-fixture.mp4`: 24-second, 640×360 H.264/AAC video generated from ffmpeg `color`,
  `drawtext` and `sine` filters.
- `axiom-media-poster.jpg`: 640×360 JPEG generated from the same synthetic title frame.
- `axiom-audio-fixture.m4a`: 24-second AAC tone generated with ffmpeg's `sine` filter.
- `axiom-reference-fixture.pdf`: one-page PDF generated directly by the local Node script.
- `axiom-media-captions.vtt` and `axiom-audio-transcript.txt`: hand-authored accessibility text.

Regenerate binary fixtures with `npm run media:fixtures`. The captions, transcript and this
provenance file are intentionally hand-authored and are not overwritten by that command.
