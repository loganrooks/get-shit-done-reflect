### Added
- **Three-mode discuss system** (Issues #26, #32, #33): `workflow.discuss_mode` config key with three modes:
  - `exploratory` (default): preserves uncertainty, marks options as [grounded] or [open], `--auto` only selects grounded options
  - `discuss`: standard steering brief -- `--auto` picks recommended defaults decisively (upstream-compatible behavior)
  - `assumptions`: codebase-first inference with minimal user interaction via new `discuss-phase-assumptions.md` workflow
- **discuss-phase-assumptions.md workflow**: new workflow for assumptions mode -- scans codebase deeply, generates 4-8 working assumptions with confidence levels, presents for user review
- **Settings surface**: `workflow.discuss_mode` added to `/gsdr:settings` interactive configuration
- **Migration spec**: `v1.19.0.json` documents the new config key and mode system

### Fixed
- **Missing config keys**: `workflow.auto_advance`, `workflow.text_mode`, `workflow.research_before_questions` added to `VALID_CONFIG_KEYS` -- were referenced in discuss-phase.md but not registered, causing silent config-set failures
