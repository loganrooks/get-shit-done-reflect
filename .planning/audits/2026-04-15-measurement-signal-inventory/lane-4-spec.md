---
lane: 4
domain: GSD artifacts as measurement sources
auditor_model: claude-sonnet-4-6
output_file: lane-4-gsd-artifacts-output.md
parent_spec: framing.md
---

# Lane 4: GSD Artifacts as Measurement Sources

**Working directory:** /home/rookslog/workspace/projects/get-shit-done-reflect

## Your Task

You are one of four parallel research agents conducting an exploratory inventory of signal sources for a measurement infrastructure. Your domain is **GSD's own output artifacts** — the files the GSD workflow produces (.planning/ directory, git history, signals, summaries, verifications) as potential measurement inputs.

This is a different kind of inventory than Lanes 1-3. Those lanes examine runtime session data. You examine the project management and workflow artifacts that GSD creates. These artifacts are a rich, structured corpus of data about how the project is executing — but they've never been treated as measurement inputs. Your job is to inventory what's there and how it could feed measurement.

## What To Do

### Step 1: Survey the .planning/ directory structure

Map the complete structure of `.planning/` as a data corpus:
- What directories exist?
- What types of files are in each?
- How many of each type?
- What's the date range?

Key directories to examine:
- `.planning/phases/` — phase directories with CONTEXT.md, RESEARCH.md, PLAN.md, SUMMARY.md, VERIFICATION.md, etc.
- `.planning/knowledge/signals/` — signal files (YAML frontmatter + markdown body)
- `.planning/knowledge/lessons/` — lesson files if they exist
- `.planning/knowledge/spikes/` — spike artifacts
- `.planning/deliberations/` — deliberation files
- `.planning/audits/` — audit session directories
- `.planning/STATE.md`, `.planning/ROADMAP.md`, `.planning/REQUIREMENTS.md`, `.planning/config.json`

### Step 2: Phase artifact signal inventory

For EACH type of phase artifact, examine 2-3 examples and inventory:

**CONTEXT.md:**
- What structured data can be parsed? (typed claims with `[governing:reasoned]`, `[assumed:reasoned]`, `[open]` markers; the domain section; dependencies)
- Can claim counts be reliably extracted? (How many governing claims? How many open questions?)
- What would a "claim propagation rate" extractor need from these files?

**PLAN.md:**
- What structured data exists? (must_haves list, task breakdowns, objective, context references)
- Can plan truths be counted and categorized?
- Can we trace which CONTEXT claims became plan truths?

**SUMMARY.md:**
- What execution metrics are reported? (duration, task count, files changed — check gsd-tools summary-extract)
- How reliable/consistent is the format across phases?

**VERIFICATION.md:**
- What structured data exists? (truth pass/fail counts, individual truth results)
- Can pass/fail rates be reliably extracted?
- Is there a consistent format or does it vary by phase?

**DISCUSSION-LOG.md:**
- What structured data exists? (gray areas discussed, questions raised)
- Can we count gray areas and check them against CONTEXT.md open questions?

### Step 3: Signal file inventory

Examine the signal corpus in `.planning/knowledge/signals/`:
- How many signals exist?
- What YAML frontmatter fields do they carry? (severity, source, status, remediation, etc.)
- Can we reliably extract: filing date, severity, remediation status, associated phase, recurrence data?
- What's the format consistency across signals?
- Can we compute: time-to-remediation, signal accuracy rate, recurrence rate from existing signal data?

### Step 4: Git history as measurement source

Examine what's derivable from git:
- `git log` — commit timestamps, messages, authors
- Phase-correlated commits (commit messages that reference phases)
- File churn per phase (files changed per commit per phase)
- Branch lifecycle (branch creation → PR → merge timing)
- Deviation indicators (commit messages containing "fix:", "deviation", "correction")

Run a few sample git commands to show what's available. Don't just describe theoretically — show actual output.

