---
id: SIG-260222-004-step-number-collision-plan-vs-reality
type: config-mismatch
severity: notable
polarity: negative
phase: 24
plan: "03"
project: get-shit-done-reflect
created: 2026-02-22T00:00:00Z
tags: [plan-spec, workflow-numbering, step-collision, deviation, workflow-files]
---

# Plan Specified Step 5.5 Without Awareness That 5.5 Was Already Taken

## Observation

Plan 24-03 specified adding a new "Feature Configuration (Manifest-Driven)" step to `new-project.md` with the number "5.5". During execution, the executor discovered that step 5.5 was already occupied by "Resolve Model Profile" in the existing workflow file. The executor renumbered the new step to 5.6 to avoid collision. This deviation was correctly documented in the summary and did not cause any functional problem.

## Context

Phase 24 Plan 03 was authored with knowledge of new-project.md's overall structure but did not check the exact step numbering in the 5.x range. The plan's context references included `@get-shit-done/workflows/new-project.md`, but the plan author apparently did not verify the current step 5.5 occupant before assigning the number. The executor caught this during Task 2 execution and applied a safe renumber.

## Impact

The deviation was minor and caught by the executor before committing. The resulting step 5.6 is functionally correct. However, this represents a repeatable failure mode: plans that specify insertion points in numbered workflow steps will collide if the author doesn't check current numbering. Future Plan 03-style workflow integration plans are at risk of the same issue.

## Recommendation

When writing plan specs that insert steps into existing workflow files with numbered sections, the plan author should read the file and list the current step numbers before assigning new ones. Alternatively, plan specs for workflow edits should use positional descriptions ("insert after the model profile step") rather than prescriptive step numbers, letting the executor determine the correct number at execution time. The executor's safe-renumber behavior was correct — this signal is about improving plan authoring, not executor behavior.
