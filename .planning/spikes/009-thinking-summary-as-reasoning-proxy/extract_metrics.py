#!/usr/bin/env python3
"""Extract per-dispatch metrics from spike 009 subagent JSONLs.

Each subagent JSONL is parsed to derive:
- model (from first assistant record)
- prompt cell (A / B-notools / B-tools, from first user message)
- per-turn metrics summed to per-session aggregates
- derived: phantom_tokens, marker densities

Output: per_dispatch_metrics.csv, raw_jsonl_paths.txt
"""

import json
import os
import re
import csv
import glob
from datetime import datetime

SUBAGENT_DIR = (
    "/home/rookslog/.claude/projects/"
    "-home-rookslog-workspace-projects-get-shit-done-reflect/"
    "bc35444c-dd7c-4554-85cc-8fbbc6961257/subagents"
)
SPIKE_DIR = (
    "/home/rookslog/workspace/projects/get-shit-done-reflect/"
    ".planning/spikes/009-thinking-summary-as-reasoning-proxy"
)

# Manifest mtime cutoff — only files newer than this are spike dispatches
MANIFEST_PATH = os.path.join(SPIKE_DIR, "dispatch_manifest.csv")
CUTOFF_MTIME = os.path.getmtime(MANIFEST_PATH)

# Marker patterns (compiled once)
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

# Prompt classification
PROMPT_A_MARKER = "what does the Unix `ls` command do"
PROMPT_BNOTOOLS_MARKER = "Do not use any tools — respond directly"
PROMPT_BTOOLS_MARKER = "You may use tools"


def classify_prompt(text):
    if PROMPT_A_MARKER in text:
        return "A"
    if PROMPT_BNOTOOLS_MARKER in text:
        return "B-notools"
    if PROMPT_BTOOLS_MARKER in text:
        return "B-tools"
    return "UNKNOWN"


