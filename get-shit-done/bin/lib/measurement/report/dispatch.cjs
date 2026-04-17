'use strict';

const { queryMeasurement } = require('../query.cjs');
const { LOOP_DEFINITIONS } = require('../registry.cjs');

const LOOP_KEYS = Object.keys(LOOP_DEFINITIONS);

function renderLoopReport(loop, queryResult, opts = {}) {
  let template;
  try {
    template = require(`./loops/${loop}.cjs`);
  } catch (error) {
    if (error && error.code === 'MODULE_NOT_FOUND' && String(error.message).includes(`/loops/${loop}.cjs`)) {
      throw new Error(`No report template for loop "${loop}". Known: ${LOOP_KEYS.join(', ')}`);
    }
    throw error;
  }

  if (!template || typeof template.render !== 'function') {
    throw new Error(`Report template for "${loop}" does not export render().`);
  }

  return template.render(queryResult, opts);
}

function parseReportArgs(args) {
  const opts = {
    runtime: null,
    stratified: true,
  };
  let loop = null;

  for (let index = 0; index < args.length; index++) {
    const token = args[index];
    if (token === '--no-stratification') {
      opts.stratified = false;
      continue;
    }
    if (token === '--stratified') {
      opts.stratified = true;
      continue;
    }
    if (token === '--runtime' && args[index + 1]) {
      opts.runtime = args[index + 1];
      index++;
      continue;
    }
    if (!loop) {
      loop = token;
    }
  }

  return { loop, opts };
}

function cmdMeasurementReport(cwd, args, raw) {
  const { loop, opts } = parseReportArgs(args);
  if (!loop) {
    return { error: `Usage: gsd-tools measurement report <loop>. Known loops: ${LOOP_KEYS.join(', ')}` };
  }

  if (!LOOP_KEYS.includes(loop)) {
    return { error: `Unknown loop "${loop}". Known: ${LOOP_KEYS.join(', ')}` };
  }

  const queryResult = queryMeasurement(cwd, {
    question: loop,
    runtime: opts.runtime,
    scope: 'project',
  });

  if (raw) return queryResult;

  return {
    __text: renderLoopReport(loop, queryResult, opts),
  };
}

module.exports = {
  cmdMeasurementReport,
  parseReportArgs,
  renderLoopReport,
};
