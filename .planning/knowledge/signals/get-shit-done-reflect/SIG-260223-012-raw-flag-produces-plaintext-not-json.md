---
id: SIG-260223-012
date: 2026-02-23
type: deviation
severity: notable
polarity: negative
phase: 26
source: 26-01-SUMMARY.md
status: open
tags: [testing, tdd, cli-output]
---

# --raw flag produces plain-text, not JSON

## Signal

The `--raw` flag on gsd-tools CLI commands produces plain-text output (e.g., a bare count or ID string), not JSON. TDD RED-phase tests were written with `JSON.parse(result)` after `--raw` invocations, which was not caught until the GREEN phase when implementations produced plain strings instead of JSON.

## Impact

Tests that assert on structured data after `--raw` will always fail at parse time. The error manifests late (GREEN phase) rather than being caught during test design.

## Rule

When writing tests for CLI commands:
- `--raw` flag = plain-text output (string, number). Assert with `expect(result.trim()).toBe(...)`.
- Without `--raw` = JSON output. Assert with `JSON.parse(result)`.
- Never use `--raw` when you need structured output for assertions.

## Resolution

Fix tests to match the output format. Use `--raw` only when testing for specific plain-text values (counts, IDs).
