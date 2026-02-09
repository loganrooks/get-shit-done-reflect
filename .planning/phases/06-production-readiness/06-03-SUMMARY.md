---
phase: 06-production-readiness
plan: 03
subsystem: devops-initialization
tags: [devops, detection, ci-cd, deployment, adaptive-questions, codebase-mapper]
dependency-graph:
  requires: []
  provides: [devops-detection-reference, new-project-devops-round, concerns-devops-gaps]
  affects: [06-04-fork-identity]
tech-stack:
  added: []
  patterns: [file-based-detection, adaptive-questioning, gap-analysis, config-extension]
key-files:
  created:
    - get-shit-done/references/devops-detection.md
  modified:
    - commands/gsd/new-project.md
    - get-shit-done/templates/codebase/concerns.md
decisions:
  - DevOps context stored in config.json devops section (machine-readable for agents)
  - Greenfield projects with no DevOps signals skip DevOps round entirely
  - Maximum 3-5 adaptive questions based on project type heuristics
  - Gap analysis patterns integrated into codebase mapper concerns explorer
  - Detected items recorded silently; only gaps trigger questions
metrics:
  duration: 3min
  completed: 2026-02-09
---

# Phase 6 Plan 3: DevOps Initialization Summary

**Adaptive DevOps detection and questioning system with file-based pattern matching, project-type heuristics, and codebase mapper gap integration**

## What Was Done

### Task 1: DevOps Detection Reference Specification
Created `get-shit-done/references/devops-detection.md` (387 lines) with six sections:

1. **Overview** -- Purpose, scope, principle (detect first, ask about gaps only), storage target (config.json)
2. **Detection Patterns** -- File-based detection for CI/CD (GitHub Actions, GitLab CI, CircleCI, Jenkins, Bitbucket, Travis), deployment targets (Vercel, Docker, Fly.io, Railway, Netlify, Serverless, AWS, GCP), commit conventions (conventional vs freeform via git log analysis), git hygiene (.gitignore, .gitattributes, branch count), and environment detection (.env templates, Docker profiles). Includes shell script patterns for each category plus a combined detection script.
3. **Adaptive Question Rules** -- Skip condition (greenfield with no signals), project-type heuristics (production app/library/personal tool), question templates for 7 gap types, hard maximum of 5 questions with soft target of 3
4. **Gap Analysis for Codebase Mapper** -- 7 gap detection rules (tests without CI, missing .gitignore, env vars without template, missing deploy docs, Dockerfile without .dockerignore, CI without test step, production without staging) with shell patterns
5. **Config Storage** -- config.json `devops` section schema with field descriptions, types, and defaults. Includes `detected` sub-section for raw detection results
6. **Downstream Consumers** -- How researcher, planner, health check, and codebase mapper consume DevOps context

### Task 2: DevOps Round in new-project.md and DevOps Gaps in concerns.md
**new-project.md changes (additive only):**
- Added `devops-detection.md` to execution_context references
- Inserted Phase 5.7: DevOps Context (Conditional) between Phase 5.5 (Resolve Model Profile) and Phase 6 (Research Decision)
- Phase 5.7 includes: auto-detect step with shell patterns, report + ask step with adaptive questioning, config storage step
- Skip condition: greenfield with no DevOps signals skips to Phase 6

**concerns.md changes (additive only):**
- Added DevOps Gaps section to the file template (after Test Coverage Gaps, before closing marker)
- Added DevOps Gaps examples to good_examples section (No CI/CD for test suite, Missing .gitignore entries)
- Added "DevOps Gaps" to the guidelines "What belongs in CONCERNS.md" list

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| Config.json storage for DevOps context | Machine-readable, already extended in every phase, operational preference rather than project vision |
| Skip for greenfield with no signals | Premature DevOps questions add friction without value |
| 3-5 question maximum with project-type heuristics | Production apps need more DevOps context; personal tools need less |
| Detect first, ask about gaps only | Asking about obvious detected config wastes user time |
| Gap analysis in concerns template, not separate focus | Natural fit with existing concerns structure, no new mapper agent needed |

## Deviations from Plan

None -- plan executed exactly as written.

## Verification Results

All verification criteria met:
- `devops-detection.md` exists with 387 lines (80+ required)
- Phase 5.7 positioned correctly (line 400, between Phase 5.5 at line 380 and Phase 6 at line 479)
- `devops-detection.md` referenced in execution_context
- DevOps Gaps section present in concerns.md template and examples
- All existing content in both modified files preserved unchanged (fork constraint compliance)

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 | d7d01d4 | feat(06-03): create devops-detection reference specification |
| 2 | 66f2295 | feat(06-03): add DevOps round to new-project and DevOps Gaps to concerns template |

## Next Phase Readiness

Plan 06-04 (fork identity / README) has no dependencies on this plan. Ready to execute independently.
