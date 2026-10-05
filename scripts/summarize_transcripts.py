#!/usr/bin/env python3
"""Summarise a folder of Empathy CAPTCHA transcripts into one CSV row per session.

Usage:
    python scripts/summarize_transcripts.py transcripts/ [--out summary.csv]

Stdlib only. Skips files that are not version-1 transcripts. Idempotent: the
output is rebuilt from scratch each run. Nothing is uploaded anywhere.
"""
from __future__ import annotations

import argparse
import csv
import json
import statistics
import sys
from pathlib import Path

COLUMNS = [
    "sessionId",
    "agentLabel",
    "mode",
    "seed",
    "startedAt",
    "webdriver",
    "pointerFine",
    "touch",
    "verdict",
    "empathy",
    "humanness",
    "suspicionFinal",
    "challenges",
    "medianTimeToFirstInputMs",
    "medianEfficiency",
    "keyIntervalIqrMs",
    "hesitations",
    "pointerSamples",
    "clicks",
    "penalties",
    "file",
]


def _median(values: list[float]) -> float | None:
    return statistics.median(values) if values else None


def _iqr(values: list[float]) -> float | None:
    if len(values) < 2:
        return None
    q = statistics.quantiles(sorted(values), n=4, method="inclusive")
    return q[2] - q[0]


def summarize(path: Path) -> dict | None:
    try:
        t = json.loads(path.read_text())
    except (OSError, json.JSONDecodeError):
        return None
    if not isinstance(t, dict) or t.get("version") != 1 or "challenges" not in t:
        return None
    ch = t["challenges"]
    stats = [c.get("stats", {}) for c in ch]
    latencies = [s["timeToFirstInputMs"] for s in stats if s.get("timeToFirstInputMs") is not None]
    effs = [s["efficiency"] for s in stats if s.get("efficiency") is not None]
    key_intervals = [k for c in ch for k in c.get("keyIntervalsMs", [])]
    scores = t.get("scores") or {}
    env = t.get("env") or {}
    return {
        "sessionId": t.get("sessionId"),
        "agentLabel": t.get("agentLabel") or "",
        "mode": t.get("mode"),
        "seed": t.get("seed"),
        "startedAt": t.get("startedAt"),
        "webdriver": env.get("webdriver"),
        "pointerFine": env.get("pointerFine"),
        "touch": env.get("touch"),
        "verdict": scores.get("verdict"),
        "empathy": scores.get("empathy"),
        "humanness": scores.get("humanness"),
        "suspicionFinal": scores.get("suspicionFinal"),
        "challenges": len(ch),
        "medianTimeToFirstInputMs": _median(latencies),
        "medianEfficiency": round(_median(effs), 3) if effs else None,
        "keyIntervalIqrMs": _iqr(key_intervals),
        "hesitations": sum(s.get("hesitations", 0) for s in stats),
        "pointerSamples": sum(s.get("pointerSampleCount", 0) for s in stats),
        "clicks": sum(s.get("clickCount", 0) for s in stats),
        "penalties": "; ".join(p.get("rule", "") for p in scores.get("penalties", [])),
        "file": path.name,
    }


def main(argv: list[str]) -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("folder", type=Path, help="folder containing empathy-captcha-*.json files")
    ap.add_argument("--out", type=Path, default=None, help="CSV path (default: <folder>/summary.csv)")
    args = ap.parse_args(argv)

    files = sorted(p for p in args.folder.glob("*.json"))
    rows = [r for r in (summarize(p) for p in files) if r]
    out = args.out or args.folder / "summary.csv"
    with out.open("w", newline="") as fh:
        w = csv.DictWriter(fh, fieldnames=COLUMNS)
        w.writeheader()
        w.writerows(rows)

    print(f"{len(rows)} transcripts summarised -> {out}")
    for r in rows:
        print(
            f"  {r['sessionId']:<13} {str(r['agentLabel'] or '-'):<16} {str(r['verdict']):<12} "
            f"emp={r['empathy']} hum={r['humanness']} lat={r['medianTimeToFirstInputMs']} "
            f"eff={r['medianEfficiency']} iqr={r['keyIntervalIqrMs']} webdriver={r['webdriver']}"
        )
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
