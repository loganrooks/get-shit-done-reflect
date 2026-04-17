# Measurement Content-Extraction Privacy Model

This document is the 57.7 operator-facing privacy surface for transcript-derived measurement features.

## Content-contract enum semantics

### `derived_features_only`

- The extractor may inspect transcript content or structured runtime records.
- The stored measurement row may contain only derived names, counts, categories, ratios, or positional markers.
- Raw user text, raw assistant text, tool arguments, and tool-result payloads are discarded before persistence.

### `metadata_only`

- The extractor does not inspect transcript bodies.
- It reads metadata such as file paths, timestamps, settings, runtime envelopes, or availability markers.
- Example future use: an extractor that reasons only over registry/source freshness without touching transcript blocks.

### `no_content_access`

- The extractor does not inspect transcript bodies or transcript-adjacent metadata fields that encode message content.
- It operates entirely on non-content project/runtime state.
- Example future use: a pure project-state extractor that never opens runtime logs.

## 57.7 content extractors

### `tool_invocation_sequence`

Computes:

- ordered tool names
- per-tool counts
- distinct-tool count
- sequence entropy

Discarded:

- tool arguments
- tool results
- assistant free-text surrounding the tool calls

Stored shape:

- tool names only
- counts and entropy summary

### `topic_shift_markers`

Computes:

- `/clear` counts
- compaction-boundary counts
- tool-category changes
- positional shift indices

Discarded:

- user/assistant message bodies
- semantic topic labels
- tool arguments/results

Stored shape:

- structural counts and positions only

### `intervention_points`

Computes:

- count of intervention events
- interventions per 100 turns
- normalized mean intervention position
- intervention record indices

Calibrated 57.7-v1 rule:

- user turn after `>=2` assistant turns
- `isHumanTurnRecord()` guard active
- positive on either the seed marker regex or the exact Claude interrupt placeholder `[Request interrupted by user]`

Discarded:

- raw user redirect text
- calibration-only `sampled_matches`
- any tool-result echo content

Stored shape:

- counts, normalized positions, and record indices only

## What is discarded after extraction

- transcript bodies are never copied into measurement rows
- tool arguments are never copied into measurement rows
- tool-result payloads are never copied into measurement rows
- calibration artifacts may inspect runtime-native placeholders or short marker tokens during plan execution, but those short-lived review aids are not persisted into `measurement.db`

## Opt-out options in 57.7

57.7 does **not** yet provide a first-class per-extractor config toggle such as `content_extraction_opt_out`.

Current practical opt-outs are:

- do not run `measurement rebuild`
- remove or quarantine the Claude runtime sources (`~/.claude/projects`, `~/.claude/usage-data/session-meta`) before rebuilding
- run measurement commands in an environment where those sources are unavailable, which causes these extractors to emit `not_available`

Tradeoff:

- opting out removes the structural content signals that later reports and diagnostics may rely on

## Report surface

Plan 07 wires this privacy model into the human report layer.

Expected report behavior after Plan 07:

- report headers include a `privacy:` line
- that line states which content-derived features were computed
- that line points back to this document as the canonical explanation of what was retained versus discarded

Until Plan 07 lands, this file is the canonical privacy reference for 57.7 content extraction.
