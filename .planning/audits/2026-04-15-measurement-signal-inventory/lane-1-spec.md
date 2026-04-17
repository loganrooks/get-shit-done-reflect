---
lane: 1
domain: Claude Code session-meta (structured data)
auditor_model: claude-sonnet-4-6
output_file: lane-1-claude-session-meta-output.md
parent_spec: framing.md
---

# Lane 1: Claude Code Session-Meta Inventory

**Working directory:** /home/rookslog/workspace/projects/get-shit-done-reflect

## Your Task

You are one of four parallel research agents conducting an exploratory inventory of signal sources for a measurement infrastructure. Your domain is **Claude Code's structured session-meta data** — the JSON files that Claude Code writes after each session.

Your output must be deep and specific. This is not a surface-level survey — the measurement infrastructure design depends on knowing exactly what's available, with what coverage, at what reliability. Open actual files and report what you find.

## What To Do

### Step 1: Locate and sample the session-meta corpus

Session-meta files live in `~/.claude/usage-data/session-meta/`. Count how many files exist. Sample at least 5-8 files spanning different dates, checking whether the schema has changed over time.

### Step 2: Complete field inventory

For EVERY field in the session-meta JSON:
- **Field name and path** (including nested fields)
- **Type** (string, number, boolean, array, object)
- **Example value** (from an actual file — cite the filename)
- **Coverage** — is this field present in all sampled files or only some? If partial, what's the approximate coverage rate?
- **What it represents** — brief description of what the field captures
- **Reliability tier** — is this hardware-measured (API-counted tokens), runtime-derived (heuristic categories), or unknown?
- **Stability** — has this field's format or presence changed across your sampled date range?

### Step 3: Identify high-value fields for feedback loops

Map each field to the feedback loops it could serve:

1. **Intervention lifecycle** (signal → remediation → outcome) — timestamps, version info, session identity
2. **Pipeline integrity** (scope narrowing detection) — not directly served by session-meta, but note any fields that could correlate sessions to phases
3. **Agent performance** — model ID, token counts (input/output/reasoning separately?), duration, tool use counts, error counts
4. **Signal quality** — session timestamps for time-to-remediation calculations
5. **Cross-session patterns** — session continuity markers, project identifiers, any fields that link sessions together
6. **Cross-runtime comparison** — fields that have Codex equivalents vs Claude-only fields (note which — Lane 3 will verify the Codex side)

### Step 4: Identify what's NOT there

Gaps matter as much as findings. For each of these, check whether the field exists:
- **Reasoning token count** (separate from output tokens) — critical for agent performance loop
- **Model ID** (which specific model was used — opus, sonnet, haiku, with version?)
- **GSD version** or any harness metadata
- **Profile** (quality/balanced/budget)
- **Context window size** (how much context was used)
- **Session continuity** (does a session link to its predecessor?)
- **Project identity** (which project/working directory)
- **Error details** (tool failures, not just count)
- **Agent/subagent dispatches** (were subagents spawned? how many?)

If a field doesn't exist, say so explicitly. Don't speculate about what "might" be there.

### Step 5: Feature engineering possibilities

What can be DERIVED from session-meta that isn't directly exposed?
- Session clustering by time proximity (approximating "work sessions")
- Token efficiency ratios (output tokens / total tokens as a proxy for how much was reasoning vs generation)
- Tool diversity metrics (how many different tools used per session)
- Session complexity indicators (turns × tools × duration)
- Temporal patterns (time-of-day, day-of-week effects)

For each derived feature: name it, say what raw fields it depends on, note its reliability tier (derived features are generally lower reliability than raw fields).

## Epistemic Rules

**Rule 1:** Every claim about a field cites the actual filename and quotes the field. Don't say "there's probably a model field" — open a file and show it: `session-abc123.json: {"model": "claude-sonnet-4-6", ...}`.

**Rule 2 (post-Popperian claims epistemology):** Every claim carries an explicit epistemic status:
- **Sampled** — "I observed this in N of M files examined." State N and M.
- **Verified-across-corpus** — "I ran a programmatic check across all files and this field is present in X%."
- **Inferred** — "I believe this can be derived from fields A and B." Untested feasibility claim.
- **Intervention-tested** — "I ran a command to extract this and it produced expected output."
- **Speculative** — "This might be possible, but I have no direct evidence."

When something doesn't fit (a field present in some files but not others with no obvious pattern, a value contradicting what other fields suggest), register it as an **anomaly** — don't resolve or dismiss it. When a finding supports multiple readings (a field could serve loop X or loop Z depending on interpretation), present both — don't collapse to one.

## Output

Write your findings as a markdown file to:
`.planning/audits/2026-04-15-measurement-signal-inventory/lane-1-claude-session-meta-output.md`

Structure:
1. **Corpus overview** (count, date range, file sizes, schema stability)
2. **Complete field inventory** (table format — field, type, example, coverage, reliability, serves_loop)
3. **High-value fields for measurement** (top 10-15 fields, ranked by feedback-loop coverage)
4. **Gaps** (fields we need that don't exist, with explicit "I checked and it's not there")
5. **Derived features** (what can be computed from existing fields)
6. **Surprises** (anything unexpected — fields you didn't expect to find, or expected fields that are missing)

Do not ask for confirmation. Write the file, then report completion.
