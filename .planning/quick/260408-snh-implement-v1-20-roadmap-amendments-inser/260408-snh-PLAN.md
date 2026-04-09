---
phase: quick
plan: 260408-snh
type: execute
wave: 1
depends_on: []
files_modified:
  - .planning/ROADMAP.md
  - .planning/REQUIREMENTS.md
  - .planning/STATE.md
  - get-shit-done/references/capability-matrix.md
autonomous: true
must_haves:
  truths:
    - "Phase 55.2 (Codex Runtime Substrate) exists in ROADMAP.md between 55.1 and 56"
    - "CODEX-01, CODEX-02, CODEX-05 requirements exist in REQUIREMENTS.md under a Codex Substrate section"
    - "XRT-02 references Codex only, not generic cross-runtime"
    - "Gemini CLI and OpenCode columns in capability-matrix.md carry deprecation notices"
    - "STATE.md has roadmap evolution entries for Phase 55.2 insertion and Gemini/OpenCode deprecation"
    - "Phase count updated from 10 to 11 and requirements count from 57 to 60"
  artifacts:
    - path: ".planning/ROADMAP.md"
      provides: "Phase 55.2 entry, updated Phase 60 description, updated counts"
      contains: "Phase 55.2: Codex Runtime Substrate"
    - path: ".planning/REQUIREMENTS.md"
      provides: "CODEX-01/02/05 requirements, updated XRT-02, updated traceability"
      contains: "CODEX-01"
    - path: ".planning/STATE.md"
      provides: "Roadmap evolution entries"
      contains: "Phase 55.2 inserted"
    - path: "get-shit-done/references/capability-matrix.md"
      provides: "Deprecation notices on Gemini/OpenCode"
      contains: "community-maintained"
  key_links: []
---

<objective>
Implement the finalized v1.20 roadmap amendments across 4 planning/reference documents.

Purpose: Codex audit consensus (cross-model, 3 reviews) identified gaps requiring a new phase (55.2), new requirements (CODEX-01/02/05), and a narrowed runtime focus (deprecate Gemini CLI and OpenCode). These are docs-only amendments to planning artifacts -- no runtime code changes.

Output: Updated ROADMAP.md, REQUIREMENTS.md, STATE.md, and capability-matrix.md reflecting the finalized amendments.
</objective>

<context>
@.planning/audits/v1.20-roadmap-amendments-finalized.md
@.planning/ROADMAP.md
@.planning/REQUIREMENTS.md
@.planning/STATE.md
@get-shit-done/references/capability-matrix.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: ROADMAP.md and REQUIREMENTS.md amendments</name>
  <files>.planning/ROADMAP.md, .planning/REQUIREMENTS.md</files>
  <action>
**ROADMAP.md changes:**

1. Update header counts:
   - Change `**Phases:** 10 (Phases 55-64)` to `**Phases:** 11 (Phases 55-64 + 55.1, 55.2)`
   - Change `**Requirements:** 57 mapped` to `**Requirements:** 60 mapped`

2. Insert Phase 55.2 entry AFTER Phase 55.1 and BEFORE Phase 56. Use this exact content:

```
### Phase 55.2: Codex Runtime Substrate (INSERTED)

**Goal:** The harness correctly detects, adapts to, and verifies Codex CLI capabilities -- runtime detection is code-level accurate, agent/sensor discovery works across formats, and parity monitoring prevents silent drift.
**Depends on:** Phase 55.1 (upstream bugs patched first)
**Requirements:** CODEX-01, CODEX-02, CODEX-05
**Success Criteria** (what must be TRUE):
  1. Runtime capability resolver (`automation.cjs`) correctly identifies `codex-cli` capabilities without falling back to "constrained" heuristic
  2. Agent and sensor discovery handles both `.md` (Claude Code) and `.toml` (Codex) formats in both `.claude/` and `.codex/` paths
  3. Brownfield detection excludes `.codex/` directory from false-positive triggers
  4. Documentation in capability-matrix.md accurately reflects live Codex CLI runtime behavior (config.toml not codex.toml, hooks under development, SKILL.md format, agents/*.toml registration)
  5. `cross-runtime-parity-research.md` exists as living document recording last-audited Codex version and validation commands
**Plans:** 0 plans

Plans:
- [ ] TBD (run /gsd:plan-phase 55.2 to break down)
```

