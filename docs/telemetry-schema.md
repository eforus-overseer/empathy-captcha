# Transcript schema (version 1)

A transcript is the JSON file the verdict screen offers for download. It is
built entirely in the browser; nothing is sent anywhere. Filename:
`empathy-captcha-<sessionId>.json`.

```jsonc
{
  "version": 1,
  "sessionId": "VK-G9DH8DJJ",          // random, not derived from anything personal
  "startedAt": "2026-10-05T17:58:00.000Z",
  "endedAt":   "2026-10-05T18:01:12.000Z",
  "seed": 7,                           // ?seed= or random; replays the challenge order
  "agentLabel": "cua-v1" | null,       // ?agent= tag for agent-vs-human runs
  "mode": "standard" | "all",          // "all" = ?all=1, every challenge in registry order
  "env": {
    "userAgent": "...",
    "webdriver": false,                // navigator.webdriver
    "viewport": { "w": 1200, "h": 725 },
    "pointerFine": true,               // (pointer: fine) media query
    "touch": false,                    // navigator.maxTouchPoints > 0
    "language": "en-US",
    "timezone": "Asia/Jerusalem",
    "reducedMotion": false
  },
  "challenges": [ /* ChallengeRecord, in play order */ ],
  "scores": {
    "empathy": 76,                     // 0..100
    "humanness": 80,                   // 0..100
    "verdict": "HUMAN" | "REPLICANT" | "INCONCLUSIVE",
    "readouts": { "pupilDilation": 73, "blushResponse": 76, "respiration": 85, "capillary": 100 },
    "suspicionFinal": 27,
    "penalties": [ { "rule": "keystrokes with no rhythm variance", "delta": -20 } ]
  }
}
```

## ChallengeRecord

```jsonc
{
  "id": "tortoise",
  "act": 2,
  "type": "grid",
  "startedAt": 1791223080000,          // epoch ms, when the prompt finished typing
  "endedAt":   1791223086500,
  "timeToFirstInputMs": 517,           // first click/key/drag after the prompt; null if none
  "pointerSamples": [[t, x, y], ...],  // t = ms since start; x,y px relative to the console frame;
                                       // <= 50 Hz, max 2000 per challenge
  "clicks": [[t, x, y], ...],          // pointerdown events
  "keyIntervalsMs": [120, 90, ...],    // gaps between text-producing keydowns; key identities are not stored
  "blurs": 0,                          // window blur events during the challenge
  "answer": { "kind": "grid", "selected": [0, 2, 5] },   // see Answer union in src/engine/types.ts
  "evaluation": { "empathyDelta": 1, "suspicionDelta": -2, "note": "Most of them." },
  "stats": {
    "durationMs": 6500,
    "timeToFirstInputMs": 517,
    "pathLengthPx": 812,
    "straightLinePx": 140,
    "efficiency": 0.97,                // mean per-segment straight/path between clicks; null if no movement
    "directionChanges": 3,             // heading changes > 45 degrees
    "hesitations": 1,                  // gaps > 800 ms before first input
    "keyIntervalIqrMs": null,          // IQR of keyIntervalsMs; null with < 2 intervals
    "pointerSampleCount": 10,
    "clickCount": 4,
    "blurCount": 0
  }
}
```

## What is deliberately not recorded

- Key identities outside the answer text itself.
- IP address, cookies, local storage, or any identifier that persists across runs.
- Anything from outside the page.

## Reading transcripts in bulk

`python scripts/summarize_transcripts.py <folder> --out summary.csv` writes one
row per session with the aggregates the scorer uses. Keep transcript folders
out of git (the `.gitignore` already excludes `transcripts/` and
`empathy-captcha-*.json`).
