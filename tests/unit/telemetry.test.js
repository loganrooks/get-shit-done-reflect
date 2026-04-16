import { describe, it, expect } from 'vitest'
import { tmpdirTest } from '../helpers/tmpdir.js'
import path from 'node:path'
import fs from 'node:fs/promises'
import { execSync } from 'node:child_process'
import { createRequire } from 'node:module'

const GSD_TOOLS = path.resolve(process.cwd(), 'get-shit-done/bin/gsd-tools.cjs')
const require = createRequire(import.meta.url)
const { DatabaseSync } = require('node:sqlite')

/**
 * Helper: run a telemetry CLI command and parse JSON output
 */
function runTelemetry(tmpdir, subcommand, extraArgs = []) {
  const args = ['telemetry', subcommand, ...extraArgs, '--raw']
  const result = execSync(`node "${GSD_TOOLS}" ${args.join(' ')}`, {
    cwd: tmpdir,
    env: { ...process.env, HOME: path.join(tmpdir, 'home') },
    encoding: 'utf-8',
    timeout: 15000,
    stdio: ['pipe', 'pipe', 'pipe'],
  })
  return JSON.parse(result.trim())
}

/**
 * Create a mock session-meta file at the standard location under a mock HOME.
 */
async function createSessionMeta(tmpdir, sessionId, fields) {
  const sessionMetaDir = path.join(tmpdir, 'home', '.claude', 'usage-data', 'session-meta')
  await fs.mkdir(sessionMetaDir, { recursive: true })
  const session = {
    session_id: sessionId,
    project_path: tmpdir,
    start_time: fields.start_time || '2026-04-01T10:00:00Z',
    end_time: fields.end_time || '2026-04-01T11:00:00Z',
    assistant_message_count: fields.assistant_message_count ?? 5,
    user_message_count: fields.user_message_count ?? 5,
    output_tokens: fields.output_tokens ?? 1000,
    input_tokens: fields.input_tokens ?? 50,
    duration_minutes: fields.duration_minutes ?? 30,
    tool_errors: fields.tool_errors ?? 0,
    user_interruptions: fields.user_interruptions ?? 0,
    first_prompt: fields.first_prompt || 'test prompt',
    message_hours: fields.message_hours || [10],
  }
  await fs.writeFile(
    path.join(sessionMetaDir, `${sessionId}.json`),
    JSON.stringify(session, null, 2)
  )
  return session
}

/**
 * Create a mock facets file for a session.
 */
async function createFacets(tmpdir, sessionId, fields) {
  const facetsDir = path.join(tmpdir, 'home', '.claude', 'usage-data', 'facets')
  await fs.mkdir(facetsDir, { recursive: true })
  const facet = {
    session_id: sessionId,
    outcome: fields.outcome || 'fully_achieved',
    session_type: fields.session_type || 'development',
    claude_helpfulness: fields.claude_helpfulness || 'very_helpful',
    brief_summary: fields.brief_summary || 'Test session',
    underlying_goal: fields.underlying_goal || 'Test goal',
    friction_counts: fields.friction_counts || { tool_failure: 1 },
  }
  await fs.writeFile(
    path.join(facetsDir, `${sessionId}.json`),
    JSON.stringify(facet, null, 2)
  )
  return facet
}

/**
 * Create the standard 5-session fixture set described in the plan.
 */
