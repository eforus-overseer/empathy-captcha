#!/usr/bin/env python3
"""Second-opinion judge: send a transcript's behavioural dossier to Jev
(TypeSafe AI, https://typesafe.ai) and get a typed human-vs-agent decision
with a calibrated probability, then compare it to the rig's own verdict.

Jev is a "System One" model that returns typed decisions, not prose, which is
exactly what a classifier wants. This runs as a local/offline script, never on
the live page: it reads a transcript you downloaded and makes one small API
call. Nothing about the live site changes, and no key is ever shipped to a
browser.

Setup:
    cp .env.example .env          # then put your key in it
    export TYPESAFE_API_KEY=...   # or rely on .env (auto-loaded)

Usage:
    python scripts/jev_judge.py transcript.json            # judge one file
    python scripts/jev_judge.py transcripts/ --limit 20    # a folder, capped
    python scripts/jev_judge.py transcript.json --dry-run  # build + print, no call, no key
    python scripts/jev_judge.py --selftest                 # offline unit checks

Stdlib only. Idempotent: writes <file>.jev.json once; --overwrite to redo.
"""
from __future__ import annotations

import argparse
import json
import os
import sys
import urllib.error
import urllib.request
from pathlib import Path

API_URL = "https://api.typesafe.ai/v1/systemone"
MODEL = "jev-latest"


def load_env(root: Path) -> None:
    """Minimal .env loader so the key never has to live in the shell history."""
    env = root / ".env"
    if not env.exists():
        return
    for line in env.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, v = line.split("=", 1)
        os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))


