---
phase: quick-10
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - agents/gsd-plan-checker.md
  - agents/gsd-research-synthesizer.md
  - agents/gsd-reflector.md
  - agents/gsd-signal-collector.md
  - agents/gsd-spike-runner.md
  - agents/kb-templates/lesson.md
  - agents/kb-templates/signal.md
  - agents/kb-templates/spike.md
  - agents/kb-templates/spike-design.md
  - agents/kb-templates/spike-decision.md
autonomous: true

must_haves:
  truths:
    - "All 5 target agents reference agent-protocol.md via <required_reading>"
    - "gsd-spike-runner uses shared reference instead of inline checkpoint protocol"
    - "agents/kb-templates/ directory exists with all 5 template files"
  artifacts:
    - path: "agents/gsd-plan-checker.md"
      provides: "agent-protocol required_reading section"
      contains: "required_reading"
    - path: "agents/gsd-research-synthesizer.md"
      provides: "agent-protocol required_reading section"
      contains: "required_reading"
    - path: "agents/gsd-reflector.md"
      provides: "agent-protocol required_reading section"
      contains: "required_reading"
    - path: "agents/gsd-signal-collector.md"
      provides: "agent-protocol required_reading section"
      contains: "required_reading"
    - path: "agents/gsd-spike-runner.md"
      provides: "agent-protocol required_reading replacing inline checkpoint protocol"
      contains: "required_reading"
    - path: "agents/kb-templates/lesson.md"
      provides: "lesson KB template in npm source"
    - path: "agents/kb-templates/signal.md"
      provides: "signal KB template in npm source"
    - path: "agents/kb-templates/spike.md"
      provides: "spike KB template in npm source"
    - path: "agents/kb-templates/spike-design.md"
      provides: "spike-design KB template in npm source"
    - path: "agents/kb-templates/spike-decision.md"
      provides: "spike-decision KB template in npm source"
  key_links:
    - from: "agents/gsd-spike-runner.md"
      to: "get-shit-done/references/agent-protocol.md"
      via: "required_reading section referencing ~/.claude path"
---

<objective>
Fix pre-v1.16 tech debt by adding agent-protocol.md required_reading to 5 agents that are missing it, replace inline checkpoint protocol in gsd-spike-runner with the shared reference, and copy kb-templates from .claude/agents/kb-templates/ to agents/kb-templates/ (npm source).

Purpose: Ensure all agents load the shared agent protocol at runtime, and ensure kb-templates ship in the npm package (currently missing from source).
Output: 5 updated agent files in agents/, 5 new kb-template files in agents/kb-templates/.
</objective>

<execution_context>
@./.claude/get-shit-done/workflows/execute-plan.md
@./.claude/get-shit-done/templates/summary-standard.md
</execution_context>

<context>
@.planning/STATE.md

# Reference: pattern used by agents that already have required_reading
@agents/gsd-executor.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add required_reading to gsd-plan-checker, gsd-research-synthesizer, gsd-reflector, gsd-signal-collector</name>
  <files>
    agents/gsd-plan-checker.md
    agents/gsd-research-synthesizer.md
    agents/gsd-reflector.md
    agents/gsd-signal-collector.md
  </files>
  <action>
Add a `<required_reading>` section to each of the 4 agents. The section goes at the END of each file (after the final closing tag). Pattern to follow (from agents/gsd-executor.md):

```
<required_reading>
@~/.claude/get-shit-done/references/agent-protocol.md
</required_reading>
```

Note: npm source files use the `~/.claude/` prefix (not `./`). The installer's replacePathsInContent() converts this to `./.claude/` during local install.

For each file:
- gsd-plan-checker.md: Append after `</success_criteria>` (line 622, end of file)
- gsd-research-synthesizer.md: Append after the final quality indicators paragraph (line 235, end of file)
- gsd-reflector.md: Append after `</guidelines>` (line 274, end of file)
- gsd-signal-collector.md: Append after `</guidelines>` (line 209, end of file)

Do NOT edit .claude/agents/ — only agents/ (npm source).
  </action>
  <verify>
grep -l "required_reading" agents/gsd-plan-checker.md agents/gsd-research-synthesizer.md agents/gsd-reflector.md agents/gsd-signal-collector.md | wc -l
# Should output 4
  </verify>
  <done>All 4 files contain `<required_reading>` with the `@~/.claude/get-shit-done/references/agent-protocol.md` path at end of file.</done>
