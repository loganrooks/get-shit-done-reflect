#!/usr/bin/env node
'use strict';

const { resolveCodexUpdateTarget } = require('./lib/update-target.cjs');

function parseArgs(argv) {
  const parsed = {
    cwd: process.cwd(),
    explicitConfigDir: null,
    runtime: 'codex',
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--cwd') {
      const value = argv[index + 1];
      if (!value || value.startsWith('--')) {
        throw new Error('--cwd requires a path value');
      }
      parsed.cwd = value;
      index += 1;
      continue;
    }

    if (arg.startsWith('--cwd=')) {
      parsed.cwd = arg.slice('--cwd='.length);
      continue;
    }

    if (arg === '--config-dir') {
      const value = argv[index + 1];
      if (!value || value.startsWith('--')) {
        throw new Error('--config-dir requires a path value');
      }
      parsed.explicitConfigDir = value;
      index += 1;
      continue;
    }

    if (arg.startsWith('--config-dir=')) {
      parsed.explicitConfigDir = arg.slice('--config-dir='.length);
      continue;
    }

    if (arg === '--runtime') {
      const value = argv[index + 1];
      if (!value || value.startsWith('--')) {
        throw new Error('--runtime requires a value');
      }
      parsed.runtime = value;
      index += 1;
      continue;
    }

    if (arg.startsWith('--runtime=')) {
      parsed.runtime = arg.slice('--runtime='.length);
    }
  }

  return parsed;
}

function main() {
  try {
    const options = parseArgs(process.argv.slice(2));
    if (options.runtime !== 'codex') {
      throw new Error(`Unsupported runtime "${options.runtime}". Only codex is supported.`);
    }

    const result = resolveCodexUpdateTarget({
      cwd: options.cwd,
      explicitConfigDir: options.explicitConfigDir,
    });

    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  } catch (error) {
    const payload = {
      runtime: 'codex',
      error: error.message,
    };
    process.stderr.write(`${JSON.stringify(payload, null, 2)}\n`);
    process.exitCode = 1;
  }
}

if (require.main === module) {
  main();
}
