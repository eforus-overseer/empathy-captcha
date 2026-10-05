#!/usr/bin/env python3
"""Fetch a small Quick, Draw! template set for the sketch challenges.

Downloads only the first few hundred KB of each category's simplified ndjson
(byte-range request), keeps the first N recognised drawings, downsamples the
strokes, and writes a compact JSON bundle to src/data/quickdraw.json.

Data: https://quickdraw.withgoogle.com/data (Google Creative Lab), CC BY 4.0.
Stdlib only. Idempotent: skips categories already present unless --overwrite.

Usage:
    python scripts/fetch_quickdraw.py                 # default categories
    python scripts/fetch_quickdraw.py --per-class 60 --overwrite
"""
from __future__ import annotations

import argparse
import json
import sys
import urllib.request
from pathlib import Path

BASE = "https://storage.googleapis.com/quickdraw_dataset/full/simplified/{name}.ndjson"
DEFAULT_CLASSES = ["sheep", "cat", "dog", "fish", "sea turtle", "bird"]
OUT = Path(__file__).resolve().parents[1] / "src" / "data" / "quickdraw.json"


def fetch_head(name: str, byte_limit: int) -> list[dict]:
    url = BASE.format(name=name.replace(" ", "%20"))
    req = urllib.request.Request(url, headers={"Range": f"bytes=0-{byte_limit - 1}", "User-Agent": "empathy-captcha/0.1"})
    with urllib.request.urlopen(req, timeout=60) as resp:
        raw = resp.read()
    lines = raw.split(b"\n")[:-1]  # drop the truncated tail line
    out = []
    for line in lines:
        try:
            out.append(json.loads(line))
        except json.JSONDecodeError:
            continue
    return out


def downsample(points: list[int], max_points: int) -> list[int]:
    if len(points) <= max_points:
        return points
    step = (len(points) - 1) / (max_points - 1)
    return [points[round(i * step)] for i in range(max_points)]


def compact(drawing: dict, max_points: int) -> list[list[list[int]]]:
    strokes = []
    for xs, ys in drawing["drawing"]:
        strokes.append([downsample(xs, max_points), downsample(ys, max_points)])
    return strokes


def main(argv: list[str]) -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--classes", nargs="*", default=DEFAULT_CLASSES)
    ap.add_argument("--per-class", type=int, default=60)
    ap.add_argument("--max-points", type=int, default=24)
    ap.add_argument("--byte-limit", type=int, default=600_000)
    ap.add_argument("--overwrite", action="store_true")
    ap.add_argument("--out", type=Path, default=OUT)
    args = ap.parse_args(argv)

    bundle: dict = {"source": "Quick, Draw! dataset (Google), CC BY 4.0", "url": "https://quickdraw.withgoogle.com/data", "classes": {}}
    if args.out.exists() and not args.overwrite:
        bundle = json.loads(args.out.read_text())
        bundle.setdefault("classes", {})

    for name in args.classes:
        if name in bundle["classes"] and not args.overwrite:
            print(f"skip {name}: already have {len(bundle['classes'][name])}")
            continue
        drawings = fetch_head(name, args.byte_limit)
        good = [d for d in drawings if d.get("recognized")][: args.per_class]
        bundle["classes"][name] = [compact(d, args.max_points) for d in good]
        print(f"{name}: {len(drawings)} fetched, {len(good)} kept")

    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(json.dumps(bundle, separators=(",", ":")))
    print(f"wrote {args.out} ({args.out.stat().st_size // 1024} KB)")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
