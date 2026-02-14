---
id: spk-{YYYY-MM-DD}-{slug}
type: spike
project: {project-name}
tags: [{tag1}, {tag2}]
created: {YYYY-MM-DDTHH:MM:SSZ}
updated: {YYYY-MM-DDTHH:MM:SSZ}
durability: {workaround|convention|principle}
status: active
hypothesis: "{testable claim}"
outcome: {confirmed|rejected|partial|inconclusive}
rounds: {number}
runtime: {claude-code|opencode|gemini-cli|codex-cli}
model: {model-identifier}
gsd_version: {version-string}
---

## Hypothesis

{Detailed testable claim}

## Experiment

{What was done to test the hypothesis}

## Results

{What was observed}

## Decision

{What was decided based on results -- this is mandatory, spikes produce decisions not reports}

## Consequences

{What follows from this decision -- tradeoffs, future implications}
