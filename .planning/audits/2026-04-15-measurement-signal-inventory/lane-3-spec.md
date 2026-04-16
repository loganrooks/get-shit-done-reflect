---
lane: 3
domain: Codex CLI artifacts and session data
auditor_model: claude-sonnet-4-6
output_file: lane-3-codex-artifacts-output.md
parent_spec: framing.md
---

# Lane 3: Codex CLI Artifacts — Signal Inventory

**Working directory:** /home/rookslog/workspace/projects/get-shit-done-reflect

## Your Task

You are one of four parallel research agents conducting an exploratory inventory of signal sources for a measurement infrastructure. Your domain is **Codex CLI's session artifacts and data** — what OpenAI's Codex CLI produces that could serve as measurement inputs.

This lane has a constraint the others don't: the primary development runtime is Claude Code, so Codex sessions may be sparse or absent on this machine. You should work from (a) any actual Codex artifacts that exist, (b) the Phase 55.2 research that already mapped the Codex schema, and (c) the Codex CLI installation itself (help output, config, any default data locations).

Your job is to inventory what Codex exposes, how it differs from Claude Code, and where the asymmetries are — because the measurement system's cross-platform design depends on knowing exactly where the runtimes diverge.

## What To Do

### Step 1: Read Phase 55.2 research on Codex

Read the research and context files from Phase 55.2 (Codex Runtime Substrate):
- `.planning/phases/55.2-codex-runtime-substrate/55.2-CONTEXT.md`
- `.planning/phases/55.2-codex-runtime-substrate/55.2-RESEARCH.md`
- Any other artifacts in that phase directory

Extract: what schema was already mapped? What data sources were identified? What gaps were noted?

### Step 2: Locate actual Codex artifacts on this machine

Search for:
- `~/.codex/` or `~/.openai/` or similar Codex config/data directories
- `state_5.sqlite` (the Codex session database — location may be in Phase 55.2 docs)
- Any JSONL session files from Codex runs
- The Codex CLI installation itself (`which codex`, `codex --help` for subcommands)

For anything found:
- Examine the structure (for SQLite: dump the schema with `.schema`; for JSONL: sample records)
- Count records/files
- Note date ranges

### Step 3: Codex signal inventory

For every data source found:

**Structured data (direct signals):**
- Field-by-field inventory (same depth as Lane 1 does for Claude session-meta)
- Types, example values, coverage
- What each field represents

**Semi-structured data (indirect signals):**
- Any log files, conversation records, tool use records
- What could be programmatically extracted?
- Extraction difficulty and reliability

### Step 4: Cross-platform asymmetry mapping

This is the most important deliverable from this lane. For each signal category:

| Category | Claude Code | Codex CLI | Asymmetry |
|----------|------------|-----------|-----------|
| Session metadata | (Lane 1 will detail) | Your findings | What Claude has that Codex doesn't, and vice versa |
| Conversation logs | (Lane 2 will detail) | Your findings | Same |
| Token counts | ? | ? | Are breakdowns (input/output/reasoning) available in both? |
| Model identification | ? | ? | Do both expose which model was used? |
| Tool use patterns | ? | ? | Different tool ecosystems |
| Session linking | ? | ? | How sessions relate to each other |
| Error logging | ? | ? | Different error surfaces |

For each asymmetry, note:
- **Impact on measurement:** Does this asymmetry prevent cross-runtime comparison for a specific metric?
- **Mitigation:** Can feature engineering bridge the gap, or is this a hard limitation?
- **"Not available" vs "not checked":** Distinguish between "Codex definitely doesn't have X" and "I couldn't verify whether Codex has X from available data."

### Step 5: Map to feedback loops

For each Codex signal:
1. **Agent performance** — can we compare agent performance across runtimes with available data?
2. **Cross-runtime comparison** — what comparisons are possible with symmetric data? What comparisons are impossible due to asymmetry?
3. **Other loops** — any Codex-specific signals that serve intervention lifecycle, pipeline integrity, signal quality, or cross-session pattern loops?

### Step 6: Codex-unique capabilities

Does Codex expose anything that Claude Code doesn't? This is as important as the reverse asymmetry. Possible areas:
- Sandbox mode information (workspace-write, etc.)
- Reasoning effort levels (xhigh, high, normal — exposed in session data?)
- Different token accounting
- Different error classification
- Any telemetry or usage data Codex collects

## Epistemic Rules

**Rule 1:** Every claim cites actual evidence — a file path, a schema dump, a Phase 55.2 document line. Don't speculate about what Codex "probably" has.

**Rule 2 (post-Popperian claims epistemology):** Every claim carries an explicit epistemic status:
- **Sampled** — "I observed this in actual Codex artifacts on disk." State which files.
- **Verified-across-corpus** — "I checked all available Codex artifacts and this field is present in X%."
- **Cited-from-research** — "Phase 55.2 research documents this field at [file:line]." Treat as secondhand evidence — it was true when researched but may have changed.
- **Inferred** — "Based on Codex CLI help output and schema, I believe this data exists." Untested.
- **Speculative** — "This might be possible, but I have no direct evidence."
- **Unknown** — "I couldn't check because the data doesn't exist on this machine or I don't have access." Distinct from "verified absent" — the difference matters for measurement design.

When the Codex picture doesn't match what you'd expect from the Claude side (a field exists in Claude but has no obvious Codex counterpart, or vice versa), register the asymmetry as a **finding**, not a gap to resolve. When a Codex signal could serve multiple loops or could be interpreted multiple ways, present both readings.

## Output

Write your findings as a markdown file to:
`.planning/audits/2026-04-15-measurement-signal-inventory/lane-3-codex-artifacts-output.md`

Structure:
1. **Prior research summary** (what Phase 55.2 already mapped)
2. **Artifacts found on this machine** (paths, types, sizes, schemas)
3. **Codex signal inventory** (table: signal, source, type, reliability, coverage)
4. **Cross-platform asymmetry map** (the table from Step 4 — this is the key deliverable)
5. **Codex-unique capabilities** (what Codex has that Claude doesn't)
6. **Gaps and unknowns** (what we can't verify without running more Codex sessions)
7. **Feedback loop mapping** (which loops Codex data can serve)

Do not ask for confirmation. Write the file, then report completion.