async function createFixtureCorpus(tmpdir) {
  // Ensure .planning exists for baseline to write to
  await fs.mkdir(path.join(tmpdir, '.planning'), { recursive: true })

  // Session 1: Clean GSD execute session
  await createSessionMeta(tmpdir, 'sess-gsd-execute', {
    assistant_message_count: 15,
    output_tokens: 2500,
    duration_minutes: 45,
    tool_errors: 2,
    user_interruptions: 1,
    first_prompt: '/gsd:execute-phase 57',
    message_hours: [9, 9, 9, 10, 10],
  })

  // Session 2: Clean short ad-hoc session
  await createSessionMeta(tmpdir, 'sess-adhoc', {
    assistant_message_count: 3,
    output_tokens: 400,
    duration_minutes: 6,
    tool_errors: 0,
    user_interruptions: 0,
    first_prompt: 'quick fix',
    message_hours: [14],
  })

  // Session 3: Caveated multi-day session (duration > 1000)
  await createSessionMeta(tmpdir, 'sess-caveated', {
    assistant_message_count: 5,
    output_tokens: 800,
    duration_minutes: 2000,
    tool_errors: 1,
    user_interruptions: 0,
    first_prompt: '/gsd:discuss-phase 57',
    message_hours: [9, 11, 14, 17, 20],
  })

  // Session 4: Phantom ghost session (should be EXCLUDED)
  await createSessionMeta(tmpdir, 'sess-phantom', {
    assistant_message_count: 0,
    output_tokens: 0,
    duration_minutes: 0,
    tool_errors: 0,
    user_interruptions: 0,
    first_prompt: 'No prompt',
    message_hours: [],
  })

  // Session 5: Clean GSD plan session
  await createSessionMeta(tmpdir, 'sess-gsd-plan', {
    assistant_message_count: 8,
    output_tokens: 1200,
    duration_minutes: 25,
    tool_errors: 0,
    user_interruptions: 0,
    first_prompt: '/gsd:plan-phase 57',
    message_hours: [10, 10, 11],
  })
}

