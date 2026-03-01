---
id: les-{YYYY-MM-DD}-{slug}
type: lesson
project: {project-name|_global}
tags: [{tag1}, {tag2}]
created: {YYYY-MM-DDTHH:MM:SSZ}
updated: {YYYY-MM-DDTHH:MM:SSZ}
durability: {workaround|convention|principle}
status: active
category: {architecture|workflow|tooling|testing|debugging|performance|other}
evidence_count: {number}
evidence: [{entry-id-1}, {entry-id-2}]
# Optional: preserves key observations from evidence signals for self-contained lessons
evidence_snapshots:
  - id: {entry-id-1}
    snapshot: "{one-sentence observation from this signal}"
  - id: {entry-id-2}
    snapshot: "{one-sentence observation from this signal}"
confidence: {high|medium|low}
runtime: {claude-code|opencode|gemini-cli|codex-cli}
model: {model-identifier}
gsd_version: {version-string}
---

## Lesson

{One-sentence actionable lesson}

## When This Applies

{Conditions under which this lesson is relevant}

## Recommendation

{Specific action to take when this lesson applies}

## Evidence

{List of signals/spikes that led to this lesson, with brief descriptions}

<!-- If evidence_snapshots are provided in frontmatter, the key observation from each signal
     is preserved above, making this lesson self-contained even if evidence signals are archived -->
