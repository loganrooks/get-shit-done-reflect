# Repository Guidelines

## Project Structure & Module Organization

This repo ships the npm package for GSD Reflect. Edit the source directories, not
the installed copies under `.claude/`.

- `agents/` and `commands/gsd/`: source agent specs and slash-command docs
- `get-shit-done/`: shipped templates, references, workflows, and CLI runtime
- `get-shit-done/bin/lib/*.cjs`: modular CLI logic used by `get-shit-done/bin/gsd-tools.cjs`
- `bin/install.js`: installer and local/global deployment entrypoint
- `hooks/`: hook sources; `hooks/dist/` contains built outputs
- `tests/unit`, `tests/integration`, `tests/e2e`, `tests/smoke`: automated coverage
- `.planning/`: project state, roadmap, phases, and knowledge artifacts

## Build, Test, and Development Commands

- `npm test`: run the full Vitest suite
- `npm run test:infra`: run infrastructure-focused integration tests
- `npm run test:upstream`: run upstream Node test coverage for `gsd-tools`
- `npm run test:upstream:fork`: run fork-specific `gsd-tools` tests
- `npm run test:coverage`: run Vitest with coverage
- `npm run build:hooks`: rebuild distributable hook files
- `node bin/install.js --local`: reinstall source into the local runtime copy after edits

## Coding Style & Naming Conventions

Use the existing style in surrounding files. Runtime modules are CommonJS
(`.cjs`) with 2-space indentation. Keep Markdown command/workflow files in
kebab-case, and name tests `*.test.js`. No dedicated formatter or linter is
configured here, so avoid style-only churn and keep comments sparse and useful.

## Testing Guidelines

Vitest covers unit and integration behavior; Node's built-in test runner covers
the upstream-style CLI tests in `get-shit-done/bin/`. Run the smallest relevant
test set while iterating, then run the CI-critical checks before opening a PR:
`npm test`, `npm run test:infra`, `npm run test:upstream`, and
`npm run test:upstream:fork`.

## Commit & Pull Request Guidelines

Follow the existing conventional-style history: `feat(...)`, `fix(...)`,
`docs(...)`, `refactor(...)`, `test(...)`, `style(...)`. Keep commits scoped to
one change. PRs should target the fork's `main`, summarize affected runtimes or
workflow areas, and list the test commands you ran.

## Contributor Notes

Never hand-edit `.claude/` copies; they are installer outputs and will be
overwritten. Prefer source edits in `agents/`, `commands/`, and `get-shit-done/`,
then rebuild or reinstall as needed.