async function createCodexFixture(tmpdir, sessionId = 'codex-telemetry-thread') {
  const codexDir = path.join(tmpdir, 'home', '.codex')
  const rolloutPath = path.join(
    codexDir,
    'sessions',
    '2026',
    '04',
    '16',
    `rollout-2026-04-16T20-15-10-${sessionId}.jsonl`
  )
  const stateStorePath = path.join(codexDir, 'state_5.sqlite')

  await fs.mkdir(path.dirname(rolloutPath), { recursive: true })
  await fs.writeFile(
    rolloutPath,
    [
      JSON.stringify({
        timestamp: '2026-04-16T20:15:12.547Z',
        type: 'session_meta',
        payload: {
          id: sessionId,
          timestamp: '2026-04-16T20:15:10.139Z',
          cwd: tmpdir,
          originator: 'codex-tui',
          cli_version: '0.121.0',
          model_provider: 'openai',
          source: 'cli',
        },
      }),
      JSON.stringify({
        timestamp: '2026-04-16T20:15:12.551Z',
        type: 'event_msg',
        payload: { type: 'user_message', message: 'telemetry compatibility fixture' },
      }),
    ].join('\n')
  )

  await fs.mkdir(path.dirname(stateStorePath), { recursive: true })
  const db = new DatabaseSync(stateStorePath)
  db.exec(`
    CREATE TABLE threads (
      id TEXT PRIMARY KEY,
      rollout_path TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      source TEXT NOT NULL DEFAULT 'cli',
      model_provider TEXT NOT NULL,
      cwd TEXT NOT NULL,
      title TEXT NOT NULL DEFAULT '',
      sandbox_policy TEXT NOT NULL,
      approval_mode TEXT NOT NULL,
      tokens_used INTEGER NOT NULL DEFAULT 0,
      has_user_event INTEGER NOT NULL DEFAULT 0,
      archived INTEGER NOT NULL DEFAULT 0,
      archived_at INTEGER,
      git_sha TEXT,
      git_branch TEXT,
      git_origin_url TEXT,
      cli_version TEXT NOT NULL DEFAULT '',
      first_user_message TEXT NOT NULL DEFAULT '',
      agent_nickname TEXT,
      agent_role TEXT,
      memory_mode TEXT NOT NULL DEFAULT 'enabled',
      model TEXT,
      reasoning_effort TEXT,
      agent_path TEXT,
      created_at_ms INTEGER,
      updated_at_ms INTEGER
    )
  `)
  db.prepare(`
    INSERT INTO threads (
      id, rollout_path, created_at, updated_at, model_provider, cwd,
      sandbox_policy, approval_mode, cli_version, model, reasoning_effort,
      created_at_ms, updated_at_ms
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    sessionId,
    rolloutPath,
    1776370510,
    1776370618,
    'openai',
    tmpdir,
    JSON.stringify({ type: 'danger-full-access' }),
    'never',
    '0.121.0',
    'gpt-5.4',
    'xhigh',
    1776370510139,
    1776370618000
  )
  db.close()
}

// --- Tests ---

describe('telemetry summary', () => {
  tmpdirTest('returns valid JSON structure', async ({ tmpdir }) => {
    await createFixtureCorpus(tmpdir)
    const result = runTelemetry(tmpdir, 'summary')
    expect(result).toHaveProperty('corpus')
    expect(result).toHaveProperty('distributions')
    expect(result).toHaveProperty('interpretive_notes')
    expect(result).toHaveProperty('session_count')
  })

  tmpdirTest('excludes ghost sessions from corpus', async ({ tmpdir }) => {
    await createFixtureCorpus(tmpdir)
    const result = runTelemetry(tmpdir, 'summary')
    // Phantom session excluded, caveated session excluded by default
    // Clean sessions: sess-gsd-execute, sess-adhoc, sess-gsd-plan = 3
    expect(result.corpus.excluded).toBeGreaterThanOrEqual(1)
    // session_count reflects filtered sessions (clean only by default, no project filter from cwd match)
    // The 3 clean sessions have project_path = tmpdir which equals cwd, so they should match
    expect(result.session_count).toBe(3)
  })

  tmpdirTest('includes interpretive_notes for each metric', async ({ tmpdir }) => {
    await createFixtureCorpus(tmpdir)
    const result = runTelemetry(tmpdir, 'summary')
    expect(result.interpretive_notes).toHaveProperty('output_tokens')
    expect(result.interpretive_notes).toHaveProperty('tool_errors')
    expect(result.interpretive_notes).toHaveProperty('duration_minutes')
    expect(result.interpretive_notes.output_tokens).toHaveProperty('measures')
    expect(result.interpretive_notes.output_tokens).toHaveProperty('does_not_measure')
    expect(result.interpretive_notes.output_tokens).toHaveProperty('could_mislead')
  })

  tmpdirTest('reports first_prompt_category breakdown', async ({ tmpdir }) => {
    await createFixtureCorpus(tmpdir)
    const result = runTelemetry(tmpdir, 'summary')
    expect(result.first_prompt_category).toHaveProperty('gsd_execute')
    expect(result.first_prompt_category.gsd_execute).toBe(1)
  })

  tmpdirTest('distributions have correct statistical fields', async ({ tmpdir }) => {
    await createFixtureCorpus(tmpdir)
    const result = runTelemetry(tmpdir, 'summary')
    const dist = result.distributions.output_tokens
    expect(dist).toHaveProperty('n')
    expect(dist).toHaveProperty('min')
    expect(dist).toHaveProperty('p25')
    expect(dist).toHaveProperty('median')
    expect(dist).toHaveProperty('p75')
    expect(dist).toHaveProperty('p90')
    expect(dist).toHaveProperty('max')
    expect(dist).toHaveProperty('mean')
    expect(dist.n).toBe(3) // 3 clean sessions
  })
})

describe('telemetry session', () => {
  tmpdirTest('returns single session detail with computed fields', async ({ tmpdir }) => {
    await createFixtureCorpus(tmpdir)
    const result = runTelemetry(tmpdir, 'session', ['sess-gsd-execute'])
    expect(result).toHaveProperty('_first_prompt_category', 'gsd_execute')
    expect(result).toHaveProperty('_hours_entropy')
    expect(result).toHaveProperty('_focus_level')
    expect(result).toHaveProperty('_tier', 'clean')
    expect(result.session_id).toBe('sess-gsd-execute')
  })

  tmpdirTest('errors when session not found', async ({ tmpdir }) => {
    await createFixtureCorpus(tmpdir)
    expect(() => runTelemetry(tmpdir, 'session', ['nonexistent-session-id'])).toThrow()
  })

  tmpdirTest('errors when session-id not provided', async ({ tmpdir }) => {
    await createFixtureCorpus(tmpdir)
    expect(() => {
      const args = ['telemetry', 'session', '--raw']
      execSync(`node "${GSD_TOOLS}" ${args.join(' ')}`, {
        cwd: tmpdir,
        env: { ...process.env, HOME: path.join(tmpdir, 'home') },
        encoding: 'utf-8',
        timeout: 15000,
        stdio: ['pipe', 'pipe', 'pipe'],
      })
    }).toThrow()
  })

  tmpdirTest('returns caveated session with correct tier', async ({ tmpdir }) => {
    await createFixtureCorpus(tmpdir)
    const result = runTelemetry(tmpdir, 'session', ['sess-caveated'])
    expect(result._tier).toBe('caveated')
    expect(result.duration_minutes).toBe(2000)
  })
})

describe('telemetry baseline', () => {
  tmpdirTest('writes baseline.json to .planning/', async ({ tmpdir }) => {
    await createFixtureCorpus(tmpdir)
    runTelemetry(tmpdir, 'baseline')
    const baselinePath = path.join(tmpdir, '.planning', 'baseline.json')
    const exists = await fs.stat(baselinePath).then(() => true).catch(() => false)
    expect(exists).toBe(true)
  })

  tmpdirTest('baseline has required top-level fields', async ({ tmpdir }) => {
    await createFixtureCorpus(tmpdir)
    const result = runTelemetry(tmpdir, 'baseline')
    expect(result).toHaveProperty('generated_at')
    expect(result).toHaveProperty('schema_version', '1.0')
    expect(result).toHaveProperty('runtime', 'claude-code')
    expect(result).toHaveProperty('corpus')
    expect(result).toHaveProperty('metrics')
    expect(result).toHaveProperty('interpretive_notes')
    expect(result).toHaveProperty('token_validation')
  })

  tmpdirTest('token_validation warns about input_tokens', async ({ tmpdir }) => {
    await createFixtureCorpus(tmpdir)
    const result = runTelemetry(tmpdir, 'baseline')
    expect(result.token_validation.input_tokens_warning).toBeTruthy()
    expect(result.token_validation.input_tokens_warning.toLowerCase()).toMatch(/cache|residual/)
  })

  tmpdirTest('does not use input_tokens as primary workload metric', async ({ tmpdir }) => {
    await createFixtureCorpus(tmpdir)
    const result = runTelemetry(tmpdir, 'baseline')
    // input_tokens should NOT be a top-level key in metrics
    expect(result.metrics).not.toHaveProperty('input_tokens')
    expect(result.token_validation.primary_source).toBe('output_tokens')
  })

  tmpdirTest('facets_metrics annotation is present', async ({ tmpdir }) => {
    await createFixtureCorpus(tmpdir)
    const result = runTelemetry(tmpdir, 'baseline')
    expect(result.facets_metrics).toHaveProperty('_annotation')
    expect(result.facets_metrics._annotation).toMatch(/AI-generated/)
  })

  tmpdirTest('corpus counts are correct', async ({ tmpdir }) => {
    await createFixtureCorpus(tmpdir)
    const result = runTelemetry(tmpdir, 'baseline')
    // 5 total files, 1 excluded (phantom), 1 caveated, 3 clean
    expect(result.corpus.total_files).toBe(5)
    expect(result.corpus.clean_count).toBe(3)
    expect(result.corpus.caveated_count).toBe(1)
    expect(result.corpus.excluded_count).toBe(1)
  })

  tmpdirTest('baseline.json file content matches command output', async ({ tmpdir }) => {
    await createFixtureCorpus(tmpdir)
    const cmdResult = runTelemetry(tmpdir, 'baseline')
    const fileContent = JSON.parse(
      await fs.readFile(path.join(tmpdir, '.planning', 'baseline.json'), 'utf-8')
    )
    expect(fileContent.schema_version).toBe(cmdResult.schema_version)
    expect(fileContent.runtime).toBe(cmdResult.runtime)
    expect(fileContent.corpus.clean_count).toBe(cmdResult.corpus.clean_count)
  })
})

describe('telemetry enrich', () => {
  tmpdirTest('returns session data when no facets present', async ({ tmpdir }) => {
    await createFixtureCorpus(tmpdir)
    const result = runTelemetry(tmpdir, 'enrich', ['sess-gsd-execute'])
    expect(result).toHaveProperty('session_id', 'sess-gsd-execute')
    expect(result).toHaveProperty('_first_prompt_category', 'gsd_execute')
    expect(result).toHaveProperty('_facets_message', 'No facets data for this session')
  })

  tmpdirTest('includes facets annotation when facets data exists', async ({ tmpdir }) => {
    await createFixtureCorpus(tmpdir)
    await createFacets(tmpdir, 'sess-gsd-execute', {
      outcome: 'fully_achieved',
      session_type: 'development',
      claude_helpfulness: 'very_helpful',
      friction_counts: { tool_failure: 2 },
    })
    const result = runTelemetry(tmpdir, 'enrich', ['sess-gsd-execute'])
    expect(result).toHaveProperty('_facets_annotation')
    expect(result._facets_annotation).toMatch(/AI-generated/)
    expect(result.facet_outcome).toBe('fully_achieved')
    expect(result.facet_outcome_ai_estimate).toBe(true)
  })

  tmpdirTest('errors when session-id not provided', async ({ tmpdir }) => {
    await createFixtureCorpus(tmpdir)
    expect(() => {
      const args = ['telemetry', 'enrich', '--raw']
      execSync(`node "${GSD_TOOLS}" ${args.join(' ')}`, {
        cwd: tmpdir,
        env: { ...process.env, HOME: path.join(tmpdir, 'home') },
        encoding: 'utf-8',
        timeout: 15000,
        stdio: ['pipe', 'pipe', 'pipe'],
      })
    }).toThrow()
  })

  tmpdirTest('errors when session not found', async ({ tmpdir }) => {
    await createFixtureCorpus(tmpdir)
    expect(() => runTelemetry(tmpdir, 'enrich', ['nonexistent-id'])).toThrow()
  })
})

describe('telemetry summary with facets', () => {
  tmpdirTest('facets coverage reflects matched sessions', async ({ tmpdir }) => {
    await createFixtureCorpus(tmpdir)
    // Add facets for one session
    await createFacets(tmpdir, 'sess-gsd-execute', {
      outcome: 'fully_achieved',
      session_type: 'development',
    })
    const result = runTelemetry(tmpdir, 'summary')
    expect(result.facets_coverage.matched).toBe(1)
    expect(result.facets_coverage.total).toBe(3)
    expect(result.facets_coverage.coverage_pct).toBeCloseTo(33.3, 0)
  })
})

describe('telemetry phase compatibility', () => {
  tmpdirTest('phase telemetry exposes shared measurement compatibility without dropping legacy fields', async ({ tmpdir }) => {
    await createFixtureCorpus(tmpdir)
    await fs.mkdir(path.join(tmpdir, '.planning', 'phases', '57-retroactive-test'), { recursive: true })
    await fs.writeFile(
      path.join(tmpdir, '.planning', 'config.json'),
      JSON.stringify({
        gsd_reflect_version: '1.19.4+dev',
        model_profile: 'quality',
      }, null, 2)
    )
    await fs.writeFile(
      path.join(tmpdir, '.planning', 'STATE.md'),
      '# State\n\nTelemetry phase compatibility fixture.\n'
    )
    await createCodexFixture(tmpdir)

    const result = runTelemetry(tmpdir, 'phase', ['57'])

    expect(result.phase).toBe('57')
    expect(result).toHaveProperty('session_count')
    expect(result).toHaveProperty('time_window')
    expect(result).toHaveProperty('_measurement_compatibility')
    expect(result._measurement_compatibility.runtime_dimension.runtimes_observed).toContain('claude-code')
    expect(result._measurement_compatibility.runtime_dimension.runtimes_observed).toContain('codex-cli')
    expect(result._measurement_compatibility.runtime_dimension.availability_markers.exposed.count).toBeGreaterThan(0)
    expect(result._measurement_compatibility.runtime_dimension.symmetry_markers.asymmetric_only.count).toBeGreaterThan(0)
  })
})
