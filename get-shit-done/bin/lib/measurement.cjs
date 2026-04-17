'use strict';

const { error, output } = require('./core.cjs');

function tryRequire(modulePath) {
  try {
    return require(modulePath);
  } catch (err) {
    if (err && err.code === 'MODULE_NOT_FOUND' && err.message.includes(modulePath)) {
      return null;
    }
    throw err;
  }
}

function buildHelpEnvelope() {
  return {
    command: 'measurement',
    description: 'Measurement substrate commands for store materialization and interpretation-ready output.',
    subcommands: {
      rebuild: {
        usage: 'gsd-tools measurement rebuild',
        description: 'Materialize the measurement store from raw/derived/GSDR sources.'
      },
      query: {
        usage: 'gsd-tools measurement query [question] [--scope project|runtime] [--runtime name]',
        description: 'Return an interpretation-ready JSON envelope from the measurement store.'
      },
      report: {
        usage: 'gsd-tools measurement report <loop> [--no-stratification] [--runtime name]',
        description: 'Render a text-first markdown+ASCII report for a loop (agent_performance, signal_quality, cross_session_patterns, cross_runtime_comparison, intervention_lifecycle, pipeline_integrity).'
      }
    }
  };
}

function buildScaffoldResponse(action, cwd, extra = {}) {
  return {
    command: 'measurement',
    action,
    status: 'scaffold_only',
    cwd,
    message: 'Measurement router scaffold is present; internal helpers land in subsequent plan tasks.',
    ...extra
  };
}

function parseQueryOptions(args) {
  let question = 'overview';
  let scope = 'project';
  let runtime = null;

  const positional = [];
  for (let i = 0; i < args.length; i++) {
    const token = args[i];
    if (token === '--scope') {
      scope = args[i + 1] || scope;
      i++;
      continue;
    }
    if (token === '--runtime') {
      runtime = args[i + 1] || runtime;
      i++;
      continue;
    }
    positional.push(token);
  }

  if (positional.length > 0) {
    question = positional.join(' ');
  }

  return { question, scope, runtime };
}

function cmdMeasurement(cwd, args, raw) {
  const [subcommand, ...rest] = args;

  if (!subcommand || subcommand === 'help' || subcommand === '--help') {
    output(buildHelpEnvelope(), raw);
    return;
  }

  const registry = tryRequire('./measurement/registry.cjs');
  const store = tryRequire('./measurement/store.cjs');
  const query = tryRequire('./measurement/query.cjs');

  if (subcommand === 'rebuild') {
    if (!registry || !store || !store.rebuildMeasurementStore) {
      output(buildScaffoldResponse('rebuild', cwd), raw);
      return;
    }
    const result = store.rebuildMeasurementStore(cwd, {
      registry: registry.buildRegistry ? registry.buildRegistry() : null
    });
    output(result, raw);
    return;
  }

  if (subcommand === 'query') {
    const options = parseQueryOptions(rest);
    if (!query || !query.queryMeasurement) {
      output(buildScaffoldResponse('query', cwd, options), raw);
      return;
    }
    const result = query.queryMeasurement(cwd, {
      ...options,
      registry: registry && registry.buildRegistry ? registry.buildRegistry() : null
    });
    output(result, raw);
    return;
  }

  if (subcommand === 'report') {
    const dispatch = tryRequire('./measurement/report/dispatch.cjs');
    if (!dispatch || !dispatch.cmdMeasurementReport) {
      output(buildScaffoldResponse('report', cwd, { loop: rest[0] || null }), raw);
      return;
    }
    const result = dispatch.cmdMeasurementReport(cwd, rest, raw);
    if (raw || !result || !result.__text) {
      output(result || {}, raw);
    } else {
      console.log(result.__text);
    }
    return;
  }

  error('Usage: gsd-tools measurement <rebuild|query|report>');
}

module.exports = {
  cmdMeasurement,
};
