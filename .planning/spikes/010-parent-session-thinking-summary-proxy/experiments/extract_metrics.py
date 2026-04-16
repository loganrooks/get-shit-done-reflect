#!/usr/bin/env python3
"""Spike 010 extractor.

Reads session_id_map.csv (one row per dispatch). For each row with a valid
jsonl_path, parses the JSONL and computes per-session metrics, joining in
cell_id / model / prompt_cell / effort / replicate / tools_allowed / duration_s
from the map.

Adapted from spike 009's extractor:
  - Sessions are TOP-LEVEL JSONLs (no agent-id indirection).
  - Dispatch identity comes from session_id_map.csv (driven by cell_id), not from
    parsing first-user-message text. (But we still capture & classify the first
    user text for sanity-checking.)

Output: per_dispatch_metrics.csv, raw_jsonl_paths.txt
"""
import csv
import glob
import json
import os
import re
import sys
from datetime import datetime

SPIKE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
SESSION_MAP = os.path.join(SPIKE_DIR, "session_id_map.csv")
OUT_CSV = os.path.join(SPIKE_DIR, "per_dispatch_metrics.csv")
OUT_PATHS = os.path.join(SPIKE_DIR, "raw_jsonl_paths.txt")

MARKERS = {
    "self_correction": re.compile(
        r"\b(actually|wait|hmm|on second thought|let me reconsider|that.s wrong)\b",
        re.IGNORECASE,
    ),
    "branching": re.compile(
        r"\b(alternatively|or we could|two options|interpretations|on the other hand)\b",
        re.IGNORECASE,
    ),
    "uncertainty": re.compile(
        r"\b(not sure|unclear|might|maybe|probably|likely|perhaps|i think)\b",
        re.IGNORECASE,
    ),
    "dead_end": re.compile(
        r"\b(doesn.t work|that fails|wrong approach|won.t work|nope|scrap that)\b",
        re.IGNORECASE,
    ),
}

PROMPT_A_MARKER = "what does the Unix `ls` command do"
PROMPT_BNOTOOLS_MARKER = "Do not use any tools"
PROMPT_BTOOLS_MARKER = "You may use tools"


def classify_prompt(text: str) -> str:
    if PROMPT_A_MARKER in text:
        return "A"
    if PROMPT_BTOOLS_MARKER in text:
        return "B-tools"
    if PROMPT_BNOTOOLS_MARKER in text:
        return "B-notools"
    return "UNKNOWN"