</task>

<task type="auto">
  <name>Task 2: Replace inline checkpoint protocol in gsd-spike-runner with shared reference, and copy kb-templates to npm source</name>
  <files>
    agents/gsd-spike-runner.md
    agents/kb-templates/lesson.md
    agents/kb-templates/signal.md
    agents/kb-templates/spike.md
    agents/kb-templates/spike-design.md
    agents/kb-templates/spike-decision.md
  </files>
  <action>
**Part A: gsd-spike-runner.md**

The inline `<checkpoint_triggers>` section (lines 323-371) contains a checkpoint format block that duplicates content from agent-protocol.md. This section should be preserved as-is (it defines WHEN to checkpoint, which is spike-specific), but the duplicate checkpoint FORMAT block inside it can stay since it's template output format, not protocol.

However, the file is MISSING `<required_reading>` entirely. Add it at the END of the file (after `</output_format>`, line 474):

```
<required_reading>
@~/.claude/get-shit-done/references/agent-protocol.md
</required_reading>
```

Note: The `<checkpoint_triggers>` section (lines 323-371) and `<iteration_handling>` section (lines 373-474) define spike-specific checkpoint behavior and output format templates — these are NOT duplicates of the general protocol, they are spike-domain-specific. Do NOT remove them. Just add the `<required_reading>` at end of file.

**Part B: Copy kb-templates to npm source**

Copy all 5 kb-template files from `.claude/agents/kb-templates/` to `agents/kb-templates/` (create the directory):

Files to copy:
- `.claude/agents/kb-templates/lesson.md` → `agents/kb-templates/lesson.md`
- `.claude/agents/kb-templates/signal.md` → `agents/kb-templates/signal.md`
- `.claude/agents/kb-templates/spike.md` → `agents/kb-templates/spike.md`
- `.claude/agents/kb-templates/spike-design.md` → `agents/kb-templates/spike-design.md`
- `.claude/agents/kb-templates/spike-decision.md` → `agents/kb-templates/spike-decision.md`

After copying, update the path references INSIDE each template file: if they reference `.claude/` paths that should remain as `.claude/` (since they are template content for runtime use, not installer-converted paths), leave them unchanged. Do NOT alter template content — copy as-is.

Also update the `<references>` section in gsd-spike-runner.md to point to the npm source path for kb-templates:

Current (line 21):
```
@.claude/agents/kb-templates/spike.md - Spike KB entry template
```

Change to:
```
@~/.claude/agents/kb-templates/spike.md - Spike KB entry template
```

(This ensures the installer can convert it to `./.claude/agents/kb-templates/spike.md` for local installs.)
  </action>
  <verify>
grep -c "required_reading" agents/gsd-spike-runner.md
# Should be 2 (opening and closing tags) or 1 line with the path
ls agents/kb-templates/
# Should list: lesson.md, signal.md, spike.md, spike-design.md, spike-decision.md
  </verify>
  <done>gsd-spike-runner.md has `<required_reading>` at end of file. agents/kb-templates/ directory exists with all 5 template files copied from .claude/agents/kb-templates/.</done>
</task>

</tasks>

<verification>
After both tasks:

```bash
# Verify all 5 agents have required_reading
for f in agents/gsd-plan-checker.md agents/gsd-research-synthesizer.md agents/gsd-reflector.md agents/gsd-signal-collector.md agents/gsd-spike-runner.md; do
  echo -n "$f: "
  grep -c "required_reading" "$f"
done

# Verify kb-templates directory
ls agents/kb-templates/

# Verify npm source files were edited (not .claude/)
git diff --name-only | grep "^agents/"
```
</verification>

<success_criteria>
- All 5 target agents (gsd-plan-checker, gsd-research-synthesizer, gsd-reflector, gsd-signal-collector, gsd-spike-runner) contain `<required_reading>@~/.claude/get-shit-done/references/agent-protocol.md</required_reading>` at end of file
- agents/kb-templates/ exists with lesson.md, signal.md, spike.md, spike-design.md, spike-decision.md
- Zero edits to .claude/ directory (only agents/ npm source modified)
- git diff shows only agents/ file changes
</success_criteria>

<output>
After completion, create `.planning/quick/10-fix-pre-v1-16-tech-debt-add-agent-protoc/10-SUMMARY.md`
</output>
