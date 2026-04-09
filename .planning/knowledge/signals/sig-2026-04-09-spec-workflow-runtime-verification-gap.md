---
id: sig-2026-04-09-spec-workflow-runtime-verification-gap
type: epistemic-gap
severity: notable
phase: "57.2"
detected_by: artifact-sensor
detection_method: artifact-analysis
origin: phase-execution
date: 2026-04-09
lifecycle: detected
polarity: negative
tags: [runtime-behavior, spec-verification, epistemic-gap, workflow-artifacts, human-verification]
---

# Signal: Spec-Based Workflow Changes Cannot Be Verified by Automated Checks

## What Happened

Phase 57.2 VERIFICATION.md passed 9/9 automated checks but explicitly flagged 2 items requiring human verification: (1) end-to-end exploratory mode runtime behavior, and (2) --chain flag live execution. The context-checker agent (gsdr-context-checker) has never run against real CONTEXT.md output.

## Why It Matters

Workflow spec changes (discuss-phase.md, agent specs) are Claude-executed text, not runnable code. Automated verification confirms the spec contains the right strings but cannot confirm Claude interprets and executes the spec correctly at runtime. This creates a structural blind spot: verification passes but runtime behavior is unvalidated.

## Evidence

- VERIFICATION.md Human Verification Required section lists 2 items with rationale
- Verifier states: "Workflow is a Claude-executed spec, not runnable code — automated checks verify the spec is correct but cannot verify Claude interprets and executes it correctly at runtime"
- 9/9 automated checks pass, but these verify spec content, not execution fidelity
- gsdr-context-checker agent severity-tiered blocking behavior is unvalidated at runtime

## Structural Nature

This is not specific to Phase 57.2 — all spec-based workflow phases share this limitation. The gap is inherent to the workflow-as-spec architecture. The verifier correctly identifies and documents the gap rather than hiding it behind a false "all passed" verdict.

## Possible Responses

- **monitor**: Accept as inherent limitation; rely on human verification for runtime behavior
- **investigate**: Consider adding integration-test-like workflow execution tests (run discuss-phase in test mode, verify output structure)
- **formalize**: Ensure all spec-based phases include explicit human verification items in VERIFICATION.md
