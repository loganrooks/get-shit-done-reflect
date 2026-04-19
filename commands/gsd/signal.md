---
name: gsd:signal
description: Log a manual signal observation to the knowledge base with context from the current conversation
argument-hint: '"description" [--severity critical|notable] [--type deviation|struggle|config-mismatch|custom]'
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
  - AskUserQuestion
---

<objective>
Create a manual signal entry in the knowledge base capturing an observation from the current conversation. Write a signal file to the project's KB signals directory and rebuild the index.
</objective>

<context>
Arguments: $ARGUMENTS

@.planning/STATE.md
@.planning/config.json
</context>

<signal_rules>

## Signal Schema

File path: `{KB_DIR}/signals/{project}/{YYYY-MM-DD}-{slug}.md`
ID pattern: `sig-{YYYY-MM-DD}-{slug}`
Slug: kebab-case, max 50 chars, derived from description.

Frontmatter fields:
  id, type: signal, project, tags: [], created (ISO-8601), updated (ISO-8601),
  durability: {workaround|convention|principle}, status: active,
  severity: {critical|notable},
  signal_type: {deviation|struggle|config-mismatch|capability-gap|custom},
  phase, plan, polarity: {positive|negative|neutral}, source: manual,
  occurrence_count: {N}, related_signals: [],
  provenance_schema: v2_split, provenance_status: "",
  about_work: [],
  detected_by: {shared signature object for the manual observation role},
  written_by: {shared signature object for the manual write role},
  runtime: {deprecated compatibility echo}, model: {deprecated compatibility echo},
  gsd_version: {deprecated compatibility echo}

Shared signature object fields:
  role, harness, platform, vendor, model, reasoning_effort, profile,
  gsd_version, generated_at, session_id, provenance_status, provenance_source

Manual provenance rules:
- `about_work: []` is the default. Only populate it when the conversation identifies the artifact or work under judgment.
- Fill `detected_by` and `written_by` as separate objects even when they resolve to the same runtime facts.
- Use `not_available` for missing runtime, model, session, or version facts. Do not invent them.
- Treat flat `runtime` / `model` / `gsd_version` only as deprecated compatibility echoes derived from split provenance, not as the canonical storage contract.
- When you need flat echoes, derive them from `written_by` first and fall back to `detected_by` only if the writer-side fact is missing.

Body sections: ## What Happened / ## Context / ## Potential Cause

## Severity Auto-Assignment (SGNL-04)

| Condition | Severity |
|-----------|----------|
| Verification failed, config mismatch | critical |
| Multiple issues, non-trivial problems, unexpected improvements | notable |

Manual signals are always persisted regardless of severity (user explicitly chose to record).

## Frustration Patterns (SGNL-06)

Scan recent conversation messages for these patterns:
- "still not working", "this is broken", "tried everything"
- "keeps failing", "doesn't work", "same error"
- "frustrated", "why won't", "makes no sense", "wasting time"

Threshold: 2+ patterns detected. Detection is suggestive -- mention to user and let them decide whether to include frustration context. Do not auto-create signals from frustration alone.

## Dedup Logic (SGNL-05)

1. Read index at `{KB_DIR}/index.md` (if exists)
2. For each existing active signal, check match criteria:
   - Same `signal_type` AND same `project` AND 2+ shared tags
3. If match found: add matched IDs to `related_signals`, set `occurrence_count` = max(matched counts) + 1
4. Do NOT modify existing signals (immutable)
5. If no matches: `related_signals: []`, `occurrence_count: 1`

## Volume Check (SGNL-09)

Soft target: ~10 active signals per phase per project.
- Always persist manual signals regardless of count — the user explicitly chose to record
- If count > 10 after writing: note in confirmation "Phase {X} now has {N} active signals (above soft target of 10)"
- Do NOT archive existing signals to make room — quality is enforced by rigor gates, not quantity limits

## KB Path Resolution

Resolve KB location before any read/write operations:

```bash
if [ -d ".planning/knowledge" ]; then
  KB_DIR=".planning/knowledge"
  KB_REBUILD="bash get-shit-done/bin/kb-rebuild-index.sh"
else
  KB_DIR="$HOME/.gsd/knowledge"
  KB_REBUILD="bash $HOME/.gsd/bin/kb-rebuild-index.sh"
fi
```

KB root: `{KB_DIR}/`
Index: `{KB_DIR}/index.md`
Rebuild: `{KB_REBUILD}`

</signal_rules>

<process>

## Step 1: Parse Arguments

Extract from inline arguments if provided:
- **description** -- quoted string (required, can be asked for if missing)
- **--severity** -- `critical` or `notable` (optional, auto-assigned if missing)
- **--type** -- `deviation`, `struggle`, `config-mismatch`, or `custom` (optional, inferred if missing)

## Step 2: Extract Conversation Context

