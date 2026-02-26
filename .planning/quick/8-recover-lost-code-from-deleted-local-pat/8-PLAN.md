---
phase: quick-8
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - agents/knowledge-store.md
  - get-shit-done/workflows/resume-project.md
autonomous: true
must_haves:
  truths:
    - "agents/knowledge-store.md exists in npm source with ~/.claude/ path prefix"
    - "get-shit-done/workflows/resume-project.md includes dual_install in init JSON parse list"
    - "get-shit-done/workflows/resume-project.md includes dual-install status display block in present_status"
    - "npm source and installed .claude/ versions are content-equivalent after path normalization"
  artifacts:
    - path: "agents/knowledge-store.md"
      provides: "Knowledge store reference spec for npm package"
      min_lines: 360
    - path: "get-shit-done/workflows/resume-project.md"
      provides: "Resume workflow with dual-install detection"
      contains: "dual_install"
  key_links:
    - from: "agents/knowledge-store.md"
      to: ".claude/agents/knowledge-store.md"
      via: "installer path conversion"
      pattern: "~/.claude/"
    - from: "get-shit-done/workflows/resume-project.md"
      to: ".claude/get-shit-done/workflows/resume-project.md"
      via: "installer path conversion"
      pattern: "dual_install"
---

<objective>
Recover two files that exist in .claude/ (installed runtime) but are missing or out-of-sync in the npm source directories. This closes the last gaps from the Phase 22 agent protocol sync investigation.

Purpose: Ensure npm publish ships the complete codebase -- no features exist only in the installed copy.
Output: Two npm source files synced with their .claude/ counterparts (with correct path prefix).
</objective>

<execution_context>
@./.claude/get-shit-done/workflows/execute-plan.md
@./.claude/get-shit-done/templates/summary-standard.md
</execution_context>

<context>
@.claude/agents/knowledge-store.md
@.claude/get-shit-done/workflows/resume-project.md
@get-shit-done/workflows/resume-project.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Copy knowledge-store.md to npm source with path normalization</name>
  <files>agents/knowledge-store.md</files>
  <action>
Copy .claude/agents/knowledge-store.md to agents/knowledge-store.md with path prefix conversion.

The installed version uses `./.claude/` paths (local prefix). The npm source version must use `~/.claude/` paths (global prefix). This is the inverse of what the installer does.

Conversion rules:
- Replace `./.claude/get-shit-done/` with `~/.claude/get-shit-done/`
- Replace `./.claude/agents/` with `~/.claude/agents/`
- Replace `@./.claude/` with `@~/.claude/`

In this specific file (knowledge-store.md), scan for any `./.claude/` references and convert them. The file primarily references `~/.gsd/knowledge/` paths which do NOT need conversion -- only `./.claude/` prefixed paths need updating.

After writing, verify the file has no remaining `./.claude/` references (there should be zero since this is the npm source).
  </action>
  <verify>
Run: `grep -c '\./.claude/' agents/knowledge-store.md` -- should return 0 (no local path references).
Run: `wc -l agents/knowledge-store.md` -- should be ~366 lines (matching .claude/ version).
Run: `diff <(sed 's|~/.claude/|./.claude/|g' agents/knowledge-store.md) .claude/agents/knowledge-store.md` -- should show no differences (content-equivalent after normalization).
  </verify>
  <done>agents/knowledge-store.md exists in npm source directory, contains the full 366-line knowledge store specification, uses ~/.claude/ path prefix throughout, and is content-equivalent to .claude/agents/knowledge-store.md after path normalization.</done>
</task>

<task type="auto">
  <name>Task 2: Sync dual-install detection to npm source resume-project.md</name>
  <files>get-shit-done/workflows/resume-project.md</files>
  <action>
Add two missing pieces to get-shit-done/workflows/resume-project.md that exist in the installed .claude/ version:

1. **Line 26 (initialize step):** In the JSON parse list, add `dual_install` to the end.
   Change:
   ```
   Parse JSON for: `state_exists`, `roadmap_exists`, `project_exists`, `planning_exists`, `has_interrupted_agent`, `interrupted_agent_id`, `commit_docs`.
   ```
   To:
   ```
   Parse JSON for: `state_exists`, `roadmap_exists`, `project_exists`, `planning_exists`, `has_interrupted_agent`, `interrupted_agent_id`, `commit_docs`, `dual_install`.
   ```

2. **After line 150 (present_status step):** After the "Last activity" line of the status box closing, add the dual-install status display block. Insert after line 150 (the empty line after the status box close):
   ```

   [If dual_install.detected is true (from init JSON):]
   ℹ️  Dual GSD installation detected:
       Local: v[dual_install.local.version] (this project — active)
       Global: v[dual_install.global.version] (baseline)
       See: references/dual-installation.md
   ```

IMPORTANT: Do NOT change any path prefixes. The npm source file correctly uses `~/.claude/` paths. Only add the two dual-install content blocks described above.
  </action>
  <verify>
Run: `grep 'dual_install' get-shit-done/workflows/resume-project.md` -- should show both the parse line and display block references.
Run: `diff <(sed 's|~/.claude/|./.claude/|g' get-shit-done/workflows/resume-project.md) .claude/get-shit-done/workflows/resume-project.md` -- should show no differences (content-equivalent after normalization).
  </verify>
  <done>get-shit-done/workflows/resume-project.md includes dual_install in the init JSON parse list and the dual-install status display block in present_status. File is content-equivalent to .claude/get-shit-done/workflows/resume-project.md after path normalization.</done>
</task>

</tasks>

<verification>
After both tasks, run the full sync verification:

```bash
# Verify knowledge-store.md sync
diff <(sed 's|~/.claude/|./.claude/|g' agents/knowledge-store.md) .claude/agents/knowledge-store.md

# Verify resume-project.md sync
diff <(sed 's|~/.claude/|./.claude/|g' get-shit-done/workflows/resume-project.md) .claude/get-shit-done/workflows/resume-project.md

# Run existing tests to ensure nothing broken
npm test
```

Both diff commands should produce no output (files are content-equivalent after path normalization).
</verification>

<success_criteria>
- agents/knowledge-store.md exists with ~/.claude/ paths and matches installed version after normalization
- get-shit-done/workflows/resume-project.md includes dual-install detection and matches installed version after normalization
- npm test passes
- No ./.claude/ path references in npm source files
</success_criteria>

<output>
After completion, create `.planning/quick/8-recover-lost-code-from-deleted-local-pat/8-SUMMARY.md`
</output>
