#!/usr/bin/env python3
"""Render all spike-010 dispatches into human-readable markdown grouped by prompt.

Output: one file per prompt type (A, B-notools, B-tools) under `responses/`,
each with all 12 cells ordered by (effort, model, replicate) so matched
comparisons read vertically. Each cell includes:
  - Header with cell_id, model, prompt, effort, replicate
  - Metrics summary (thinking_chars, visible_chars, output_tokens, duration_s)
  - Thinking content (as ```thinking``` code block for readability)
  - Visible response (rendered as markdown directly)

Also writes a README.md index with navigation tips.
"""
import csv
import json
import os
import sys
from collections import defaultdict

SPIKE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
METRICS_CSV = os.path.join(SPIKE_DIR, "per_dispatch_metrics.csv")
OUT_DIR = os.path.join(SPIKE_DIR, "responses")
os.makedirs(OUT_DIR, exist_ok=True)

def load_jsonl_content(jsonl_path):
    thinking_blocks = []
    visible_msgs = []
    turn_count = 0
    if not jsonl_path or not os.path.exists(jsonl_path):
        return thinking_blocks, visible_msgs, turn_count
    with open(jsonl_path) as fh:
        for line in fh:
            line = line.strip()
            if not line:
                continue
            try:
                r = json.loads(line)
            except Exception:
                continue
            if r.get("type") == "assistant":
                turn_count += 1
                msg = r.get("message", {}) or {}
                for c in msg.get("content", []) or []:
                    if not isinstance(c, dict):
                        continue
                    if c.get("type") == "thinking":
                        thinking_blocks.append(c.get("thinking", ""))
                    elif c.get("type") == "text":
                        visible_msgs.append(c.get("text", ""))
    return thinking_blocks, visible_msgs, turn_count