def tokens_approx(text):
    """Rough tokenizer: 4 chars ≈ 1 token."""
    return -(-len(text) // 4)  # ceil


def extract_one(jsonl_path):
    metrics = {
        "agentId": os.path.basename(jsonl_path).replace("agent-", "").replace(".jsonl", ""),
        "file_path": jsonl_path,
        "file_size_bytes": os.path.getsize(jsonl_path),
        "model": None,
        "prompt_cell": None,
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

    with open(jsonl_path) as fh:
        for line in fh:
            try:
                r = json.loads(line)
            except Exception:
                continue
            metrics["n_records"] += 1
            ts = r.get("timestamp")
            if ts:
                if not metrics["first_ts"]:
                    metrics["first_ts"] = ts
                metrics["last_ts"] = ts

            rtype = r.get("type")
            msg = r.get("message", {}) or {}

            # Capture first user message text for prompt classification
            if rtype == "user" and not metrics["first_user_text"]:
                content = msg.get("content", "")
                if isinstance(content, str):
                    metrics["first_user_text"] = content[:500]
                elif isinstance(content, list):
                    for c in content:
                        if isinstance(c, dict) and c.get("type") == "text":
                            metrics["first_user_text"] = c.get("text", "")[:500]
                            break

            if rtype == "assistant" and isinstance(msg, dict):
                metrics["n_turns"] += 1
                if metrics["model"] is None:
                    metrics["model"] = msg.get("model", "unknown")
                usage = msg.get("usage", {}) or {}
                metrics["input_tokens"] += usage.get("input_tokens", 0) or 0
                metrics["output_tokens"] += usage.get("output_tokens", 0) or 0
                metrics["cache_read_input_tokens"] += (
                    usage.get("cache_read_input_tokens", 0) or 0
                )
                metrics["cache_creation_input_tokens"] += (
                    usage.get("cache_creation_input_tokens", 0) or 0
                )
                content = msg.get("content", [])
                if isinstance(content, list):
                    for c in content:
                        if not isinstance(c, dict):
                            continue
                        ctype = c.get("type")
                        if ctype == "thinking":
                            txt = c.get("thinking", "") or ""
                            metrics["thinking_block_count"] += 1
                            metrics["thinking_total_chars"] += len(txt)
                            for k, pat in MARKERS.items():
                                metrics[f"marker_{k}_count"] += len(pat.findall(txt))
                        elif ctype == "text":
                            metrics["visible_response_chars"] += len(c.get("text", "") or "")
                        elif ctype == "tool_use":
                            metrics["tool_call_count"] += 1

    metrics["prompt_cell"] = classify_prompt(metrics["first_user_text"])

    # Derived
    visible_total_chars = metrics["visible_response_chars"] + metrics["thinking_total_chars"]
    visible_tokens_approx = -(-visible_total_chars // 4)  # ceil
    metrics["visible_tokens_approx"] = visible_tokens_approx
    metrics["phantom_tokens"] = metrics["output_tokens"] - visible_tokens_approx

    # Marker densities per 1000 chars of summary
    if metrics["thinking_total_chars"] > 0:
        per_1k = 1000.0 / metrics["thinking_total_chars"]
        for k in MARKERS:
            metrics[f"marker_{k}_density"] = (
                metrics[f"marker_{k}_count"] * per_1k
            )
    else:
        for k in MARKERS:
            metrics[f"marker_{k}_density"] = 0.0

    # Wall-clock duration
    try:
        if metrics["first_ts"] and metrics["last_ts"]:
            t0 = datetime.fromisoformat(metrics["first_ts"].replace("Z", "+00:00"))
            t1 = datetime.fromisoformat(metrics["last_ts"].replace("Z", "+00:00"))
            metrics["duration_seconds"] = (t1 - t0).total_seconds()
        else:
            metrics["duration_seconds"] = 0.0
    except Exception:
        metrics["duration_seconds"] = 0.0

    return metrics


def main():
    spike_files = []
    for f in sorted(glob.glob(os.path.join(SUBAGENT_DIR, "agent-*.jsonl"))):
        if os.path.getmtime(f) > CUTOFF_MTIME:
            spike_files.append(f)

    print(f"Found {len(spike_files)} spike subagent JSONLs")

    rows = [extract_one(f) for f in spike_files]

    fieldnames = [
        "agentId",
        "model",
        "prompt_cell",
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
        "duration_seconds",
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
    ]

    out_csv = os.path.join(SPIKE_DIR, "per_dispatch_metrics.csv")
    with open(out_csv, "w", newline="") as fh:
        w = csv.DictWriter(fh, fieldnames=fieldnames, extrasaction="ignore")
        w.writeheader()
        for r in rows:
            w.writerow(r)
    print(f"Wrote {out_csv}")

    paths_path = os.path.join(SPIKE_DIR, "raw_jsonl_paths.txt")
    with open(paths_path, "w") as fh:
        for f in spike_files:
            fh.write(f + "\n")
    print(f"Wrote {paths_path}")

    # Quick console summary
    print()
    print("=" * 100)
    print(f"{'cell':18} {'model':10} {'thinkChars':>11} {'visChars':>10} {'outTokens':>10} {'phantom':>9} {'turns':>6} {'tools':>6} {'dur(s)':>7}")
    print("-" * 100)
    for r in sorted(rows, key=lambda x: (x["prompt_cell"], x["model"])):
        print(
            f"{r['prompt_cell']:18} "
            f"{(r['model'] or 'unk')[:10]:10} "
            f"{r['thinking_total_chars']:>11} "
            f"{r['visible_response_chars']:>10} "
            f"{r['output_tokens']:>10} "
            f"{r['phantom_tokens']:>9} "
            f"{r['n_turns']:>6} "
            f"{r['tool_call_count']:>6} "
            f"{r['duration_seconds']:>7.1f}"
        )


if __name__ == "__main__":
    main()