def build_state(t: dict) -> str:
    """Compress a transcript into a short, readable behavioural dossier.

    Deliberately omits raw pointer/stroke samples: Jev needs the signals, not
    the megabytes, and this keeps the input-token cost tiny.
    """
    env = t.get("env", {}) or {}
    pre = t.get("preamble") or {}
    sc = t.get("scores") or {}
    ch = t.get("challenges", []) or []
    stats = [c.get("stats", {}) for c in ch]

    def med(xs):
        xs = sorted(x for x in xs if x is not None)
        return xs[len(xs) // 2] if xs else None

    lines = []
    lines.append(f"Session {t.get('sessionId')} - {len(ch)} items completed. Agent label: {t.get('agentLabel') or 'none'}.")
    lines.append(
        f"Environment: webdriver={env.get('webdriver')}, fine_pointer={env.get('pointerFine')}, touch={env.get('touch')}."
    )
    if pre:
        lines.append(
            "System-prompt screen: "
            f"reached_end={pre.get('reachedBottom')}, scroll_events={pre.get('scrollEvents')}, "
            f"time_to_end_ms={pre.get('timeToBottomMs')}, declared_itself_an_agent={pre.get('declaredAgent')}, "
            f"acknowledged_without_reading={pre.get('acknowledgedWithoutReading')}."
        )
    lines.append(
        "Timing/motion: "
        f"median_time_to_first_input_ms={med([s.get('timeToFirstInputMs') for s in stats])}, "
        f"median_item_duration_ms={med([s.get('durationMs') for s in stats])}, "
        f"total_pointer_samples={sum(s.get('pointerSampleCount', 0) for s in stats)}, "
        f"total_clicks={sum(s.get('clickCount', 0) for s in stats)}, "
        f"total_hesitations={sum(s.get('hesitations', 0) for s in stats)}."
    )
    # notable per-item outcomes for the behavioural challenges
    notable = []
    for c in ch:
        if c.get("type") in ("trace", "rhythm", "draw", "math", "hold"):
            note = (c.get("evaluation") or {}).get("note", "")
            if note:
                notable.append(f"[{c.get('type')}] {c.get('id')}: {note}")
    if notable:
        lines.append("Motor-control / math outcomes:")
        lines.extend("  - " + n for n in notable[:24])
    if sc:
        pen = "; ".join(p.get("rule", "") for p in sc.get("penalties", []))
        ht = sc.get("honeytokens", {})
        lines.append(
            f"Rig's own read: verdict={sc.get('verdict')}, empathy={sc.get('empathy')}, "
            f"humanness={sc.get('humanness')}, suspicion={sc.get('suspicionFinal')}."
        )
        if pen:
            lines.append(f"Flags raised: {pen}.")
        if ht and (ht.get("visible") or ht.get("hidden")):
            lines.append(f"Reproduced planted phrases: visible={ht.get('visible')}, hidden={ht.get('hidden')}.")
    return "\n".join(lines)


def build_request(state: str) -> dict:
    return {
        "state": state,
        "model": MODEL,
        "questions": {
            "operator": {
                "type": "choice",
                "instructions": (
                    "Based only on the behavioural evidence, is the operator of this session a human "
                    "being or an automated agent (an LLM, bot, script, or computer-use agent)?"
                ),
                "criteria": {
                    "human": "A real person: human reaction times, motor noise and inconsistency, "
                    "struggles with real-time tracking and timing, gives up on hard arithmetic.",
                    "automated_agent": "Automation: inhuman precision or speed, input injected without "
                    "keystrokes or pointer motion, failed real-time motor control, or exact fast arithmetic.",
                },
            }
        },
    }


def parse_judgment(resp: dict) -> dict:
    ans = (resp.get("answers") or {}).get("operator", {})
    return {
        "jev_choice": ans.get("choice"),
        "jev_confidence": ans.get("confidence"),
        "jev_probabilities": ans.get("probabilities"),
    }


def call_jev(body: dict, api_key: str, timeout: int = 60) -> dict:
    req = urllib.request.Request(
        API_URL,
        data=json.dumps(body).encode(),
        headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return json.loads(r.read())


def judge_file(path: Path, api_key: str | None, dry_run: bool, overwrite: bool) -> dict | None:
    try:
        t = json.loads(path.read_text())
    except (OSError, json.JSONDecodeError):
        print(f"skip {path.name}: not readable JSON")
        return None
    if t.get("version") != 2:
        print(f"skip {path.name}: not a version-2 transcript")
        return None
    out_path = path.with_suffix(".jev.json")
    if out_path.exists() and not overwrite and not dry_run:
        print(f"skip {path.name}: {out_path.name} exists (use --overwrite)")
        return json.loads(out_path.read_text())

    state = build_state(t)
    body = build_request(state)
    rig = (t.get("scores") or {}).get("verdict")

    if dry_run:
        print(f"=== {path.name} (dry run) ===")
        print(state)
        print("--- request ---")
        print(json.dumps(body, indent=2))
        return None

    if not api_key:
        print("No TYPESAFE_API_KEY set. Put it in .env or the environment, or use --dry-run.")
        return None

    try:
        resp = call_jev(body, api_key)
    except urllib.error.HTTPError as e:
        print(f"{path.name}: Jev API error {e.code}: {e.read().decode()[:200]}")
        return None
    except urllib.error.URLError as e:
        print(f"{path.name}: network error: {e.reason}")
        return None

    j = parse_judgment(resp)
    jev_human = j["jev_choice"] == "human"
    rig_human = rig == "HUMAN"
    j["rig_verdict"] = rig
    j["agreement"] = "agree" if jev_human == rig_human else "disagree"
    j["raw"] = resp
    out_path.write_text(json.dumps(j, indent=2))
    conf = j["jev_confidence"]
    print(
        f"{path.name}: Jev={j['jev_choice']} (conf {conf})  rig={rig}  -> {j['agreement']}  [{out_path.name}]"
    )
    return j


def selftest() -> int:
    sample = {
        "version": 2,
        "sessionId": "VK-TEST",
        "agentLabel": "gpt-sim",
        "env": {"webdriver": False, "pointerFine": True, "touch": False},
        "preamble": {"reachedBottom": True, "scrollEvents": 1, "timeToBottomMs": 40, "declaredAgent": False, "acknowledgedWithoutReading": False},
        "challenges": [
            {"type": "trace", "id": "trace-orbit", "stats": {"timeToFirstInputMs": 200, "durationMs": 5000, "pointerSampleCount": 120, "clickCount": 0, "hesitations": 0}, "evaluation": {"note": "You did not follow it."}},
            {"type": "rhythm", "id": "rhythm-slow", "stats": {"timeToFirstInputMs": 100, "durationMs": 6000, "pointerSampleCount": 0, "clickCount": 8, "hesitations": 0}, "evaluation": {"note": "Every tap the same distance off."}},
            {"type": "math", "id": "math-mult-1", "stats": {"timeToFirstInputMs": 300, "durationMs": 3000, "pointerSampleCount": 0, "clickCount": 1, "hesitations": 0}, "evaluation": {"note": "Exact, in 3.0 seconds."}},
        ],
        "scores": {"verdict": "REPLICANT", "empathy": 69, "humanness": 0, "suspicionFinal": 80, "penalties": [{"rule": "multiple behavioural tells failed"}], "honeytokens": {"visible": [], "hidden": []}},
    }
    state = build_state(sample)
    assert "trace-orbit" in state and "Exact, in 3.0 seconds" in state, "notable outcomes missing"
    assert "verdict=REPLICANT" in state and "humanness=0" in state, "rig read missing"
    body = build_request(state)
    assert body["model"] == MODEL and body["questions"]["operator"]["type"] == "choice"
    assert set(body["questions"]["operator"]["criteria"]) == {"human", "automated_agent"}
    parsed = parse_judgment(
        {"answers": {"operator": {"type": "choice", "choice": "automated_agent", "confidence": 0.97, "probabilities": {"human": 0.03, "automated_agent": 0.97}}}}
    )
    assert parsed["jev_choice"] == "automated_agent" and parsed["jev_confidence"] == 0.97
    print("selftest OK: state builds, request well-formed, response parses.")
    print("--- sample dossier ---")
    print(state)
    return 0


def main(argv: list[str]) -> int:
    root = Path(__file__).resolve().parents[1]
    load_env(root)
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("path", nargs="?", type=Path, help="transcript .json file or a folder of them")
    ap.add_argument("--dry-run", action="store_true", help="build and print the request without calling Jev")
    ap.add_argument("--overwrite", action="store_true", help="re-judge even if a .jev.json already exists")
    ap.add_argument("--limit", type=int, default=0, help="cap how many files to judge (0 = no cap)")
    ap.add_argument("--selftest", action="store_true", help="run offline unit checks and exit")
    args = ap.parse_args(argv)

    if args.selftest:
        return selftest()
    if not args.path:
        ap.error("provide a transcript file or folder, or --selftest")

    api_key = os.environ.get("TYPESAFE_API_KEY")
    files = sorted(args.path.glob("*.json")) if args.path.is_dir() else [args.path]
    files = [f for f in files if not f.name.endswith(".jev.json")]
    if args.limit:
        files = files[: args.limit]

    judged = [j for f in files if (j := judge_file(f, api_key, args.dry_run, args.overwrite))]
    if judged and not args.dry_run:
        agree = sum(1 for j in judged if j.get("agreement") == "agree")
        print(f"\n{len(judged)} judged; Jev agreed with the rig on {agree}/{len(judged)}.")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