def main():
    with open(METRICS_CSV) as fh:
        rows = list(csv.DictReader(fh))

    # Prefer R_ retries over failed originals
    by_cell = {}
    for r in rows:
        cid = r["cell_id"]
        if cid.startswith("R_"):
            original = cid[2:]
            if r.get("jsonl_path"):
                by_cell[original] = r
        else:
            if cid not in by_cell and r.get("jsonl_path"):
                by_cell[cid] = r

    # Group by prompt
    by_prompt = defaultdict(list)
    for cid, r in by_cell.items():
        by_prompt[r["prompt_cell"]].append(r)

    # Sort each group by (effort_order, model, replicate)
    effort_order = {"low": 0, "high": 1}
    model_order = {"sonnet": 0, "opus": 1}
    for k in by_prompt:
        by_prompt[k].sort(key=lambda r: (
            effort_order.get(r["effort"], 99),
            model_order.get(r["model"], 99),
            int(r["replicate"]),
        ))

    # Render per-prompt files
    prompt_texts = {
        "A": "In one sentence, what does the Unix `ls` command do? Reply directly with one sentence and stop. Do not use any tools.",
        "B-notools": "Without using any tools or external references, design an epistemology for an AI agent that must make consequential decisions under persistent uncertainty. Propose four foundational principles, describe how they interact (including where they conflict), and identify the strongest objection to each. Think carefully before answering. Do not use any tools — respond directly with your reasoning and conclusions.",
        "B-tools": "Design an epistemology for an AI agent that must make consequential decisions under persistent uncertainty. Propose four foundational principles, describe how they interact (including where they conflict), and identify the strongest objection to each. Think carefully before answering. You may use tools (such as web search) if helpful, but don't feel obligated to. Provide your reasoning and conclusions.",
    }

    summary_rows = []
    for prompt_cell, cells in by_prompt.items():
        out_path = os.path.join(OUT_DIR, f"{prompt_cell}.md")
        with open(out_path, "w") as fh:
            fh.write(f"# Spike 010 Responses — Prompt {prompt_cell}\n\n")
            fh.write(f"**Prompt (verbatim):**\n\n> {prompt_texts[prompt_cell]}\n\n")
            fh.write(f"**Cell count:** {len(cells)} (ordered by effort → model → replicate)\n\n")
            fh.write("---\n\n")
            for r in cells:
                thinking_blocks, visible_msgs, turns = load_jsonl_content(r["jsonl_path"])
                thinking_text = "\n\n---BLOCK BREAK---\n\n".join(thinking_blocks)
                visible_text = "\n\n---MSG BREAK---\n\n".join(visible_msgs)
                cid = r["cell_id"]
                label = f"Cell {cid} — {r['model']} / {prompt_cell} / effort={r['effort']} / rep={r['replicate']}"
                fh.write(f"## {label}\n\n")
                fh.write("**Metrics:**\n")
                fh.write(f"- thinking_chars: {r.get('thinking_total_chars', '')}\n")
                fh.write(f"- thinking_blocks: {r.get('thinking_block_count', '')}\n")
                fh.write(f"- visible_chars: {r.get('visible_response_chars', '')}\n")
                fh.write(f"- output_tokens: {r.get('output_tokens', '')}\n")
                fh.write(f"- duration_s: {r.get('dispatch_duration_s', '')}\n")
                fh.write(f"- tool_calls: {r.get('tool_call_count', '')}\n")
                fh.write(f"- session_id: `{r.get('session_id', '')}`\n")
                fh.write("\n")

                if thinking_text:
                    fh.write(f"### Thinking ({len(thinking_text)} chars)\n\n")
                    fh.write("```\n")
                    fh.write(thinking_text)
                    fh.write("\n```\n\n")
                else:
                    fh.write("### Thinking\n\n*(no thinking content emitted)*\n\n")

                if visible_text:
                    fh.write(f"### Visible Response ({len(visible_text)} chars)\n\n")
                    fh.write(visible_text)
                    fh.write("\n\n")
                else:
                    fh.write("### Visible Response\n\n*(empty)*\n\n")

                fh.write("---\n\n")
                summary_rows.append({
                    "cell_id": cid,
                    "model": r["model"],
                    "prompt_cell": prompt_cell,
                    "effort": r["effort"],
                    "replicate": r["replicate"],
                    "thinking_chars": r.get("thinking_total_chars"),
                    "visible_chars": r.get("visible_response_chars"),
                    "output_tokens": r.get("output_tokens"),
                    "out_path": out_path,
                })
        print(f"Wrote {out_path} ({len(cells)} cells)")

    # Index README
    index_path = os.path.join(OUT_DIR, "README.md")
    with open(index_path, "w") as fh:
        fh.write("# Spike 010 Responses — Human-Readable Index\n\n")
        fh.write("Generated from `per_dispatch_metrics.csv` + the 36 session JSONLs.\n\n")
        fh.write("Each prompt gets one file. Within each file, cells are ordered by `effort → model → replicate` so matched low/high and Sonnet/Opus pairs appear adjacent.\n\n")
        fh.write("## Files\n\n")
        for pc in ("A", "B-notools", "B-tools"):
            n = sum(1 for r in summary_rows if r["prompt_cell"] == pc)
            fh.write(f"- [`{pc}.md`]({pc}.md) — {n} cells\n")
        fh.write("\n## Reading guide\n\n")
        fh.write("- **Prompt A (recall)**: quick browse — no thinking content anywhere, just one-line visible responses per cell. Confirms the emission-threshold gate (recall prompts produce zero thinking).\n")
        fh.write("- **Prompt B-notools (deliberation, no tools)**: most useful for H1/H2/H3 qualitative comparison. Opus at low effort on this prompt emits zero thinking (cells 19/20/R_21) — structural finding.\n")
        fh.write("- **Prompt B-tools (deliberation, tools permitted)**: similar shape to B-notools but with tools allowed. Neither model actually used tools (tool_call_count=0 everywhere) — so this tests permission-only effect.\n")
        fh.write("\n## Quick H3 qualitative-compare sample (same prompt, same effort, different models)\n\n")
        fh.write("To compare Sonnet vs Opus reasoning *content* (not just length):\n")
        fh.write("- Open `B-notools.md`, find cells in order: 16 (sonnet high r1), 17 (sonnet high r2), 18 (sonnet high r3), then 22 (opus high r1), 23 (opus high r2), 24 (opus high r3). These six cells are matched-by-prompt-and-effort across models.\n")
        fh.write("- Open `B-tools.md`, similarly cells 28-30 (sonnet) vs 34, R_35, R_36 (opus) at high effort.\n")
        fh.write("\n## Summary table\n\n")
        fh.write("| cell | model | prompt | effort | rep | thinkChars | visChars | outTok |\n")
        fh.write("|-----:|:------|:-------|:-------|:----|-----------:|---------:|-------:|\n")
        for r in sorted(summary_rows, key=lambda x: (x["prompt_cell"], x["effort"], x["model"], int(x["replicate"]))):
            fh.write(f"| {r['cell_id']} | {r['model']} | {r['prompt_cell']} | {r['effort']} | {r['replicate']} | {r['thinking_chars']} | {r['visible_chars']} | {r['output_tokens']} |\n")
    print(f"Wrote {index_path}")


if __name__ == "__main__":
    main()