### Step 5: Cross-source join possibilities

What measurements become possible when GSD artifact data is JOINED with runtime session data (from Lanes 1-2)?

Examples to investigate:
- **Session → phase correlation:** Can we map a session (by timestamp) to which phase was being executed? (STATE.md has phase timestamps; sessions have timestamps)
- **Plan execution → token usage:** Can we correlate plan complexity (task count, truth count) with session token consumption?
- **Claim propagation pipeline:** CONTEXT.md claims → PLAN.md truths → VERIFICATION.md results — can this pipeline be traced automatically?
- **Signal → session → fix:** Can we trace from a signal filing to the session that filed it to the phase that fixed it?

For each cross-source join: what fields from which sources are needed? How reliable is the join key (exact match? timestamp proximity? heuristic?)?

### Step 6: Feature engineering from artifacts

What can be DERIVED from GSD artifacts that isn't directly stated?

- **Phase complexity metrics:** task count + truth count + file count as proxy for complexity
- **Scope drift indicators:** plan truth count vs CONTEXT governing claim count
- **Discussion coverage:** gray areas in DISCUSSION-LOG vs open questions in CONTEXT
- **Deviation density:** deviations per plan as an execution difficulty indicator
- **Remediation velocity:** phase count between signal filing and signal remediation
- **Knowledge base growth rate:** signals + lessons + spikes accumulated over time

For each derived feature: what raw data it depends on, reliability tier, which feedback loop it serves.

### Step 7: Map to feedback loops

For each artifact type and derived feature, map to:

1. **Intervention lifecycle** — signal filing dates, remediation status, recurrence data
2. **Pipeline integrity** — claim counts, propagation rates, open-question resolution
3. **Agent performance** — plan execution stats from SUMMARY.md correlated with session data
4. **Signal quality** — signal severity distribution, accuracy when verified by audits
5. **Cross-session patterns** — phase duration trends, friction indicators from deviation density
6. **Cross-runtime comparison** — do GSD artifacts differ when produced by Codex vs Claude?

## Epistemic Rules

**Rule 1:** Every claim about artifact structure cites an actual file:line. Open real CONTEXT.md, PLAN.md, SUMMARY.md files and show the structure.

**Rule 2 (post-Popperian claims epistemology):** Every claim carries an explicit epistemic status:
- **Sampled** — "I observed this structure in N of M files examined." State N and M.
- **Verified-across-corpus** — "I checked all files of this type and the structure is consistent in X%."
- **Inferred** — "I believe this metric can be derived by parsing these artifact fields." State what parser would be needed and what could go wrong (format inconsistencies, missing fields in older phases).
- **Intervention-tested** — "I ran a grep/parse command across the actual artifacts and it extracted the expected values."
- **Speculative** — "This join between sources might work, but I haven't verified the join key reliability."

When artifact formats are inconsistent across phases (older phases structured differently than newer ones, some artifacts missing fields that others have), register these as **anomalies** — they're critical for measurement design because they affect retroactive applicability. When a GSD artifact could serve multiple feedback loops depending on how it's parsed, present both readings.

## Output

Write your findings as a markdown file to:
`.planning/audits/2026-04-15-measurement-signal-inventory/lane-4-gsd-artifacts-output.md`

Structure:
1. **Corpus overview** (.planning/ structure, file counts, types, date range)
2. **Phase artifact inventory** (per-artifact-type: fields, parseability, consistency, example citations)
3. **Signal file inventory** (frontmatter schema, coverage, what's computable)
4. **Git history inventory** (what's derivable, sample commands + output)
5. **Cross-source join possibilities** (table: join, sources needed, join key reliability, serves_loop)
6. **Derived features** (table: feature, raw sources, reliability, serves_loop)
7. **Gaps** (what we wish GSD artifacts contained but they don't)
8. **Surprises** (unexpected data sources or unexpected absences)

Do not ask for confirmation. Write the file, then report completion.
