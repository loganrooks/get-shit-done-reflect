---
phase: quick
plan: 19
type: execute
wave: 1
---

# Quick Task 19: Fix co-installation namespace safety

<tasks>
<task type="auto">
  <name>Add isLegacyReflectInstall() detection and guard all gsd namespace cleanup</name>
  <done>Added detection function checking gsd-file-manifest.json for pre-Phase-44 Reflect installs. Guarded 3 locations in install() and 3 in uninstall() to only touch gsd namespace when legacy Reflect detected.</done>
</task>
<task type="auto">
  <name>Add co-installation preservation test</name>
  <done>New integration test verifies upstream GSD's get-shit-done/, commands/gsd/, and gsd-*.md agents are preserved when installing Reflect alongside. Updated existing upgrade test to simulate legacy manifest.</done>
</task>
<task type="auto">
  <name>Fix broken @-references in run-spike.md</name>
  <done>Changed .claude/agents/ references to ~/.claude/agents/ in npm source so refToRepoPath() resolves correctly.</done>
</task>
</tasks>