3. Update Phase 60 description:
   - Change title from `Phase 60: Sensor Pipeline & Cross-Runtime Adaptation` to `Phase 60: Sensor Pipeline & Codex Parity`
   - In Goal line, change "across both active runtimes" to "across Claude Code and Codex CLI" (making the Codex focus explicit, dropping the implication of 4 runtimes)

4. In the Progress table, add a row for Phase 55.2 between 55.1 (if present) and 56. If 55.1 is not in the progress table, add both. The row should be:
   `| 55.2. Codex Runtime Substrate | 0/TBD | Not started | - |`

5. In Overall Progress, update v1.20 total phases if mentioned.

**REQUIREMENTS.md changes:**

1. Add new "Codex Substrate" section AFTER "Upstream Mini-Sync" and BEFORE "KB Infrastructure". Use the EXACT text from the amendments document (lines 96-110 of v1.20-roadmap-amendments-finalized.md):

```markdown
### Codex Substrate

- [ ] **CODEX-01**: Runtime capability resolver (`automation.cjs`) correctly identifies `codex-cli` capabilities -- task_tool, hooks status (under development), sandbox modes. Heuristic fallback does not default to "constrained" for Codex.
  - *Motivation:* GPT-5.4 audit confirmed `resolve-level --runtime codex-cli` returns capped result due to code only recognizing `claude-code` and `full`
  - *Dependencies:* None

- [ ] **CODEX-02**: Agent and sensor discovery works across `.md` (Claude Code) and `.toml` (Codex) formats, in both `.claude/` and `.codex/` paths. `sensors list`, `checkAgentsInstalled()`, and workflow sensor auto-discovery all handle both formats.
  - *Motivation:* Claude audit G2 (sensor glob), GPT-5.4 audit sections 2-3 (agent verification), confirmed with proof commands
  - *Dependencies:* None

- [ ] **CODEX-05**: `cross-runtime-parity-research.md` exists as a living document recording last-audited Codex CLI version, validation commands used, and expected artifact shapes. Post-install smoke test validates Codex artifacts against this document.
  - *Motivation:* GPT-5.4 drift audit monitoring section: "no durable record of what version was last audited"
  - *Dependencies:* None
```

2. Update XRT-02 to reference Codex specifically. Change:
   `- [ ] **XRT-02**: Patch compatibility checking validates patches against target runtime before cross-runtime application`
   To:
   `- [ ] **XRT-02**: Patch compatibility checking validates patches against Codex CLI target runtime before cross-runtime application`
   And update the motivation from `pattern: patches applied to Claude without checking Codex compatibility` -- keep this as-is since it already references Codex.

3. Add 3 traceability rows for the new requirements. Insert after XRT-02 row (line 259) in the Traceability table:
   ```
   | CODEX-01 | Phase 55.2 | Pending |
   | CODEX-02 | Phase 55.2 | Pending |
   | CODEX-05 | Phase 55.2 | Pending |
   ```

4. Update coverage counts at bottom:
   - Change `v1.20 requirements: 57 total` to `v1.20 requirements: 60 total`
   - Change `Mapped to phases: 57` to `Mapped to phases: 60`
  </action>
  <verify>
Run these checks:
- `grep -c "Phase 55.2" .planning/ROADMAP.md` returns >= 2 (header + progress table)
- `grep "Phases:" .planning/ROADMAP.md | head -1` shows 11
- `grep "Requirements:" .planning/ROADMAP.md | head -1` shows 60
- `grep "CODEX-01" .planning/REQUIREMENTS.md` returns content
- `grep "CODEX-02" .planning/REQUIREMENTS.md` returns content
- `grep "CODEX-05" .planning/REQUIREMENTS.md` returns content
- `grep "60 total" .planning/REQUIREMENTS.md` returns content
- `grep "Codex Parity" .planning/ROADMAP.md` returns content
- Traceability table has CODEX-01, CODEX-02, CODEX-05 rows
  </verify>
  <done>
Phase 55.2 exists in ROADMAP.md between 55.1 and 56 with correct goal, requirements, and success criteria. Phase 60 title updated to "Codex Parity". Phase and requirement counts updated (11 phases, 60 requirements). REQUIREMENTS.md has Codex Substrate section with CODEX-01/02/05 using exact text from amendments. XRT-02 references Codex specifically. Traceability table has 3 new rows. Coverage counts updated to 60.
  </done>
</task>

<task type="auto">
  <name>Task 2: STATE.md and capability-matrix.md amendments</name>
  <files>.planning/STATE.md, get-shit-done/references/capability-matrix.md</files>
  <action>
