import { describe, expect } from 'vitest'
import path from 'node:path'
import fs from 'node:fs/promises'
import { createRequire } from 'node:module'
import { tmpdirTest } from '../helpers/tmpdir.js'

const require = createRequire(import.meta.url)

const QUERY_PATH = path.resolve(process.cwd(), 'get-shit-done/bin/lib/measurement/query.cjs')
const PIPELINE_REPORT_PATH = path.resolve(process.cwd(), 'get-shit-done/bin/lib/measurement/report/loops/pipeline_integrity.cjs')
const AGENT_REPORT_PATH = path.resolve(process.cwd(), 'get-shit-done/bin/lib/measurement/report/loops/agent_performance.cjs')

const query = require(QUERY_PATH)
const pipelineReport = require(PIPELINE_REPORT_PATH)
const agentReport = require(AGENT_REPORT_PATH)

async function writeJson(filePath, data) {
  await fs.mkdir(path.dirname(filePath), { recursive: true })
  await fs.writeFile(filePath, JSON.stringify(data, null, 2))
}

async function setupMeasurementProject(tmpdir) {
  await fs.mkdir(path.join(tmpdir, 'home'), { recursive: true })
  await fs.mkdir(path.join(tmpdir, '.planning'), { recursive: true })
  await fs.writeFile(
    path.join(tmpdir, '.planning', 'config.json'),
    JSON.stringify({ mode: 'yolo', automation: { level: 1 } }, null, 2)
  )
  await fs.writeFile(
    path.join(tmpdir, '.planning', 'STATE.md'),
    '# State\n\nMinimal test state.\n'
  )
  await fs.mkdir(path.join(tmpdir, '.planning', 'measurement', 'interventions'), { recursive: true })
  await fs.mkdir(path.join(tmpdir, '.planning', 'measurement', 'diagnostics'), { recursive: true })
  await fs.writeFile(
    path.join(tmpdir, '.planning', 'measurement', 'interventions', '2026-04-17-test.md'),
    `---\nintervention_id: int-1\ninterpretation_id: phase_57_5_live_registry_query\nintervention_description: test\nintervention_artifact:\n  phase: 58\n  commit: abc123\npredicted_outcome:\n  summary: test\n  measurable_in_terms_of:\n    - intervention_points\nactual_outcome:\n  summary: null\n  evidence_paths: []\noutcome_status: pending\nevaluation_date: null\n---\n\n# Intervention\n`
  )
  await fs.writeFile(
    path.join(tmpdir, '.planning', 'measurement', 'diagnostics', '2026-04-17-revision.md'),
    `---\ndiagnostic_id: diag-2026-04-17-revision\nrevises: phase_57_5_live_registry_query\nrevision_classification: progressive\nrevised_at: 2026-04-17T00:00:00Z\n---\n\n# Revision\n`
  )

  const homeDir = path.join(tmpdir, 'home')
  const encodedProjectPath = path.resolve(tmpdir).replace(/[\\/]/g, '-')
  await writeJson(path.join(homeDir, '.claude', 'settings.json'), {
    showThinkingSummaries: true,
    effortLevel: 'high',
  })
  await writeJson(path.join(homeDir, '.claude', 'usage-data', 'session-meta', 'interp-fixture.json'), {
    session_id: 'interp-fixture',
    project_path: tmpdir,
    start_time: '2026-04-17T00:00:00Z',
    duration_minutes: 12,
    user_message_count: 2,
    assistant_message_count: 2,
    input_tokens: 10,
    output_tokens: 20,
    first_prompt: 'pipeline integrity',
    message_hours: [0],
  })
  await fs.mkdir(path.join(homeDir, '.claude', 'projects', encodedProjectPath), { recursive: true })
  await fs.writeFile(
    path.join(homeDir, '.claude', 'projects', encodedProjectPath, 'interp-fixture.jsonl'),
    [
      JSON.stringify({
        type: 'user',
        sessionId: 'interp-fixture',
        timestamp: '2026-04-17T00:00:00.000Z',
        cwd: tmpdir,
        version: '2.1.110',
        message: {
          role: 'user',
          content: 'show pipeline integrity',
        },
      }),
      JSON.stringify({
        type: 'assistant',
        sessionId: 'interp-fixture',
        timestamp: '2026-04-17T00:00:01.000Z',
        version: '2.1.110',
        message: {
          role: 'assistant',
          model: 'claude-opus-4-6',
          content: [{ type: 'tool_use', name: 'Bash', input: { command: 'ls' } }],
        },
      }),
      JSON.stringify({
        type: 'assistant',
        sessionId: 'interp-fixture',
        timestamp: '2026-04-17T00:00:02.000Z',
        version: '2.1.110',
        message: {
          role: 'assistant',
          model: 'claude-opus-4-6',
          content: [{ type: 'tool_use', name: 'Read', input: { file_path: '/tmp/demo' } }],
        },
      }),
      JSON.stringify({
        type: 'user',
        sessionId: 'interp-fixture',
        timestamp: '2026-04-17T00:00:03.000Z',
        cwd: tmpdir,
        version: '2.1.110',
        message: {
          role: 'user',
          content: '[Request interrupted by user]',
        },
      }),
    ].join('\n')
  )
}

describe('measurement interpretation-layer integration', () => {
  tmpdirTest('queryMeasurement augments interpretations and loop reports render privacy/provenance lines', async ({ tmpdir }) => {
    await setupMeasurementProject(tmpdir)
    const homeDir = path.join(tmpdir, 'home')

    const pipelineResult = query.queryMeasurement(tmpdir, {
      question: 'pipeline integrity',
      homeDir,
    })
    const interpretation = pipelineResult.interpretations[0]
    expect(interpretation).toHaveProperty('distinguishing_feature_suggestions')
    expect(interpretation).toHaveProperty('intervention_outcomes')
    expect(interpretation).toHaveProperty('revision_history')
    expect(interpretation).toHaveProperty('provenance_summary')
    expect(interpretation.intervention_outcomes).toHaveLength(1)
    expect(interpretation.revision_history).toHaveLength(1)
    expect(interpretation.provenance_summary).toMatch(/^surviving_challenge_from_/)

    const pipelineText = pipelineReport.render(pipelineResult)
    expect(pipelineText).toContain('privacy: derived_features_only')
    expect(pipelineText).toContain('intervention_points')
    expect(pipelineText).toContain('tool_invocation_sequence')
    expect(pipelineText).toContain('topic_shift_markers')
    expect(pipelineText).toContain('Provenance')
    expect(pipelineText).toContain('provenance: phase_57_5_live_registry_query -> surviving_challenge_from_')

    const agentResult = query.queryMeasurement(tmpdir, {
      question: 'agent performance',
      homeDir,
    })
    const agentText = agentReport.render(agentResult)
    expect(agentText).toContain('privacy: derived_features_only')
    expect(agentText).toContain('intervention_points')
    expect(agentText).toContain('tool_invocation_sequence')
    expect(agentText).toContain('Provenance')
    expect(agentText).toContain('provenance: phase_57_5_live_registry_query -> surviving_challenge_from_')
  })
})
