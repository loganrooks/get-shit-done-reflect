<purpose>
Check for GSD updates via npm, preview the relevant changelog entries, and execute a runtime-correct reinstall from the published package.
</purpose>

<required_reading>
Read all files referenced by the invoking prompt's execution_context before starting.
</required_reading>

<process>

<step name="detect_runtime">
Detect the active runtime before reading any installed VERSION files.

Use this order:

1. If `CODEX_THREAD_ID` is set, treat the runtime as Codex.
2. Otherwise treat the runtime as Claude Code.

Set runtime-specific labels for later messaging:

- **Codex**
  - Runtime label: `Codex CLI`
  - Upgrade command: `$gsdr-upgrade-project`
  - Reapply command: `$gsdr-reapply-patches`
  - Restart reminder: `Restart Codex CLI`
- **Claude**
  - Runtime label: `Claude Code`
  - Upgrade command: `/gsd:upgrade-project`
  - Reapply command: `/gsd:reapply-patches`
  - Restart reminder: `Restart Claude Code`
</step>

<step name="check_latest_version">
Check npm for the latest published version:

```bash
npm view get-shit-done-reflect-cc version 2>/dev/null
```

**If npm check fails:**

```
Couldn't check for updates (offline or npm unavailable).

To update manually:
- Codex: `npx --yes get-shit-done-reflect-cc@latest --codex --global`
- Claude: `npx --yes get-shit-done-reflect-cc@latest --claude --global`
```

Exit.
</step>

<step name="resolve_install_target">
Resolve the installed target and update command arguments.

## Codex branch

When runtime is Codex, the shared resolver owns target selection. Do **not** re-encode local-first `.claude` logic in this workflow.

Locate the installed resolver bridge:

```bash
LOCAL_RESOLVER="./.codex/get-shit-done-reflect/bin/update-target.cjs"
GLOBAL_CODEX_DIR="${CODEX_CONFIG_DIR:-$HOME/.codex}"
GLOBAL_RESOLVER="${GLOBAL_CODEX_DIR}/get-shit-done-reflect/bin/update-target.cjs"
```

Resolver selection rules:

- If `LOCAL_RESOLVER` exists, use it.
- Else if `GLOBAL_RESOLVER` exists, use it.
- Else error: Codex update tooling is not installed.

Run the resolver bridge before confirmation:

```bash
node "$RESOLVER" --runtime codex --cwd "$PWD" --latest-version "$LATEST_VERSION"
```

If `CODEX_CONFIG_DIR` is set, pass it explicitly:

```bash
node "$RESOLVER" --runtime codex --cwd "$PWD" --latest-version "$LATEST_VERSION" --config-dir "$CODEX_CONFIG_DIR"
```

Parse the returned JSON and keep these fields:

- `local.version`
- `global.version`
- `selected_target.scope`
- `selected_target.version`
- `selected_target.version_path`
- `install_args`
- `config_dir`
- `reason`
- `reason_code`
- `remaining_divergent_scope`
- `does_not_apply_reason`

Use the resolver's `install_args` verbatim. Valid Codex examples include:

- `--codex --global`
- `--codex --local`
- `--codex --global --config-dir /path/to/.codex`

Set `INSTALLED_VERSION` to `selected_target.version` or `0.0.0` if no version is present.

Set `GSD_TOOLS_PATH` for later config-gap checks:

- Selected local scope: `./.codex/get-shit-done-reflect/bin/gsd-tools.cjs`
- Selected global scope: `${config_dir}/get-shit-done-reflect/bin/gsd-tools.cjs`

Set `PATCH_BACKUP_META` for later local-patch reporting:

- Selected local scope: `./.codex/gsd-local-patches/backup-meta.json`
- Selected global scope: `${config_dir}/gsd-local-patches/backup-meta.json`

Do **not** clear a Codex update cache file. Treat `cache_to_clear` as `null` and show `does_not_apply_reason` instead.

## Claude branch

When runtime is Claude Code, keep the simple local/global detection flow:

```bash
if [ -f "./.claude/get-shit-done-reflect/VERSION" ]; then
  cat "./.claude/get-shit-done-reflect/VERSION"
  echo "LOCAL"
elif [ -f "$HOME/.claude/get-shit-done-reflect/VERSION" ]; then
  cat "$HOME/.claude/get-shit-done-reflect/VERSION"
  echo "GLOBAL"
else
  echo "UNKNOWN"
fi
```

Parse output:

- `LOCAL` → `INSTALL_ARGS="--claude --local"`
- `GLOBAL` → `INSTALL_ARGS="--claude --global"`
- `UNKNOWN` → treat installed version as `0.0.0` and default `INSTALL_ARGS="--claude --global"`

Set `GSD_TOOLS_PATH`:

- Local: `./.claude/get-shit-done-reflect/bin/gsd-tools.cjs`
- Global: `$HOME/.claude/get-shit-done-reflect/bin/gsd-tools.cjs`

Set `PATCH_BACKUP_META`:

- Local: `./.claude/gsd-local-patches/backup-meta.json`
- Global: `$HOME/.claude/gsd-local-patches/backup-meta.json`

Set `CACHE_TO_CLEAR`:

- Local: `./.claude/cache/gsd-update-check.json`
- Global: `$HOME/.claude/cache/gsd-update-check.json`
</step>

<step name="compare_versions">
Compare `INSTALLED_VERSION` to `LATEST_VERSION` using semantic version ordering and strip any trailing `+dev` suffix before comparing.

**If installed == latest:**