def extract_one(jsonl_path: str) -> dict:
    """Parse a single session JSONL and return a flat metrics dict."""
    m = {
        "file_path": jsonl_path,
        "file_size_bytes": os.path.getsize(jsonl_path) if os.path.exists(jsonl_path) else 0,
        "model_from_jsonl": None,
        "prompt_cell_inferred": None,
        "claude_code_version_jsonl": None,
        "n_records": 0,
        "n_turns": 0,
        "thinking_block_count": 0,
        "thinking_total_chars": 0,
        "visible_response_chars": 0,
        "tool_call_count": 0,
        "input_tokens": 0,
        "output_tokens": 0,
        "cache_read_input_tokens": 0,
        "cache_creation_input_tokens": 0,
        "first_ts": None,
        "last_ts": None,
        "first_user_text": "",
        "marker_self_correction_count": 0,
        "marker_branching_count": 0,
        "marker_uncertainty_count": 0,
        "marker_dead_end_count": 0,
    }
    if not os.path.exists(jsonl_path):
        return m

    with open(jsonl_path) as fh:
        for line in fh:
            line = line.strip()
            if not line:
                continue
            try:
                r = json.loads(line)
            except Exception:
                continue
            m["n_records"] += 1

            ts = r.get("timestamp")
            if ts:
                if not m["first_ts"]:
                    m["first_ts"] = ts
                m["last_ts"] = ts

            if m["claude_code_version_jsonl"] is None:
                v = r.get("version")
                if v:
                    m["claude_code_version_jsonl"] = v

            rtype = r.get("type")
            msg = r.get("message", {}) or {}

            if rtype == "user" and not m["first_user_text"]:
                content = msg.get("content", "")
                if isinstance(content, str):
                    m["first_user_text"] = content[:500]
                elif isinstance(content, list):
                    for c in content:
                        if isinstance(c, dict) and c.get("type") == "text":
                            m["first_user_text"] = c.get("text", "")[:500]
                            break

            if rtype == "assistant" and isinstance(msg, dict):
                m["n_turns"] += 1
                if m["model_from_jsonl"] is None:
                    m["model_from_jsonl"] = msg.get("model", "unknown")
                usage = msg.get("usage", {}) or {}
                m["input_tokens"] += usage.get("input_tokens", 0) or 0
                m["output_tokens"] += usage.get("output_tokens", 0) or 0
                m["cache_read_input_tokens"] += usage.get("cache_read_input_tokens", 0) or 0
                m["cache_creation_input_tokens"] += usage.get("cache_creation_input_tokens", 0) or 0

                content = msg.get("content", [])
                if isinstance(content, list):
                    for c in content:
                        if not isinstance(c, dict):
                            continue
                        ctype = c.get("type")
                        if ctype == "thinking":
                            txt = c.get("thinking", "") or ""
                            m["thinking_block_count"] += 1
                            m["thinking_total_chars"] += len(txt)
                            for k, pat in MARKERS.items():
                                m[f"marker_{k}_count"] += len(pat.findall(txt))
                        elif ctype == "text":
                            m["visible_response_chars"] += len(c.get("text", "") or "")
                        elif ctype == "tool_use":
                            m["tool_call_count"] += 1

    m["prompt_cell_inferred"] = classify_prompt(m["first_user_text"])

    visible_total_chars = m["visible_response_chars"] + m["thinking_total_chars"]
    visible_tokens_approx = -(-visible_total_chars // 4)  # ceil
    m["visible_tokens_approx"] = visible_tokens_approx
    m["phantom_tokens"] = m["output_tokens"] - visible_tokens_approx

    if m["thinking_total_chars"] > 0:
        per_1k = 1000.0 / m["thinking_total_chars"]
        for k in MARKERS:
            m[f"marker_{k}_density"] = m[f"marker_{k}_count"] * per_1k
    else:
        for k in MARKERS:
            m[f"marker_{k}_density"] = 0.0

    try:
        if m["first_ts"] and m["last_ts"]:
            t0 = datetime.fromisoformat(m["first_ts"].replace("Z", "+00:00"))
            t1 = datetime.fromisoformat(m["last_ts"].replace("Z", "+00:00"))
            m["jsonl_duration_s"] = (t1 - t0).total_seconds()
        else:
            m["jsonl_duration_s"] = 0.0
    except Exception:
        m["jsonl_duration_s"] = 0.0

    return m


def main():
    if not os.path.exists(SESSION_MAP):
        print(f"ERROR: no session_id_map.csv at {SESSION_MAP}", file=sys.stderr)
        sys.exit(2)

    rows_out = []
    with open(SESSION_MAP) as fh:
        reader = csv.DictReader(fh)
        for cell in reader:
            jsonl_path = cell.get("jsonl_path", "")
            metrics = extract_one(jsonl_path) if jsonl_path else {}
            row = {
                "cell_id": cell.get("cell_id"),
                "model": cell.get("model"),
                "prompt_cell": cell.get("prompt_cell"),
                "effort": cell.get("effort"),
                "replicate": cell.get("replicate"),
                "tools_allowed": cell.get("tools_allowed"),
                "session_id": cell.get("session_id"),
                "jsonl_path": jsonl_path,
                "dispatch_started_at": cell.get("started_at"),
                "dispatch_ended_at": cell.get("ended_at"),
                "dispatch_duration_s": cell.get("duration_s"),
                "dispatch_exit_code": cell.get("exit_code"),
                "claude_version_dispatch": cell.get("claude_version"),
                "error_note": cell.get("error_note"),
            }
            row.update(metrics)
            rows_out.append(row)

    fieldnames = [
        "cell_id",
        "model",
        "prompt_cell",
        "effort",
        "replicate",
        "tools_allowed",
        "session_id",
        "jsonl_path",
        "dispatch_duration_s",
        "dispatch_exit_code",
        "error_note",
        "n_turns",
        "thinking_block_count",
        "thinking_total_chars",
        "visible_response_chars",
        "tool_call_count",
        "input_tokens",
        "output_tokens",
        "cache_read_input_tokens",
        "cache_creation_input_tokens",
        "visible_tokens_approx",
        "phantom_tokens",
        "jsonl_duration_s",
        "marker_self_correction_count",
        "marker_branching_count",
        "marker_uncertainty_count",
        "marker_dead_end_count",
        "marker_self_correction_density",
        "marker_branching_density",
        "marker_uncertainty_density",
        "marker_dead_end_density",
        "n_records",
        "file_size_bytes",
        "first_ts",
        "last_ts",
        "model_from_jsonl",
        "prompt_cell_inferred",
        "claude_code_version_jsonl",
        "claude_version_dispatch",
        "dispatch_started_at",
        "dispatch_ended_at",
    ]

    with open(OUT_CSV, "w", newline="") as fh:
        w = csv.DictWriter(fh, fieldnames=fieldnames, extrasaction="ignore")
        w.writeheader()
        for r in rows_out:
            w.writerow(r)
    print(f"Wrote {OUT_CSV}")

    with open(OUT_PATHS, "w") as fh:
        for r in rows_out:
            p = r.get("jsonl_path")
            if p:
                fh.write(p + "\n")
    print(f"Wrote {OUT_PATHS}")

    # Console summary
    print()
    print("=" * 120)
    print(
        f"{'cell':>4} {'model':8} {'prompt':11} {'eff':5} {'rep':3} "
        f"{'thinkBlk':>8} {'thinkChars':>10} {'visChars':>9} {'outTok':>8} "
        f"{'phantom':>8} {'turns':>5} {'tools':>5} {'dur':>6}"
    )
    print("-" * 120)
    for r in sorted(rows_out, key=lambda x: int(x["cell_id"] or 0)):
        print(
            f"{r.get('cell_id',''):>4} "
            f"{(r.get('model') or '')[:8]:8} "
            f"{(r.get('prompt_cell') or '')[:11]:11} "
            f"{(r.get('effort') or '')[:5]:5} "
            f"{(r.get('replicate') or '')[:3]:3} "
            f"{r.get('thinking_block_count',0):>8} "
            f"{r.get('thinking_total_chars',0):>10} "
            f"{r.get('visible_response_chars',0):>9} "
            f"{r.get('output_tokens',0):>8} "
            f"{r.get('phantom_tokens',0):>8} "
            f"{r.get('n_turns',0):>5} "
            f"{r.get('tool_call_count',0):>5} "
            f"{(r.get('dispatch_duration_s') or ''):>6}"
        )


if __name__ == "__main__":
    main()