1. **Phase and plan**: Check conversation for current phase/plan. If not evident, read `.planning/STATE.md`.
2. **Project name**: Derive from working directory basename, kebab-case.
3. **Frustration detection**: Scan recent messages using inlined patterns above (SGNL-06). If 2+ patterns found, mention to user and offer to include frustration context.
4. **Runtime detection**: Examine path prefix of this command file.
   - ~/.claude/ -> harness: claude-code
   - ~/.config/opencode/ -> harness: opencode
   - ~/.gemini/ -> harness: gemini-cli
   - ~/.codex/ -> harness: codex-cli
   - If no path prefix matches, set harness/platform/vendor to `not_available`.
5. **Model/session detection**: Use self-knowledge of the current model name and any exposed session/thread facts. If a fact is not exposed, write `not_available`.
6. **Version detection**: Use the same writer-side precedence as the shared provenance helper:
   - installed harness `VERSION`
   - `.planning/config.json` `gsd_reflect_version`
   - repo-local runtime mirror `VERSION`
   - `not_available`
7. **Build split provenance explicitly**:
   - `detected_by` records the manual observation role using the shared signature vocabulary.
   - `written_by` records the command/runtime that persists the file using the same vocabulary.
   - `about_work` stays `[]` unless the conversation identifies the artifact under judgment.
   - `runtime`, `model`, and `gsd_version` are compatibility echoes only, derived from the split provenance after the canonical fields are set.

## Step 3: Fill Missing Information (Max 1 Follow-up)

Combine all missing fields into a single follow-up if needed. Zero follow-ups if everything was inline.

- **No description**: Ask "What did you observe?"
- **No severity**: Auto-assign using SGNL-04 table above. Show assignment, allow override.
- **No type**: Infer from description keywords:
  - "deviat", "unexpected", "changed", "different from plan" -> `deviation`
  - "struggle", "stuck", "debug", "retry", "failing" -> `struggle`
  - "config", "environment", "model", "setting" -> `config-mismatch`
  - Otherwise -> `custom`
- **Polarity**: Auto-assign:
  - Negative indicators (problems, failures, struggles, frustration) -> `negative`
  - Positive indicators (improvements, faster, cleaner, better) -> `positive`
  - Otherwise -> `neutral`

## Step 4: Preview Before Writing

Display signal preview for confirmation:
```
## Signal Preview
**Description:** {description}
**Severity:** {severity}
**Type:** {type}
**Polarity:** {polarity}
**Phase:** {phase} | **Plan:** {plan}
**Provenance Schema:** v2_split
**About Work Entries:** {N}
**Detected By:** {detected_harness} | {detected_model}
**Written By:** {written_harness} | {written_model}
**Legacy Echoes:** runtime={runtime} | model={model} | gsd_version={gsd_version}
**Source:** manual
Save this signal? (y/n)
```

## Step 5: Dedup Check

Apply SGNL-05 dedup logic above. Show related signals if matches found.

## Step 6: Volume Check

Note current signal count for this phase. If above soft target (~10), include count in confirmation output. Always persist — manual signals are never blocked by volume.

## Step 7: Write Signal File

Write to `{KB_DIR}/signals/{project}/{YYYY-MM-DD}-{slug}.md` using schema above. Create parent directories with `mkdir -p`. Include all frontmatter fields and body sections (What Happened, Context, Potential Cause).

Required write discipline:
- Persist `provenance_schema: v2_split`.
- Keep `about_work: []` unless the artifact/work under judgment is explicit in the conversation.
- Write `detected_by` and `written_by` as separate signature objects even when the values overlap.
- If runtime, model, session, or version facts are unavailable, write `not_available`.
- Add flat `runtime`, `model`, and `gsd_version` only as deprecated compatibility echoes derived from the split provenance.

## Step 8: Rebuild Index

```bash
$KB_REBUILD
```

## Step 9: Git Commit (Conditional)

```bash
COMMIT_DOCS=$(cat .planning/config.json 2>/dev/null | grep -o '"commit_docs"[[:space:]]*:[[:space:]]*[^,}]*' | grep -o 'true\|false' || echo "true")
git check-ignore -q .planning 2>/dev/null && COMMIT_DOCS=false
```
If true: `git add -f {signal-file} && git commit -m "docs(signal): {slug}"`
If false: skip git, inform user signal saved but not committed.

## Step 10: Confirm

```
Signal created: {id}
File: {KB_DIR}/signals/{project}/{filename}
Index rebuilt.
```

</process>

<design_notes>
- Max 2 interaction rounds: arguments + one follow-up if needed
- Frustration detection is suggestive, not automatic
- Git follows commit_docs setting from .planning/config.json
- All manual signals persisted regardless of severity
- Source always "manual" (vs "auto" from gsd-signal-collector)
- `detected_by` and `written_by` are separate provenance roles even for manual signals
- Runtime/model/version facts that are missing become `not_available`
- Flat `runtime` / `model` / `gsd_version` fields are compatibility echoes only
</design_notes>
