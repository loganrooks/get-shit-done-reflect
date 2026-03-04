# Phase 38: Extensible Sensor Architecture - Context

**Gathered:** 2026-03-04
**Status:** Ready for planning

<domain>
## Phase Boundary

Build the sensor discovery and contract system so new sensors can be added by dropping a file into the agents directory — no framework modification required, existing sensors conform to the standard contract. CI sensor (Phase 39) is out of scope — this phase builds the architecture it will validate.

</domain>

<decisions>
## Implementation Decisions

### Failure & timeout behavior
- Per-sensor timeout declared in sensor contract (`timeout_seconds` field), with a global default fallback
- Orchestrator enforces timeout; on timeout, sensor treated as returning empty array
- No retry on failure — sensors analyze static local artifacts, retrying produces the same result
- Inline warning in synthesis output when sensors fail/timeout (e.g., "git-sensor: timed out, signals may be incomplete")
- Collection continues with remaining sensors — only fail workflow if ALL sensors fail (matches existing collect-signals error handling)
- Track `last_run_status: success|failure|timeout` per sensor via Phase 37 track-event mechanism

### CLI sensor observability (`sensors list`)
- `gsd-tools.js sensors list` shows: discovered sensors, enabled/disabled status, last run time, signal count, last run status
- Last run status (success/failure/timeout) added beyond EXT-04 minimum — disambiguates "0 signals because clean" vs "0 signals because broken"
- Data stored via Phase 37 automation statistics mechanism (fires, skips, last_triggered, last_skip_reason)
- No error history, no verbose mode, no blind spots in this view — keep it simple, Phase 41 handles ongoing monitoring

### Blind spots transparency
- Each sensor agent spec includes a `<blind_spots>` section documenting what classes of problems the sensor is structurally unable to detect (per EXT-07)
- Collection output includes a one-line standing caveat: "Sensors: artifact, git. For sensor limitations, see agent specs or run `gsd sensors blind-spots`"
- Blind spots queryable via CLI (`gsd sensors blind-spots`) — not repeated in every report
- Blind spots are static per sensor version, not dynamic per run

### Per-sensor configuration
- On/off toggle + model selection only (already exists in collect-signals config)
- No additional per-sensor config knobs for Phase 38 — current sensors don't need them
- Sensor contract includes an optional `config_schema` field that sensors MAY declare for future use
- Phase 39 CI sensor expected to be first sensor that actually declares config knobs (repo, workflow, etc.)

### Claude's Discretion
- Exact format of `sensors list` output (table vs plain text)
- Global default timeout value (suggest 30-60s based on sensor workload)
- How `config_schema` field is structured in the contract (JSON Schema, simple key-value, etc.)
- Exact wording of standing caveat in collection output

</decisions>

<specifics>
## Specific Ideas

- Contract should formalize what already exists informally: `## SENSOR OUTPUT` / `## END SENSOR OUTPUT` delimiters, JSON format, empty array on failure — these patterns are already in artifact and git sensors but aren't enforced as a standard
- The 6-touch-point problem (from EXT-01 motivation) is the driving pain: adding a sensor currently requires editing 6 files. After this phase, it should require creating 1 file
- Sensor contract should include a `blind_spots` declaration inspired by the philosophical motivation: "every sensor embodies a theory about what counts as a problem; documenting blind spots makes theory-ladenness visible"

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

## Open Questions

| Question | Why It Matters | Criticality | Status |
|----------|----------------|-------------|--------|
| Can Phase 37 track-event mechanism accommodate sensors as "features"? | Sensors need stats tracking (last_run, signal_count) — reusing track-event avoids parallel persistence | Medium | Pending |
| What are the actual 6 touch points for adding a sensor today? | EXT-01 motivation cites "6 files" — need to enumerate to ensure auto-discovery eliminates all of them | Medium | Pending |

---

*Phase: 38-extensible-sensor-architecture*
*Context gathered: 2026-03-04*