**STATE.md changes:**

1. Update `total_phases: 10` to `total_phases: 11` in the frontmatter.

2. Add two entries to the `### Roadmap Evolution` section (after the existing Phase 55.1 entry):

```markdown
- Phase 55.2 inserted after Phase 55.1: Codex Runtime Substrate -- runtime detection fixes, documentation drift corrections, parity smoke test. Derived from cross-model audit consensus (Claude, GPT-5.4 xhigh, Opus review, Sonnet review). Requirements: CODEX-01, CODEX-02, CODEX-05
- Gemini CLI and OpenCode deprecated as tested runtimes -- narrowing to Claude Code + Codex CLI only. Community-maintained status in capability-matrix.md. Decision documented in `.planning/deliberations/drop-gemini-opencode-focus-codex.md`
```

**capability-matrix.md changes:**

1. Add a deprecation notice block AFTER the opening blockquote (line 3) and BEFORE the Quick Reference table. Insert:

```markdown
> **Deprecation Notice (v1.20):** Gemini CLI and OpenCode columns are retained for
> reference but are **community-maintained and not tested by the GSD Reflect team**.
> The two supported runtimes are **Claude Code** and **Codex CLI**. The `--gemini`
> and `--opencode` installer flags still work but produce unsupported configurations.
> New workflows use binary Claude/Codex branching only -- no new `<capability_check>`
> blocks will be added for Gemini CLI or OpenCode.
```

2. In the Quick Reference table header row, add deprecation markers to the Gemini CLI and OpenCode column headers:
   - Change `OpenCode` to `OpenCode [D]`
   - Change `Gemini CLI` to `Gemini CLI [D]`

3. Add a footnote after the existing footnotes (after [5]):
   `> [D] Deprecated: community-maintained, not tested by GSD Reflect team. See deprecation notice above.`

4. In the "Gemini CLI" summary section (line 108-116), add at the top:
   `> **Deprecated:** Community-maintained, not tested by GSD Reflect team.`

5. In the "OpenCode" summary section (line 118-124), add at the top:
   `> **Deprecated:** Community-maintained, not tested by GSD Reflect team.`
  </action>
  <verify>
Run these checks:
- `grep "community-maintained" get-shit-done/references/capability-matrix.md` returns >= 3 hits (notice + Gemini section + OpenCode section)
- `grep "Deprecation Notice" get-shit-done/references/capability-matrix.md` returns content
- `grep "\[D\]" get-shit-done/references/capability-matrix.md` returns content for both OpenCode and Gemini
- `grep "Phase 55.2 inserted" .planning/STATE.md` returns content
- `grep "Gemini CLI and OpenCode deprecated" .planning/STATE.md` returns content
- `grep "total_phases: 11" .planning/STATE.md` returns content
  </verify>
  <done>
STATE.md has roadmap evolution entries for both Phase 55.2 insertion and Gemini/OpenCode deprecation decision. Total phases updated to 11. capability-matrix.md has deprecation notice block, [D] markers on column headers, deprecation footnote, and per-runtime deprecation notices for Gemini CLI and OpenCode sections.
  </done>
</task>

</tasks>

<verification>
All four files updated per the finalized amendments document:
1. ROADMAP.md: Phase 55.2 inserted, Phase 60 renamed, counts updated
2. REQUIREMENTS.md: Codex Substrate section with 3 requirements, XRT-02 updated, traceability rows added, counts updated
3. STATE.md: Roadmap evolution entries, total_phases updated
4. capability-matrix.md: Deprecation notices on Gemini CLI and OpenCode
</verification>

<success_criteria>
- Phase 55.2 exists in ROADMAP.md with goal, requirements, success criteria, and progress row
- Phase 60 title reflects "Codex Parity" focus
- CODEX-01, CODEX-02, CODEX-05 exist in REQUIREMENTS.md with exact text from amendments
- XRT-02 references Codex specifically
- Traceability table has 3 new rows mapping CODEX-* to Phase 55.2
- All count fields updated (11 phases, 60 requirements)
- capability-matrix.md has deprecation notices for Gemini CLI and OpenCode
- STATE.md has roadmap evolution entries for both amendments
- All changes are docs-only -- no runtime code modified
</success_criteria>

<output>
Commit all 4 files with message: `docs(v1.20): implement roadmap amendments -- Phase 55.2, CODEX requirements, Gemini/OpenCode deprecation`
</output>