```
## GSD Update

**Installed:** X.Y.Z
**Latest:** X.Y.Z

You're already on the latest version.
```

If runtime is Codex and `remaining_divergent_scope` exists, also note that the other scope still differs even though the selected target is current.

Exit.

**If installed > latest:**

```
## GSD Update

**Installed:** X.Y.Z
**Latest:** A.B.C

You're ahead of the latest release (development version?).
```

Exit.
</step>

<step name="show_changes_and_confirm">
If an update is available, fetch and show the changelog entries between `INSTALLED_VERSION` and `LATEST_VERSION` before updating.

Display a preview that is runtime-correct.

## Codex preview requirements

Show:

- `Repo-local Codex mirror: {local.version or missing}`
- `Global Codex install: {global.version or missing}`
- `Selected target: {selected_target.scope}`
- `Config dir: {config_dir}` when non-default or helpful
- `Reason: {reason}`
- `Unselected divergent scope: {remaining_divergent_scope.scope} ({remaining_divergent_scope.version})` when `remaining_divergent_scope` exists
- `Codex cache handling: {does_not_apply_reason}`

The preview must make it obvious that one invocation updates exactly one target. If `remaining_divergent_scope` exists, say that clearly so the other stale/different scope is not hidden.

## Claude preview requirements

Keep the existing local/global warning flow, but use `get-shit-done-reflect` path names consistently.

For all runtimes, include the clean-install warning:

```
⚠️  **Note:** The installer performs a clean install of GSD folders:
- `commands/gsdr/` or `skills/gsdr-*` will be replaced for the active runtime
- `get-shit-done-reflect/` will be replaced
- `agents/gsdr-*` files will be replaced
```

Published-package reminder:

```
This update runs from `get-shit-done-reflect-cc@latest`, not from the current repo checkout.
```

Use AskUserQuestion:

- Question: `Proceed with update?`
- Options:
  - `Yes, update now`
  - `No, cancel`

If user cancels: exit.
</step>

<step name="run_update">
Execute the update from the published npm package, not from the current checkout.

Codex installs must use the resolver-emitted args verbatim.

```bash
npx --yes get-shit-done-reflect-cc@latest {INSTALL_ARGS}
```

Concrete examples:

- Codex global: `npx --yes get-shit-done-reflect-cc@latest --codex --global`
- Codex local: `npx --yes get-shit-done-reflect-cc@latest --codex --local`
- Claude global: `npx --yes get-shit-done-reflect-cc@latest --claude --global`
- Claude local: `npx --yes get-shit-done-reflect-cc@latest --claude --local`

Capture output. If install fails, show the error and exit.

Post-install cache handling:

- If runtime is Claude and `CACHE_TO_CLEAR` exists, remove it.
- If runtime is Codex, do not fabricate or remove a cache file. Instead report the resolver's `does_not_apply_reason`.
</step>

<step name="check_config_gaps">
After installation completes, check whether the updated version introduces new project-config features.

Use the selected runtime-correct `GSD_TOOLS_PATH`:

```bash
DIFF=$(node "$GSD_TOOLS_PATH" manifest diff-config --raw 2>/dev/null)
```

If the command fails (no config.json, no manifest, path absent, or any error): skip silently.

If it succeeds:

- Count `missing_features`
- Count `missing_fields`
- Compare `manifest_version` and `config_manifest_version`

If no gaps are found: skip silently.

If gaps are found:

- **YOLO mode:** auto-apply the migration, log it, and update the version stamp using the same `GSD_TOOLS_PATH`.
- **Interactive mode:** show the missing features and tell the user to run the runtime-correct upgrade command:
  - Codex: `$gsdr-upgrade-project`
  - Claude: `/gsd:upgrade-project`

Do not auto-apply in interactive mode.
</step>

<step name="display_result">
Format the completion message:

```
╔═══════════════════════════════════════════════════════════╗
║  GSD Updated: vOLD → vNEW                                ║
╚═══════════════════════════════════════════════════════════╝
```

Then show the runtime-correct reminder:

- Codex: `Restart Codex CLI to pick up the updated skills and workflows.`
- Claude: `Restart Claude Code to pick up the new commands.`

If `remaining_divergent_scope` exists, also say:

```
One divergent scope remains after this update: {scope} ({version}).
Run the update again from that scope if you want both installations brought into parity.
```

Finally include the changelog link:

`https://github.com/loganrooks/get-shit-done-reflect/blob/main/CHANGELOG.md`
</step>


<step name="check_local_patches">
After update completes, check whether the installer backed up locally modified files:

```bash
[ -f "$PATCH_BACKUP_META" ]
```

If patches were backed up, display:

```
Local patches were backed up before the update.
Run the runtime-correct reapply command to merge your modifications into the new version.
```

Use:

- Codex: `$gsdr-reapply-patches`
- Claude: `/gsd:reapply-patches`

If no patches were backed up: continue normally.
</step>
</process>

<success_criteria>
- [ ] Active runtime detected before install lookup
- [ ] Latest version checked via npm
- [ ] Codex branch uses `update-target.cjs` instead of hard-coded local-first `.claude` checks
- [ ] Update skipped if the selected target is already current
- [ ] Changelog preview shown before update
- [ ] Clean install warning shown
- [ ] User confirmation obtained
- [ ] Update executed from `get-shit-done-reflect-cc@latest`
- [ ] Codex install args stay explicit (`--codex --global` or `--codex --local`, plus `--config-dir` when needed)
- [ ] Post-install config gaps checked with the runtime-correct `gsd-tools` path
- [ ] Result message names the active runtime correctly
</success_criteria>
