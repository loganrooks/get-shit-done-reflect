/**
 * Verify — Verification suite, consistency, and health validation
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { safeReadFile, loadConfig, normalizePhaseName, escapeRegex, execGit, findPhaseInternal, getMilestoneInfo, stripShippedMilestones, extractCurrentMilestone, planningDir, planningRoot, output, error, checkAgentsInstalled, CONFIG_DEFAULTS } = require('./core.cjs');
const { extractFrontmatter, parseMustHavesBlock } = require('./frontmatter.cjs');
const { writeStateMd } = require('./state.cjs');

function cmdVerifySummary(cwd, summaryPath, checkFileCount, raw) {
  if (!summaryPath) {
    error('summary-path required');
  }

  const fullPath = path.join(cwd, summaryPath);
  const checkCount = checkFileCount || 2;

  // Check 1: Summary exists
  if (!fs.existsSync(fullPath)) {
    const result = {
      passed: false,
      checks: {
        summary_exists: false,
        files_created: { checked: 0, found: 0, missing: [] },
        commits_exist: false,
        self_check: 'not_found',
      },
      errors: ['SUMMARY.md not found'],
    };
    output(result, raw, 'failed');
    return;
  }

  const content = fs.readFileSync(fullPath, 'utf-8');
  const errors = [];

  // Check 2: Spot-check files mentioned in summary
  const mentionedFiles = new Set();
  const patterns = [
    /`([^`]+\.[a-zA-Z]+)`/g,
    /(?:Created|Modified|Added|Updated|Edited):\s*`?([^\s`]+\.[a-zA-Z]+)`?/gi,
  ];

  for (const pattern of patterns) {
    let m;
    while ((m = pattern.exec(content)) !== null) {
      const filePath = m[1];
      if (filePath && !filePath.startsWith('http') && filePath.includes('/')) {
        mentionedFiles.add(filePath);
      }
    }
  }

  const filesToCheck = Array.from(mentionedFiles).slice(0, checkCount);
  const missing = [];
  for (const file of filesToCheck) {
    if (!fs.existsSync(path.join(cwd, file))) {
      missing.push(file);
    }
  }

  // Check 3: Commits exist
  const commitHashPattern = /\b[0-9a-f]{7,40}\b/g;
  const hashes = content.match(commitHashPattern) || [];
  let commitsExist = false;
  if (hashes.length > 0) {
    for (const hash of hashes.slice(0, 3)) {
      const result = execGit(cwd, ['cat-file', '-t', hash]);
      if (result.exitCode === 0 && result.stdout === 'commit') {
        commitsExist = true;
        break;
      }
    }
  }

  // Check 4: Self-check section
  let selfCheck = 'not_found';
  const selfCheckPattern = /##\s*(?:Self[- ]?Check|Verification|Quality Check)/i;
  if (selfCheckPattern.test(content)) {
    const passPattern = /(?:all\s+)?(?:pass|✓|✅|complete|succeeded)/i;
    const failPattern = /(?:fail|✗|❌|incomplete|blocked)/i;
    const checkSection = content.slice(content.search(selfCheckPattern));
    if (failPattern.test(checkSection)) {
      selfCheck = 'failed';
    } else if (passPattern.test(checkSection)) {
      selfCheck = 'passed';
    }
  }

  if (missing.length > 0) errors.push('Missing files: ' + missing.join(', '));
  if (!commitsExist && hashes.length > 0) errors.push('Referenced commit hashes not found in git history');
  if (selfCheck === 'failed') errors.push('Self-check section indicates failure');

  const checks = {
    summary_exists: true,
    files_created: { checked: filesToCheck.length, found: filesToCheck.length - missing.length, missing },
    commits_exist: commitsExist,
    self_check: selfCheck,
  };

  const passed = missing.length === 0 && selfCheck !== 'failed';
  const result = { passed, checks, errors };
  output(result, raw, passed ? 'passed' : 'failed');
}

function cmdVerifyPlanStructure(cwd, filePath, raw) {
  if (!filePath) { error('file path required'); }
  const fullPath = path.isAbsolute(filePath) ? filePath : path.join(cwd, filePath);
  const content = safeReadFile(fullPath);
  if (!content) { output({ error: 'File not found', path: filePath }, raw); return; }

  const fm = extractFrontmatter(content);
  const errors = [];
  const warnings = [];

  // Check required frontmatter fields
  const required = ['phase', 'plan', 'type', 'wave', 'depends_on', 'files_modified', 'autonomous', 'must_haves'];
  for (const field of required) {
    if (fm[field] === undefined) errors.push(`Missing required frontmatter field: ${field}`);
  }

  // Parse and check task elements
  const taskPattern = /<task[^>]*>([\s\S]*?)<\/task>/g;
  const tasks = [];
  let taskMatch;
  while ((taskMatch = taskPattern.exec(content)) !== null) {
    const taskContent = taskMatch[1];
    const nameMatch = taskContent.match(/<name>([\s\S]*?)<\/name>/);
    const taskName = nameMatch ? nameMatch[1].trim() : 'unnamed';
    const hasFiles = /<files>/.test(taskContent);
    const hasAction = /<action>/.test(taskContent);
    const hasVerify = /<verify>/.test(taskContent);
    const hasDone = /<done>/.test(taskContent);

    if (!nameMatch) errors.push('Task missing <name> element');
    if (!hasAction) errors.push(`Task '${taskName}' missing <action>`);
    if (!hasVerify) warnings.push(`Task '${taskName}' missing <verify>`);
    if (!hasDone) warnings.push(`Task '${taskName}' missing <done>`);
    if (!hasFiles) warnings.push(`Task '${taskName}' missing <files>`);

    tasks.push({ name: taskName, hasFiles, hasAction, hasVerify, hasDone });
  }

  if (tasks.length === 0) warnings.push('No <task> elements found');

  // Wave/depends_on consistency
  if (fm.wave && parseInt(fm.wave) > 1 && (!fm.depends_on || (Array.isArray(fm.depends_on) && fm.depends_on.length === 0))) {
    warnings.push('Wave > 1 but depends_on is empty');
  }

  // Autonomous/checkpoint consistency
  const hasCheckpoints = /<task\s+type=["']?checkpoint/.test(content);
  if (hasCheckpoints && fm.autonomous !== 'false' && fm.autonomous !== false) {
    errors.push('Has checkpoint tasks but autonomous is not false');
  }

  output({
    valid: errors.length === 0,
    errors,
    warnings,
    task_count: tasks.length,
    tasks,
    frontmatter_fields: Object.keys(fm),
  }, raw, errors.length === 0 ? 'valid' : 'invalid');
}

function cmdVerifyPhaseCompleteness(cwd, phase, raw) {
  if (!phase) { error('phase required'); }
  const phaseInfo = findPhaseInternal(cwd, phase);
  if (!phaseInfo || !phaseInfo.found) {
    output({ error: 'Phase not found', phase }, raw);
    return;
  }

  const errors = [];
  const warnings = [];
  const phaseDir = path.join(cwd, phaseInfo.directory);

  // List plans and summaries
  let files;
  try { files = fs.readdirSync(phaseDir); } catch { output({ error: 'Cannot read phase directory' }, raw); return; }

  const plans = files.filter(f => f.match(/-PLAN\.md$/i));
  const summaries = files.filter(f => f.match(/-SUMMARY\.md$/i));

  // Extract plan IDs (everything before -PLAN.md)
  const planIds = new Set(plans.map(p => p.replace(/-PLAN\.md$/i, '')));
  const summaryIds = new Set(summaries.map(s => s.replace(/-SUMMARY\.md$/i, '')));

  // Plans without summaries
  const incompletePlans = [...planIds].filter(id => !summaryIds.has(id));
  if (incompletePlans.length > 0) {
    errors.push(`Plans without summaries: ${incompletePlans.join(', ')}`);
  }

  // Summaries without plans (orphans)
  const orphanSummaries = [...summaryIds].filter(id => !planIds.has(id));
  if (orphanSummaries.length > 0) {
    warnings.push(`Summaries without plans: ${orphanSummaries.join(', ')}`);
  }

  output({
    complete: errors.length === 0,
    phase: phaseInfo.phase_number,
    plan_count: plans.length,
    summary_count: summaries.length,
    incomplete_plans: incompletePlans,
    orphan_summaries: orphanSummaries,
    errors,
    warnings,
  }, raw, errors.length === 0 ? 'complete' : 'incomplete');
}

function cmdVerifyReferences(cwd, filePath, raw) {
  if (!filePath) { error('file path required'); }
  const fullPath = path.isAbsolute(filePath) ? filePath : path.join(cwd, filePath);
  const content = safeReadFile(fullPath);
  if (!content) { output({ error: 'File not found', path: filePath }, raw); return; }

  const found = [];
  const missing = [];

  // Find @-references: @path/to/file (must contain / to be a file path)
  const atRefs = content.match(/@([^\s\n,)]+\/[^\s\n,)]+)/g) || [];
  for (const ref of atRefs) {
    const cleanRef = ref.slice(1); // remove @
    const resolved = cleanRef.startsWith('~/')
      ? path.join(process.env.HOME || '', cleanRef.slice(2))
      : path.join(cwd, cleanRef);
    if (fs.existsSync(resolved)) {
      found.push(cleanRef);
    } else {
      missing.push(cleanRef);
    }
  }

  // Find backtick file paths that look like real paths (contain / and have extension)
  const backtickRefs = content.match(/`([^`]+\/[^`]+\.[a-zA-Z]{1,10})`/g) || [];
  for (const ref of backtickRefs) {
    const cleanRef = ref.slice(1, -1); // remove backticks
    if (cleanRef.startsWith('http') || cleanRef.includes('${') || cleanRef.includes('{{')) continue;
    if (found.includes(cleanRef) || missing.includes(cleanRef)) continue; // dedup
    const resolved = path.join(cwd, cleanRef);
    if (fs.existsSync(resolved)) {
      found.push(cleanRef);
    } else {
      missing.push(cleanRef);
    }
  }

  output({
    valid: missing.length === 0,
    found: found.length,
    missing,
    total: found.length + missing.length,
  }, raw, missing.length === 0 ? 'valid' : 'invalid');
}

function cmdVerifyCommits(cwd, hashes, raw) {
  if (!hashes || hashes.length === 0) { error('At least one commit hash required'); }

  const valid = [];
  const invalid = [];
  for (const hash of hashes) {
    const result = execGit(cwd, ['cat-file', '-t', hash]);
    if (result.exitCode === 0 && result.stdout.trim() === 'commit') {
      valid.push(hash);
    } else {
      invalid.push(hash);
    }
  }

  output({
    all_valid: invalid.length === 0,
    valid,
    invalid,
    total: hashes.length,
  }, raw, invalid.length === 0 ? 'valid' : 'invalid');
}

function cmdVerifyArtifacts(cwd, planFilePath, raw) {
  if (!planFilePath) { error('plan file path required'); }
  const fullPath = path.isAbsolute(planFilePath) ? planFilePath : path.join(cwd, planFilePath);
  const content = safeReadFile(fullPath);
  if (!content) { output({ error: 'File not found', path: planFilePath }, raw); return; }

  const artifacts = parseMustHavesBlock(content, 'artifacts');
  if (artifacts.length === 0) {
    output({ error: 'No must_haves.artifacts found in frontmatter', path: planFilePath }, raw);
    return;
  }

  const results = [];
  for (const artifact of artifacts) {
    if (typeof artifact === 'string') continue; // skip simple string items
    const artPath = artifact.path;
    if (!artPath) continue;

    const artFullPath = path.join(cwd, artPath);
    const exists = fs.existsSync(artFullPath);
    const check = { path: artPath, exists, issues: [], passed: false };

    if (exists) {
      const fileContent = safeReadFile(artFullPath) || '';
      const lineCount = fileContent.split('\n').length;

      if (artifact.min_lines && lineCount < artifact.min_lines) {
        check.issues.push(`Only ${lineCount} lines, need ${artifact.min_lines}`);
      }
      if (artifact.contains && !fileContent.includes(artifact.contains)) {
        check.issues.push(`Missing pattern: ${artifact.contains}`);
      }
      if (artifact.exports) {
        const exports = Array.isArray(artifact.exports) ? artifact.exports : [artifact.exports];
        for (const exp of exports) {
          if (!fileContent.includes(exp)) check.issues.push(`Missing export: ${exp}`);
        }
      }
      check.passed = check.issues.length === 0;
    } else {
      check.issues.push('File not found');
    }

    results.push(check);
  }

  const passed = results.filter(r => r.passed).length;
  output({
    all_passed: passed === results.length,
    passed,
    total: results.length,
    artifacts: results,
  }, raw, passed === results.length ? 'valid' : 'invalid');
}

function cmdVerifyKeyLinks(cwd, planFilePath, raw) {
  if (!planFilePath) { error('plan file path required'); }
  const fullPath = path.isAbsolute(planFilePath) ? planFilePath : path.join(cwd, planFilePath);
  const content = safeReadFile(fullPath);
  if (!content) { output({ error: 'File not found', path: planFilePath }, raw); return; }

  const keyLinks = parseMustHavesBlock(content, 'key_links');
  if (keyLinks.length === 0) {
    output({ error: 'No must_haves.key_links found in frontmatter', path: planFilePath }, raw);
    return;
  }

  const results = [];
  for (const link of keyLinks) {
    if (typeof link === 'string') continue;
    const check = { from: link.from, to: link.to, via: link.via || '', verified: false, detail: '' };

    const sourceContent = safeReadFile(path.join(cwd, link.from || ''));
    if (!sourceContent) {
      check.detail = 'Source file not found';
    } else if (link.pattern) {
      try {
        const regex = new RegExp(link.pattern);
        if (regex.test(sourceContent)) {
          check.verified = true;
          check.detail = 'Pattern found in source';
        } else {
          const targetContent = safeReadFile(path.join(cwd, link.to || ''));
          if (targetContent && regex.test(targetContent)) {
            check.verified = true;
            check.detail = 'Pattern found in target';
          } else {
            check.detail = `Pattern "${link.pattern}" not found in source or target`;
          }
        }
      } catch {
        check.detail = `Invalid regex pattern: ${link.pattern}`;
      }
    } else {
      // No pattern: just check source references target
      if (sourceContent.includes(link.to || '')) {
        check.verified = true;
        check.detail = 'Target referenced in source';
      } else {
        check.detail = 'Target not referenced in source';
      }
    }

    results.push(check);
  }

  const verified = results.filter(r => r.verified).length;
  output({
    all_verified: verified === results.length,
    verified,
    total: results.length,
    links: results,
  }, raw, verified === results.length ? 'valid' : 'invalid');
}

function cmdValidateConsistency(cwd, raw) {
  const roadmapPath = path.join(planningDir(cwd), 'ROADMAP.md');
  const phasesDir = path.join(planningDir(cwd), 'phases');
  const errors = [];
  const warnings = [];

  // Check for ROADMAP
  if (!fs.existsSync(roadmapPath)) {
    errors.push('ROADMAP.md not found');
    output({ passed: false, errors, warnings }, raw, 'failed');
    return;
  }

  const roadmapContentRaw = fs.readFileSync(roadmapPath, 'utf-8');
  const roadmapContent = extractCurrentMilestone(roadmapContentRaw, cwd);

  // Extract phases from ROADMAP (archived milestones already stripped)
  const roadmapPhases = new Set();
  const phasePattern = /#{2,4}\s*Phase\s+(\d+[A-Z]?(?:\.\d+)*)\s*:/gi;
  let m;
  while ((m = phasePattern.exec(roadmapContent)) !== null) {
    roadmapPhases.add(m[1]);
  }

  // Get phases on disk
  const diskPhases = new Set();
  try {
    const entries = fs.readdirSync(phasesDir, { withFileTypes: true });
    const dirs = entries.filter(e => e.isDirectory()).map(e => e.name);
    for (const dir of dirs) {
      const dm = dir.match(/^(\d+[A-Z]?(?:\.\d+)*)/i);
      if (dm) diskPhases.add(dm[1]);
    }
  } catch { /* intentionally empty */ }

  // Check: phases in ROADMAP but not on disk
  for (const p of roadmapPhases) {
    if (!diskPhases.has(p) && !diskPhases.has(normalizePhaseName(p))) {
      warnings.push(`Phase ${p} in ROADMAP.md but no directory on disk`);
    }
  }

  // Check: phases on disk but not in ROADMAP
  for (const p of diskPhases) {
    const unpadded = String(parseInt(p, 10));
    if (!roadmapPhases.has(p) && !roadmapPhases.has(unpadded)) {
      warnings.push(`Phase ${p} exists on disk but not in ROADMAP.md`);
    }
  }

  // Check: sequential phase numbers (integers only, skip in custom naming mode)
  const config = loadConfig(cwd);
  if (config.phase_naming !== 'custom') {
    const integerPhases = [...diskPhases]
      .filter(p => !p.includes('.'))
      .map(p => parseInt(p, 10))
      .sort((a, b) => a - b);

    for (let i = 1; i < integerPhases.length; i++) {
      if (integerPhases[i] !== integerPhases[i - 1] + 1) {
        warnings.push(`Gap in phase numbering: ${integerPhases[i - 1]} → ${integerPhases[i]}`);
      }
    }
  }

  // Check: plan numbering within phases
  try {
    const entries = fs.readdirSync(phasesDir, { withFileTypes: true });
    const dirs = entries.filter(e => e.isDirectory()).map(e => e.name).sort();

    for (const dir of dirs) {
      const phaseFiles = fs.readdirSync(path.join(phasesDir, dir));
      const plans = phaseFiles.filter(f => f.endsWith('-PLAN.md')).sort();

      // Extract plan numbers
      const planNums = plans.map(p => {
        const pm = p.match(/-(\d{2})-PLAN\.md$/);
        return pm ? parseInt(pm[1], 10) : null;
      }).filter(n => n !== null);

      for (let i = 1; i < planNums.length; i++) {
        if (planNums[i] !== planNums[i - 1] + 1) {
          warnings.push(`Gap in plan numbering in ${dir}: plan ${planNums[i - 1]} → ${planNums[i]}`);
        }
      }

      // Check: plans without summaries (completed plans)
      const summaries = phaseFiles.filter(f => f.endsWith('-SUMMARY.md'));
      const planIds = new Set(plans.map(p => p.replace('-PLAN.md', '')));
      const summaryIds = new Set(summaries.map(s => s.replace('-SUMMARY.md', '')));

      // Summary without matching plan is suspicious
      for (const sid of summaryIds) {
        if (!planIds.has(sid)) {
          warnings.push(`Summary ${sid}-SUMMARY.md in ${dir} has no matching PLAN.md`);
        }
      }
    }
  } catch { /* intentionally empty */ }

  // Check: frontmatter in plans has required fields
  try {
    const entries = fs.readdirSync(phasesDir, { withFileTypes: true });
    const dirs = entries.filter(e => e.isDirectory()).map(e => e.name);

    for (const dir of dirs) {
      const phaseFiles = fs.readdirSync(path.join(phasesDir, dir));
      const plans = phaseFiles.filter(f => f.endsWith('-PLAN.md'));

      for (const plan of plans) {
        const content = fs.readFileSync(path.join(phasesDir, dir, plan), 'utf-8');
        const fm = extractFrontmatter(content);

        if (!fm.wave) {
          warnings.push(`${dir}/${plan}: missing 'wave' in frontmatter`);
        }
      }
    }
  } catch { /* intentionally empty */ }

  const passed = errors.length === 0;
  output({ passed, errors, warnings, warning_count: warnings.length }, raw, passed ? 'passed' : 'failed');
}

function cmdValidateHealth(cwd, options, raw) {
  // Guard: detect if CWD is the home directory (likely accidental)
  const resolved = path.resolve(cwd);
  if (resolved === os.homedir()) {
    output({
      status: 'error',
      errors: [{ code: 'E010', message: `CWD is home directory (${resolved}) — health check would read the wrong .planning/ directory. Run from your project root instead.`, fix: 'cd into your project directory and retry' }],
      warnings: [],
      info: [{ code: 'I010', message: `Resolved CWD: ${resolved}` }],
      repairable_count: 0,
    }, raw);
    return;
  }

  const planBase = planningDir(cwd);
  const planRoot = planningRoot(cwd);
  const projectPath = path.join(planRoot, 'PROJECT.md');
  const roadmapPath = path.join(planBase, 'ROADMAP.md');
  const statePath = path.join(planBase, 'STATE.md');
  const configPath = path.join(planRoot, 'config.json');
  const phasesDir = path.join(planBase, 'phases');

  const errors = [];
  const warnings = [];
  const info = [];
  const repairs = [];

  // Helper to add issue
  const addIssue = (severity, code, message, fix, repairable = false) => {
    const issue = { code, message, fix, repairable };
    if (severity === 'error') errors.push(issue);
    else if (severity === 'warning') warnings.push(issue);
    else info.push(issue);
  };

  // ─── Check 1: .planning/ exists ───────────────────────────────────────────
  if (!fs.existsSync(planBase)) {
    addIssue('error', 'E001', '.planning/ directory not found', 'Run /gsd-new-project to initialize');
    output({
      status: 'broken',
      errors,
      warnings,
      info,
      repairable_count: 0,
    }, raw);
    return;
  }

  // ─── Check 2: PROJECT.md exists and has required sections ─────────────────
  if (!fs.existsSync(projectPath)) {
    addIssue('error', 'E002', 'PROJECT.md not found', 'Run /gsd-new-project to create');
  } else {
    const content = fs.readFileSync(projectPath, 'utf-8');
    const requiredSections = ['## What This Is', '## Core Value', '## Requirements'];
    for (const section of requiredSections) {
      if (!content.includes(section)) {
        addIssue('warning', 'W001', `PROJECT.md missing section: ${section}`, 'Add section manually');
      }
    }
  }

  // ─── Check 3: ROADMAP.md exists ───────────────────────────────────────────
  if (!fs.existsSync(roadmapPath)) {
    addIssue('error', 'E003', 'ROADMAP.md not found', 'Run /gsd-new-milestone to create roadmap');
  }

  // ─── Check 4: STATE.md exists and references valid phases ─────────────────
  if (!fs.existsSync(statePath)) {
    addIssue('error', 'E004', 'STATE.md not found', 'Run /gsd-health --repair to regenerate', true);
    repairs.push('regenerateState');
  } else {
    const stateContent = fs.readFileSync(statePath, 'utf-8');
    // Extract phase references from STATE.md
    const phaseRefs = [...stateContent.matchAll(/[Pp]hase\s+(\d+(?:\.\d+)*)/g)].map(m => m[1]);
    // Get disk phases
    const diskPhases = new Set();
    try {
      const entries = fs.readdirSync(phasesDir, { withFileTypes: true });
      for (const e of entries) {
        if (e.isDirectory()) {
          const m = e.name.match(/^(\d+(?:\.\d+)*)/);
          if (m) diskPhases.add(m[1]);
        }
      }
    } catch { /* intentionally empty */ }
    // Check for invalid references
    for (const ref of phaseRefs) {
      const normalizedRef = String(parseInt(ref, 10)).padStart(2, '0');
      if (!diskPhases.has(ref) && !diskPhases.has(normalizedRef) && !diskPhases.has(String(parseInt(ref, 10)))) {
        // Only warn if phases dir has any content (not just an empty project)
        if (diskPhases.size > 0) {
          addIssue(
            'warning',
            'W002',
            `STATE.md references phase ${ref}, but only phases ${[...diskPhases].sort().join(', ')} exist`,
            'Review STATE.md manually before changing it; /gsd-health --repair will not overwrite an existing STATE.md for phase mismatches'
          );
        }
      }
    }
  }

  // ─── Check 5: config.json valid JSON + valid schema ───────────────────────
  if (!fs.existsSync(configPath)) {
    addIssue('warning', 'W003', 'config.json not found', 'Run /gsd-health --repair to create with defaults', true);
    repairs.push('createConfig');
  } else {
    try {
      const raw = fs.readFileSync(configPath, 'utf-8');
      const parsed = JSON.parse(raw);
      // Validate known fields
      const validProfiles = ['quality', 'balanced', 'budget', 'inherit'];
      if (parsed.model_profile && !validProfiles.includes(parsed.model_profile)) {
        addIssue('warning', 'W004', `config.json: invalid model_profile "${parsed.model_profile}"`, `Valid values: ${validProfiles.join(', ')}`);
      }
    } catch (err) {
      addIssue('error', 'E005', `config.json: JSON parse error - ${err.message}`, 'Run /gsd-health --repair to reset to defaults', true);
      repairs.push('resetConfig');
    }
  }

  // ─── Check 5b: Nyquist validation key presence ──────────────────────────
  if (fs.existsSync(configPath)) {
    try {
      const configRaw = fs.readFileSync(configPath, 'utf-8');
      const configParsed = JSON.parse(configRaw);
      if (configParsed.workflow && configParsed.workflow.nyquist_validation === undefined) {
        addIssue('warning', 'W008', 'config.json: workflow.nyquist_validation absent (defaults to enabled but agents may skip)', 'Run /gsd-health --repair to add key', true);
        if (!repairs.includes('addNyquistKey')) repairs.push('addNyquistKey');
      }
    } catch { /* intentionally empty */ }
  }

  // ─── Check 6: Phase directory naming (NN-name format) ─────────────────────
  try {
    const entries = fs.readdirSync(phasesDir, { withFileTypes: true });
    for (const e of entries) {
      if (e.isDirectory() && !e.name.match(/^\d{2}(?:\.\d+)*-[\w-]+$/)) {
        addIssue('warning', 'W005', `Phase directory "${e.name}" doesn't follow NN-name format`, 'Rename to match pattern (e.g., 01-setup)');
      }
    }
  } catch { /* intentionally empty */ }

  // ─── Check 7: Orphaned plans (PLAN without SUMMARY) ───────────────────────
  try {
    const entries = fs.readdirSync(phasesDir, { withFileTypes: true });
    for (const e of entries) {
      if (!e.isDirectory()) continue;
      const phaseFiles = fs.readdirSync(path.join(phasesDir, e.name));
      const plans = phaseFiles.filter(f => f.endsWith('-PLAN.md') || f === 'PLAN.md');
      const summaries = phaseFiles.filter(f => f.endsWith('-SUMMARY.md') || f === 'SUMMARY.md');
      const summaryBases = new Set(summaries.map(s => s.replace('-SUMMARY.md', '').replace('SUMMARY.md', '')));

      for (const plan of plans) {
        const planBase = plan.replace('-PLAN.md', '').replace('PLAN.md', '');
        if (!summaryBases.has(planBase)) {
          addIssue('info', 'I001', `${e.name}/${plan} has no SUMMARY.md`, 'May be in progress');
        }
      }
    }
  } catch { /* intentionally empty */ }

  // ─── Check 7b: Nyquist VALIDATION.md consistency ────────────────────────
  try {
    const phaseEntries = fs.readdirSync(phasesDir, { withFileTypes: true });
    for (const e of phaseEntries) {
      if (!e.isDirectory()) continue;
      const phaseFiles = fs.readdirSync(path.join(phasesDir, e.name));
      const hasResearch = phaseFiles.some(f => f.endsWith('-RESEARCH.md'));
      const hasValidation = phaseFiles.some(f => f.endsWith('-VALIDATION.md'));
      if (hasResearch && !hasValidation) {
        const researchFile = phaseFiles.find(f => f.endsWith('-RESEARCH.md'));
        const researchContent = fs.readFileSync(path.join(phasesDir, e.name, researchFile), 'utf-8');
        if (researchContent.includes('## Validation Architecture')) {
          addIssue('warning', 'W009', `Phase ${e.name}: has Validation Architecture in RESEARCH.md but no VALIDATION.md`, 'Re-run /gsd-plan-phase with --research to regenerate');
        }
      }
    }
  } catch { /* intentionally empty */ }

  // ─── Check 7c: Agent installation (#1371) ──────────────────────────────────
  // Verify GSD agents are installed. Missing agents cause Task(subagent_type=...)
  // to silently fall back to general-purpose, losing specialized instructions.
  try {
    const agentStatus = checkAgentsInstalled();
    if (!agentStatus.agents_installed) {
      if (agentStatus.installed_agents.length === 0) {
        addIssue('warning', 'W010',
          `No GSD agents found in ${agentStatus.agents_dir} — Task(subagent_type="gsd-*") will fall back to general-purpose`,
          'Run the GSD installer: npx get-shit-done-cc@latest');
      } else {
        addIssue('warning', 'W010',
          `Missing ${agentStatus.missing_agents.length} GSD agents: ${agentStatus.missing_agents.join(', ')} — affected workflows will fall back to general-purpose`,
          'Run the GSD installer: npx get-shit-done-cc@latest');
      }
    }
  } catch { /* intentionally empty — agent check is non-blocking */ }

  // ─── Check 8: Run existing consistency checks ─────────────────────────────
  // Inline subset of cmdValidateConsistency
  if (fs.existsSync(roadmapPath)) {
    const roadmapContentRaw = fs.readFileSync(roadmapPath, 'utf-8');
    const roadmapContent = extractCurrentMilestone(roadmapContentRaw, cwd);
    const roadmapPhases = new Set();
    const phasePattern = /#{2,4}\s*Phase\s+(\d+[A-Z]?(?:\.\d+)*)\s*:/gi;
    let m;
    while ((m = phasePattern.exec(roadmapContent)) !== null) {
      roadmapPhases.add(m[1]);
    }

    const diskPhases = new Set();
    try {
      const entries = fs.readdirSync(phasesDir, { withFileTypes: true });
      for (const e of entries) {
        if (e.isDirectory()) {
          const dm = e.name.match(/^(\d+[A-Z]?(?:\.\d+)*)/i);
          if (dm) diskPhases.add(dm[1]);
        }
      }
    } catch { /* intentionally empty */ }

    // Phases in ROADMAP but not on disk
    for (const p of roadmapPhases) {
      const padded = String(parseInt(p, 10)).padStart(2, '0');
      if (!diskPhases.has(p) && !diskPhases.has(padded)) {
        addIssue('warning', 'W006', `Phase ${p} in ROADMAP.md but no directory on disk`, 'Create phase directory or remove from roadmap');
      }
    }

    // Phases on disk but not in ROADMAP
    for (const p of diskPhases) {
      const unpadded = String(parseInt(p, 10));
      if (!roadmapPhases.has(p) && !roadmapPhases.has(unpadded)) {
        addIssue('warning', 'W007', `Phase ${p} exists on disk but not in ROADMAP.md`, 'Add to roadmap or remove directory');
      }
    }
  }

  // ─── Check 9: STATE.md / ROADMAP.md cross-validation ─────────────────────
  if (fs.existsSync(statePath) && fs.existsSync(roadmapPath)) {
    try {
      const stateContent = fs.readFileSync(statePath, 'utf-8');
      const roadmapContentFull = fs.readFileSync(roadmapPath, 'utf-8');

      // Extract current phase from STATE.md
      const currentPhaseMatch = stateContent.match(/\*\*Current Phase:\*\*\s*(\S+)/i) ||
                                 stateContent.match(/Current Phase:\s*(\S+)/i);
      if (currentPhaseMatch) {
        const statePhase = currentPhaseMatch[1].replace(/^0+/, '');
        // Check if ROADMAP shows this phase as already complete
        const phaseCheckboxRe = new RegExp(`-\\s*\\[x\\].*Phase\\s+0*${escapeRegex(statePhase)}[:\\s]`, 'i');
        if (phaseCheckboxRe.test(roadmapContentFull)) {
          // STATE says "current" but ROADMAP says "complete" — divergence
          const stateStatus = stateContent.match(/\*\*Status:\*\*\s*(.+)/i);
          const statusVal = stateStatus ? stateStatus[1].trim().toLowerCase() : '';
          if (statusVal !== 'complete' && statusVal !== 'done') {
            addIssue('warning', 'W011',
              `STATE.md says current phase is ${statePhase} (status: ${statusVal || 'unknown'}) but ROADMAP.md shows it as [x] complete — state files may be out of sync`,
              'Run /gsd-progress to re-derive current position, or manually update STATE.md');
          }
        }
      }
    } catch { /* intentionally empty — cross-validation is advisory */ }
  }

  // ─── Check 10: Config field validation ────────────────────────────────────
  if (fs.existsSync(configPath)) {
    try {
      const configRaw = fs.readFileSync(configPath, 'utf-8');
      const configParsed = JSON.parse(configRaw);

      // Validate branching_strategy
      const validStrategies = ['none', 'phase', 'milestone'];
      if (configParsed.branching_strategy && !validStrategies.includes(configParsed.branching_strategy)) {
        addIssue('warning', 'W012',
          `config.json: invalid branching_strategy "${configParsed.branching_strategy}"`,
          `Valid values: ${validStrategies.join(', ')}`);
      }

      // Validate context_window is a positive integer
      if (configParsed.context_window !== undefined) {
        const cw = configParsed.context_window;
        if (typeof cw !== 'number' || cw <= 0 || !Number.isInteger(cw)) {
          addIssue('warning', 'W013',
            `config.json: context_window should be a positive integer, got "${cw}"`,
            'Set to 200000 (default) or 1000000 (for 1M models)');
        }
      }

      // Validate branch templates have required placeholders
      if (configParsed.phase_branch_template && !configParsed.phase_branch_template.includes('{phase}')) {
        addIssue('warning', 'W014',
          'config.json: phase_branch_template missing {phase} placeholder',
          'Template must include {phase} for phase number substitution');
      }
      if (configParsed.milestone_branch_template && !configParsed.milestone_branch_template.includes('{milestone}')) {
        addIssue('warning', 'W015',
          'config.json: milestone_branch_template missing {milestone} placeholder',
          'Template must include {milestone} for version substitution');
      }
    } catch { /* parse error already caught in Check 5 */ }
  }

  // ─── Perform repairs if requested ─────────────────────────────────────────
  const repairActions = [];
  if (options.repair && repairs.length > 0) {
    for (const repair of repairs) {
      try {
        switch (repair) {
          case 'createConfig':
          case 'resetConfig': {
            const defaults = {
              model_profile: CONFIG_DEFAULTS.model_profile,
              commit_docs: CONFIG_DEFAULTS.commit_docs,
              search_gitignored: CONFIG_DEFAULTS.search_gitignored,
              branching_strategy: CONFIG_DEFAULTS.branching_strategy,
              phase_branch_template: CONFIG_DEFAULTS.phase_branch_template,
              milestone_branch_template: CONFIG_DEFAULTS.milestone_branch_template,
              quick_branch_template: CONFIG_DEFAULTS.quick_branch_template,
              workflow: {
                research: CONFIG_DEFAULTS.research,
                plan_check: CONFIG_DEFAULTS.plan_checker,
                verifier: CONFIG_DEFAULTS.verifier,
                nyquist_validation: CONFIG_DEFAULTS.nyquist_validation,
              },
              parallelization: CONFIG_DEFAULTS.parallelization,
              brave_search: CONFIG_DEFAULTS.brave_search,
            };
            fs.writeFileSync(configPath, JSON.stringify(defaults, null, 2), 'utf-8');
            repairActions.push({ action: repair, success: true, path: 'config.json' });
            break;
          }
          case 'regenerateState': {
            // Create timestamped backup before overwriting
            if (fs.existsSync(statePath)) {
              const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
              const backupPath = `${statePath}.bak-${timestamp}`;
              fs.copyFileSync(statePath, backupPath);
              repairActions.push({ action: 'backupState', success: true, path: backupPath });
            }
            // Generate minimal STATE.md from ROADMAP.md structure
            const milestone = getMilestoneInfo(cwd);
            let stateContent = `# Session State\n\n`;
            stateContent += `## Project Reference\n\n`;
            stateContent += `See: .planning/PROJECT.md\n\n`;
            stateContent += `## Position\n\n`;
            stateContent += `**Milestone:** ${milestone.version} ${milestone.name}\n`;
            stateContent += `**Current phase:** (determining...)\n`;
            stateContent += `**Status:** Resuming\n\n`;
            stateContent += `## Session Log\n\n`;
            stateContent += `- ${new Date().toISOString().split('T')[0]}: STATE.md regenerated by /gsd-health --repair\n`;
            writeStateMd(statePath, stateContent, cwd);
            repairActions.push({ action: repair, success: true, path: 'STATE.md' });
            break;
          }
          case 'addNyquistKey': {
            if (fs.existsSync(configPath)) {
              try {
                const configRaw = fs.readFileSync(configPath, 'utf-8');
                const configParsed = JSON.parse(configRaw);
                if (!configParsed.workflow) configParsed.workflow = {};
                if (configParsed.workflow.nyquist_validation === undefined) {
                  configParsed.workflow.nyquist_validation = true;
                  fs.writeFileSync(configPath, JSON.stringify(configParsed, null, 2), 'utf-8');
                }
                repairActions.push({ action: repair, success: true, path: 'config.json' });
              } catch (err) {
                repairActions.push({ action: repair, success: false, error: err.message });
              }
            }
            break;
          }
        }
      } catch (err) {
        repairActions.push({ action: repair, success: false, error: err.message });
      }
    }
  }

  // ─── Determine overall status ─────────────────────────────────────────────
  let status;
  if (errors.length > 0) {
    status = 'broken';
  } else if (warnings.length > 0) {
    status = 'degraded';
  } else {
    status = 'healthy';
  }

  const repairableCount = errors.filter(e => e.repairable).length +
                         warnings.filter(w => w.repairable).length;

  output({
    status,
    errors,
    warnings,
    info,
    repairable_count: repairableCount,
    repairs_performed: repairActions.length > 0 ? repairActions : undefined,
  }, raw);
}

/**
 * Validate agent installation status (#1371).
 * Returns detailed information about which agents are installed and which are missing.
 */
function cmdValidateAgents(cwd, raw) {
  const { MODEL_PROFILES } = require('./model-profiles.cjs');
  const agentStatus = checkAgentsInstalled();
  const expected = Object.keys(MODEL_PROFILES);

  output({
    agents_dir: agentStatus.agents_dir,
    agents_found: agentStatus.agents_installed,
    installed: agentStatus.installed_agents,
    missing: agentStatus.missing_agents,
    expected,
  }, raw);
}

// ─── Schema Drift Detection ──────────────────────────────────────────────────

function cmdVerifySchemaDrift(cwd, phaseArg, skipFlag, raw) {
  const { detectSchemaFiles, checkSchemaDrift } = require('./schema-detect.cjs');

  if (!phaseArg) {
    error('Usage: verify schema-drift <phase> [--skip]');
    return;
  }

  // Find phase directory
  const pDir = planningDir(cwd);
  const phasesDir = path.join(pDir, 'phases');
  if (!fs.existsSync(phasesDir)) {
    output({ drift_detected: false, blocking: false, message: 'No phases directory' }, raw);
    return;
  }

  // Find matching phase directory
  let phaseDir = null;
  const entries = fs.readdirSync(phasesDir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory() && entry.name.includes(phaseArg)) {
      phaseDir = path.join(phasesDir, entry.name);
      break;
    }
  }

  // Also try exact match
  if (!phaseDir) {
    const exact = path.join(phasesDir, phaseArg);
    if (fs.existsSync(exact)) phaseDir = exact;
  }

  if (!phaseDir) {
    output({ drift_detected: false, blocking: false, message: `Phase directory not found: ${phaseArg}` }, raw);
    return;
  }

  // Collect files_modified from all PLAN.md files in the phase
  const allFiles = [];
  const planFiles = fs.readdirSync(phaseDir).filter(f => f.endsWith('-PLAN.md'));
  for (const pf of planFiles) {
    const content = fs.readFileSync(path.join(phaseDir, pf), 'utf-8');
    // Extract files_modified from frontmatter
    const fmMatch = content.match(/files_modified:\s*\[([^\]]*)\]/);
    if (fmMatch) {
      const files = fmMatch[1].split(',').map(f => f.trim()).filter(Boolean);
      allFiles.push(...files);
    }
  }

  // Collect execution log from SUMMARY.md files
  let executionLog = '';
  const summaryFiles = fs.readdirSync(phaseDir).filter(f => f.endsWith('-SUMMARY.md'));
  for (const sf of summaryFiles) {
    executionLog += fs.readFileSync(path.join(phaseDir, sf), 'utf-8') + '\n';
  }

  // Also check git commit messages for push evidence
  const gitLog = execGit(cwd, ['log', '--oneline', '--all', '-50']);
  if (gitLog.exitCode === 0) {
    executionLog += '\n' + gitLog.stdout;
  }

  const result = checkSchemaDrift(allFiles, executionLog, { skipCheck: !!skipFlag });

  output({
    drift_detected: result.driftDetected,
    blocking: result.blocking,
    schema_files: result.schemaFiles,
    orms: result.orms,
    unpushed_orms: result.unpushedOrms,
    message: result.message,
    skipped: result.skipped || false,
  }, raw);
}

// ─── GATE-09d verifier (Phase 58 Plan 17) ────────────────────────────────────
//
// `verifyLedger({ phase, strict, includeMetaGate })` performs three structural
// checks over a phase's NN-LEDGER.md and the phase CONTEXT.md:
//
//   1. Claim-coverage (GATE-09d core): every load-bearing CONTEXT claim has
//      at least one matching ledger entry (fuzzy substring match on
//      entry.context_claim). Missing coverage → block.
//
//   2. Evidence-paths (GATE-09d core): every ledger entry with
//      disposition=implemented_this_phase has a non-empty evidence_paths[]
//      array AND every listed path exists on disk. Missing paths → block.
//
//   3. Meta-gate emission (GATE-09e embedded): every GATE introduced in the
//      phase (read from CONTEXT.md `<domain>` Requirements-in-scope line and
//      REQUIREMENTS.md traceability table) has at least one fire-event
//      observed by the `gate_fire_events` extractor (registered in Plan 19).
//      Unwired gates → block. If the extractor is not yet registered
//      (Plan 19 has not landed), emit a warning and skip this check to
//      avoid deadlock between Plan 17 and Plan 19 execution.
//
// Authoritative sources of truth:
//   - Ledger schema: .planning/phases/58-structural-enforcement-gates/58-04-ledger-schema.md
//   - Load-bearing classification: §4 of the above spec (disjunctive rule).
//   - Phase-introduced gates: REQUIREMENTS.md traceability table rows with
//     "Phase NN" AND CONTEXT.md <domain> "Requirements in scope" enumeration.
//
// Fire-event contract:
//   - Pass: `::notice title=GATE-09d::gate_fired=GATE-09d result=pass missing_claims=0 unwired_gates=0`
//   - Block: `::notice title=GATE-09d::gate_fired=GATE-09d result=block missing_claims=N unwired_gates=M`
//   - Plan 19 `gate_fire_events` extractor parses these markers from the
//     measurement trace.

// Parse load-bearing claims from a phase CONTEXT.md per ledger-schema §4.
// Returns { all: [...], loadBearing: [...] } where each item is
// { text, type, verification, line }. Classification is disjunctive:
//   (1) type is decided / stipulated / governing
//   (2) type is evidenced AND appears in <constraints> block
//   (3) tag "load-bearing" present on line (author opt-in)
//   (4) type is assumed AND cited as "Depends On" in dependency table
//   (5) type is projected AND cross-references another phase
function parseContextClaims(contextContent) {
  const all = [];
  if (!contextContent) return { all, loadBearing: [] };

  // Regex mirrors references/claim-types.md §3:
  //   \[(type)(/type)?(:verification)?\]
  const CLAIM_RE = /\[(evidenced|decided|assumed|open|projected|stipulated|governing)(?:\/(evidenced|decided|assumed|open|projected|stipulated|governing))?(?::(cited|reasoned|bare))?\]/g;

  // Sectionize by top-level XML-ish tags (<domain>, <working_model>, <constraints>, etc.).
  // We identify "in constraints" by finding the line-range of the <constraints>...</constraints> block.
  const lines = contextContent.split('\n');
  const sectionRanges = {}; // name → { start, end }
  let currentSection = null;
  for (let i = 0; i < lines.length; i++) {
    const openMatch = lines[i].match(/^<([a-z_]+)>\s*$/);
    const closeMatch = lines[i].match(/^<\/([a-z_]+)>\s*$/);
    if (openMatch) {
      currentSection = openMatch[1];
      sectionRanges[currentSection] = { start: i, end: lines.length - 1 };
    } else if (closeMatch && sectionRanges[closeMatch[1]]) {
      sectionRanges[closeMatch[1]].end = i;
      currentSection = null;
    }
  }
  const inSection = (lineNum, sectionName) => {
    const r = sectionRanges[sectionName];
    return r && lineNum >= r.start && lineNum <= r.end;
  };

  // Build dependency-table "Depends On" set (clause 4). The table lives under
  // <dependencies> and has markdown rows `| Claim | Depends On | Vulnerability |`.
  // We collect the middle column text so assumed-claim bodies referenced there
  // can be promoted to load-bearing.
  const dependsOnTexts = [];
  if (sectionRanges.dependencies) {
    const r = sectionRanges.dependencies;
    for (let i = r.start; i <= r.end; i++) {
      const row = lines[i].match(/^\|\s*[^|]+\s*\|\s*([^|]+)\s*\|[^|]*\|\s*$/);
      if (row && !/^[-: ]+$/.test(row[1])) {
        dependsOnTexts.push(row[1].trim());
      }
    }
  }

  // Walk lines, extract claims, classify.
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    let m;
    CLAIM_RE.lastIndex = 0;
    while ((m = CLAIM_RE.exec(line)) !== null) {
      const [, primary, secondary, verification] = m;
      const types = secondary ? [primary, secondary] : [primary];
      const hasLoadBearingTag = /\bload-bearing\b/.test(line);
      const referencesPhase = /Phase\s+\d+(\.\d+)?/i.test(line);
      const isInConstraints = inSection(i, 'constraints');
      const isInDependenciesDependsOnCell = dependsOnTexts.some(txt => {
        // Very rough: if dependency "Depends On" text appears in or near this claim line
        return txt.length > 8 && line.includes(txt.slice(0, Math.min(40, txt.length)));
      });

      let loadBearing = false;
      if (types.some(t => t === 'decided' || t === 'stipulated' || t === 'governing')) {
        loadBearing = true; // clause 1
      }
      if (types.includes('evidenced') && isInConstraints) {
        loadBearing = true; // clause 2
      }
      if (hasLoadBearingTag) {
        loadBearing = true; // clause 3
      }
      if (types.includes('assumed') && isInDependenciesDependsOnCell) {
        loadBearing = true; // clause 4
      }
      if (types.includes('projected') && referencesPhase) {
        loadBearing = true; // clause 5
      }

      all.push({
        text: line.trim(),
        type: primary,
        secondary_type: secondary || null,
        verification: verification || 'bare',
        line: i + 1,
        load_bearing: loadBearing,
      });
    }
  }

  const loadBearing = all.filter(c => c.load_bearing);
  return { all, loadBearing };
}

// Extract phase-introduced GATE identifiers from REQUIREMENTS.md traceability
// table + CONTEXT.md <domain> "Requirements in scope" enumeration (richer —
// includes sub-letter gates like GATE-04a/b/c).
function extractPhaseGates(cwd, phase, contextContent) {
  const gates = new Set();

  // Source 1: CONTEXT.md <domain> "Requirements in scope" line (authoritative
  // for sub-letter gates).
  if (contextContent) {
    const scopeMatch = contextContent.match(/\*\*Requirements in scope:\*\*\s*([^\n]+)/);
    if (scopeMatch) {
      const reqs = scopeMatch[1].split(/[,\s]+/);
      for (const r of reqs) {
        const g = r.trim().replace(/[.,;]$/, '');
        if (/^GATE-\d+[a-z]?$/.test(g)) gates.add(g);
      }
    }
  }

  // Source 2: REQUIREMENTS.md traceability table (fallback / additional rows).
  // Matches `| GATE-NN | Phase NN[.N] | Status |` or `| GATE-NNa | ... |`.
  const reqPath = path.join(planningDir(cwd), 'REQUIREMENTS.md');
  if (fs.existsSync(reqPath)) {
    const reqContent = fs.readFileSync(reqPath, 'utf-8');
    const phaseNormalized = String(phase).replace(/^0+/, '');
    const rowRe = new RegExp(
      '^\\|\\s*(GATE-\\d+[a-z]?)\\s*\\|\\s*Phase\\s+0*' + escapeRegex(phaseNormalized) + '(?:\\s|\\|)',
      'm'
    );
    const reqLines = reqContent.split('\n');
    for (const line of reqLines) {
      const m = line.match(rowRe);
      if (m) gates.add(m[1]);
    }
  }

  return [...gates].sort();
}

// Discover the phase's NN-LEDGER.md file (if any) and the phase directory.
function findPhaseLedger(cwd, phase) {
  const info = findPhaseInternal(cwd, phase);
  if (!info || !info.found) return { phaseDir: null, ledgerPath: null, contextPath: null };
  const phaseDir = path.join(cwd, info.directory);
  let files;
  try { files = fs.readdirSync(phaseDir); }
  catch { return { phaseDir, ledgerPath: null, contextPath: null }; }
  // Ledger discovery regex narrowed per Plan 04 SUMMARY: NN-LEDGER.md or NN.N[a]-LEDGER.md.
  const ledgerFile = files.find(f => /^\d+(\.\d+[a-z]?)?-LEDGER\.md$/.test(f));
  const contextFile = files.find(f => /-CONTEXT\.md$/.test(f));
  return {
    phaseDir,
    ledgerPath: ledgerFile ? path.join(phaseDir, ledgerFile) : null,
    contextPath: contextFile ? path.join(phaseDir, contextFile) : null,
  };
}

// XRT-01 closeout check (Phase 58 Plan 18):
//   On phase close, diff `get-shit-done/references/capability-matrix.md`
//   against its state at phase start. If any phase-introduced feature touches
//   capability-matrix surface (detected by scanning phase SUMMARY.md files
//   for capability-keywords), the matrix row MUST have been updated to reflect
//   the new state. Missing diff => block with reason
//   `capability_matrix_unreviewed`.
//
//   Rationale (audit Finding 2.10 + REQUIREMENTS.md:419):
//     Phase 57.7 / 57.8 shipped hook-dependent substrate without refreshing
//     capability-matrix.md. XRT-01 formalizes: hook-dependent or
//     cross-runtime features must update the runtime capability surface at
//     closeout. Planning-phase companion lives at
//     `get-shit-done/workflows/plan-phase.md` Step 4.6.
//
//   Phase-start commit resolution:
//     Walk `git log --first-parent` on the phase directory path and take the
//     earliest commit that created any file under `.planning/phases/NN-.../`
//     (phase scaffolding, CONTEXT.md, RESEARCH.md). The commit immediately
//     preceding is the pre-phase state for diff purposes. Fallbacks:
//       1. If phase directory has no git history, skip with warning
//          (matrix_start_not_resolvable) -- verifier returns pass.
//       2. If matrix file has no history at phase-start SHA, treat
//          content-at-start as empty string (any current content counts as
//          modification).
//
//   Capability-touching heuristic (keywords scanned over phase SUMMARY.md
//   files + CONTEXT.md):
//     hook / SessionStop / SessionStart / PreToolUse / PostToolUse / postlude
//     / codex_hooks / capability-matrix / has_capability / task_tool /
//     tool_permissions / mcp_servers
//
//   Fire-event: `::notice title=XRT-01::gate_fired=XRT-01 result=<pass|block>
//                reason=<capability_matrix_unreviewed|matrix_updated|
//                        no_capability_touch|matrix_start_not_resolvable>`
//   Codex behavior: applies (filesystem + git operations runtime-neutral).
function verifyCapabilityMatrix(cwd, phase, info) {
  const matrixRelPath = 'get-shit-done/references/capability-matrix.md';
  const matrixAbsPath = path.join(cwd, matrixRelPath);

  // Guard 1: matrix file missing from tree
  if (!fs.existsSync(matrixAbsPath)) {
    return {
      status: 'pass',
      reason: 'capability_matrix_file_missing',
      note: 'matrix file absent from working tree; skip diff',
    };
  }

  // Resolve phase directory
  const phaseInfo = findPhaseInternal(cwd, phase);
  if (!phaseInfo || !phaseInfo.found) {
    return { status: 'pass', reason: 'phase_directory_not_found' };
  }
  const phaseDirRel = phaseInfo.directory;
  const phaseDirAbs = path.join(cwd, phaseDirRel);

  // Collect capability-touch signal from SUMMARY.md files + CONTEXT.md.
  // Keywords taken from capability-matrix.md row titles + hook events surfaced
  // in plan-phase XRT-01 heuristic (intentional near-superset to avoid
  // false-negatives where a phase touches capability via keyword not in the
  // planning-gate heuristic).
  const CAPABILITY_KEYWORDS = [
    'hook', 'SessionStop', 'SessionStart', 'PreToolUse', 'PostToolUse',
    'postlude', 'codex_hooks', 'capability-matrix', 'has_capability',
    'task_tool', 'tool_permissions', 'mcp_servers',
  ];
  const kwRegex = new RegExp(CAPABILITY_KEYWORDS.map(escapeRegex).join('|'), 'i');

  let capabilityTouched = false;
  let capabilitySource = null;
  try {
    const files = fs.readdirSync(phaseDirAbs);
    const scanTargets = files.filter(f =>
      /-SUMMARY\.md$/.test(f) || /-CONTEXT\.md$/.test(f)
    );
    for (const f of scanTargets) {
      const content = safeReadFile(path.join(phaseDirAbs, f)) || '';
      if (kwRegex.test(content)) {
        capabilityTouched = true;
        capabilitySource = f;
        break;
      }
    }
  } catch { /* directory unreadable -- fall through with capabilityTouched=false */ }

  if (info) {
    info.capability_touched = capabilityTouched;
    info.capability_source = capabilitySource;
  }

  if (!capabilityTouched) {
    return {
      status: 'pass',
      reason: 'no_capability_touch',
      note: 'phase SUMMARY / CONTEXT did not reference capability-matrix surface',
    };
  }

  // Resolve phase-start SHA: earliest commit touching the phase directory on
  // the current branch's first-parent chain. This is approximate but robust
  // across the fork's branching strategy (per-phase branches named
  // gsd/phase-NN-*).
  const logResult = execGit(cwd, [
    'log', '--first-parent', '--format=%H', '--reverse', '--', phaseDirRel,
  ]);
  if (logResult.exitCode !== 0 || !logResult.stdout.trim()) {
    // No history for the phase directory yet (pre-initial-commit run, or
    // weird worktree state). Skip with warning.
    return {
      status: 'pass',
      reason: 'matrix_start_not_resolvable',
      note: 'no git history for phase directory; cannot diff matrix',
    };
  }
  const phaseStartSha = logResult.stdout.trim().split('\n')[0];

  // Matrix content AT phase-start SHA. If the file didn't exist at that
  // point, treat start-content as empty (any current content = modification).
  //
  // NB: core.cjs's `execGit` .trim()s stdout, stripping trailing newlines.
  // fs.readFileSync preserves them. We `trimEnd()` both sides before compare
  // so a pure newline-preservation difference does not masquerade as a real
  // content change (that would false-block every phase the matrix wasn't
  // edited in).
  let matrixAtStart = '';
  const showResult = execGit(cwd, [
    'show', `${phaseStartSha}:${matrixRelPath}`,
  ]);
  if (showResult.exitCode === 0) {
    matrixAtStart = showResult.stdout;
  }
  // Current (working-tree) matrix content.
  const matrixCurrent = fs.readFileSync(matrixAbsPath, 'utf-8');

  const modified = matrixCurrent.trimEnd() !== matrixAtStart.trimEnd();
  if (info) {
    info.capability_matrix_phase_start_sha = phaseStartSha;
    info.capability_matrix_modified = modified;
  }

  if (modified) {
    return {
      status: 'pass',
      reason: 'matrix_updated',
      note: 'capability-matrix.md diff observed since phase start',
    };
  }

  return {
    status: 'block',
    reason: 'capability_matrix_unreviewed',
    note: 'phase touched capability surface but capability-matrix.md unchanged since phase start',
    capability_source: capabilitySource,
    phase_start_sha: phaseStartSha,
  };
}

// Query the gate_fire_events extractor for per-gate emission counts.
// Returns null if the extractor is not yet registered (Plan 19 not run).
function queryGateFireEvents(cwd, phase) {
  try {
    const { buildRegistry } = require('./measurement/registry.cjs');
    const registry = buildRegistry();
    // The extractor is registered by Plan 19 under one of the SOURCE_FAMILIES
    // with name 'gate_fire_events'. Check all families.
    const extractor = registry.byName.get('gate_fire_events');
    if (!extractor) return null;
    // Build a minimal context for extraction. The extractor reads from the
    // delegation-log.jsonl and/or .github/workflows/*.yml CI notice markers
    // (per Plan 19 design); it should accept {cwd, phase} and return rows.
    const context = { cwd, phase };
    const rows = extractor.extract(context) || [];
    // Group by gate_id: { "GATE-09b": count, ... }. Plan 19 emits per-row value
    // as { gate_fire_count, gate_fire_by_gate_id: [{gate_id, count}, ...], ... }
    // with one row per runtime — sum across runtimes so downstream callers see
    // phase-aggregate counts regardless of runtime split.
    const counts = {};
    for (const row of rows) {
      if (!row || !row.value) continue;
      const byGate = row.value.gate_fire_by_gate_id;
      if (Array.isArray(byGate)) {
        for (const entry of byGate) {
          if (entry && entry.gate_id && typeof entry.count === 'number') {
            counts[entry.gate_id] = (counts[entry.gate_id] || 0) + entry.count;
          }
        }
      } else if (byGate && typeof byGate === 'object') {
        // Alternative shape: { GATE-01: 3, GATE-05: 12, ... } — support for
        // future simplifications of the extractor without breaking the verifier.
        for (const [gid, n] of Object.entries(byGate)) {
          counts[gid] = (counts[gid] || 0) + (Number(n) || 0);
        }
      }
    }
    return counts;
  } catch {
    return null; // treat any registry-load error as "extractor not registered"
  }
}

function cmdVerifyLedger(cwd, phase, options, raw) {
  if (!phase) { error('phase required. Usage: gsd-tools verify ledger <phase_number> [--strict] [--no-meta-gate]'); }
  const strict = options && options.strict !== false; // default true
  const includeMetaGate = !(options && options.noMetaGate);

  const missing_claims = [];
  const unwired_gates = [];
  const warnings = [];
  const info = {};

  // Locate phase artifacts
  const { phaseDir, ledgerPath, contextPath } = findPhaseLedger(cwd, phase);
  if (!phaseDir) {
    const result = {
      status: 'block',
      phase,
      missing_claims: ['phase_directory_not_found'],
      unwired_gates: [],
      warnings: [],
    };
    console.log(`::notice title=GATE-09d::gate_fired=GATE-09d result=block missing_claims=1 unwired_gates=0`);
    output(result, raw, 'block');
    return;
  }
  info.phase_dir = path.relative(cwd, phaseDir);

  // Check 1: Ledger file present
  if (!ledgerPath || !fs.existsSync(ledgerPath)) {
    missing_claims.push('ledger_not_present');
  }
  info.ledger_path = ledgerPath ? path.relative(cwd, ledgerPath) : null;

  // Load CONTEXT and parse load-bearing claims
  let contextContent = null;
  if (contextPath && fs.existsSync(contextPath)) {
    contextContent = fs.readFileSync(contextPath, 'utf-8');
  } else {
    warnings.push('context_md_not_present');
  }
  info.context_path = contextPath ? path.relative(cwd, contextPath) : null;
  const { all: allClaims, loadBearing } = parseContextClaims(contextContent);
  info.context_claim_count = allClaims.length;
  info.load_bearing_claim_count = loadBearing.length;

  // Parse ledger entries (if ledger present)
  let ledgerEntries = [];
  if (ledgerPath && fs.existsSync(ledgerPath)) {
    const ledgerContent = fs.readFileSync(ledgerPath, 'utf-8');

    // Structural frontmatter validation via frontmatter.cjs (delegated to the
    // existing --schema ledger surface from Plan 04).
    try {
      const fm = extractFrontmatter(ledgerContent);
      ledgerEntries = Array.isArray(fm.entries) ? fm.entries : [];
      // Quick sanity: ledger_schema must be v1
      if (fm.ledger_schema && String(fm.ledger_schema) !== 'v1') {
        warnings.push(`ledger_schema_version_unexpected: got ${fm.ledger_schema}`);
      }
    } catch (err) {
      warnings.push(`ledger_parse_error: ${err.message}`);
    }
  }
  info.ledger_entry_count = ledgerEntries.length;

  // Check 2 (claim-coverage): every load-bearing CONTEXT claim has at least
  // one matching ledger entry (fuzzy substring or claim-ID match).
  const coveredClaims = new Set();
  const uncoveredClaims = [];
  for (const claim of loadBearing) {
    // Extract a search key: first 80 chars of the claim text minus type markers.
    const key = claim.text
      .replace(/\[[a-z/:]+\]/gi, '')
      .replace(/^[-*]\s*/, '')
      .replace(/\*\*[^*]+\*\*:?\s*/, '')
      .trim()
      .slice(0, 80);
    if (!key) continue;
    const keyLower = key.toLowerCase();
    const matched = ledgerEntries.some(e => {
      const cc = String(e.context_claim || '').toLowerCase();
      // Substring match either direction (allows claim-ID-style abbreviations)
      return cc.length > 0 && (cc.includes(keyLower.slice(0, 30)) || keyLower.includes(cc.slice(0, 30)));
    });
    if (matched) {
      coveredClaims.add(key);
    } else {
      uncoveredClaims.push({ line: claim.line, type: claim.type, excerpt: key });
    }
  }
  if (uncoveredClaims.length > 0) {
    for (const u of uncoveredClaims) {
      missing_claims.push(`uncovered_claim:L${u.line}:${u.type}:${u.excerpt.slice(0, 50)}`);
    }
  }
  info.load_bearing_claim_covered = coveredClaims.size;

  // Check 3 (evidence-paths): every ledger entry with
  // disposition=implemented_this_phase has non-empty evidence_paths and
  // every listed path exists on disk.
  const brokenEvidence = [];
  for (let i = 0; i < ledgerEntries.length; i++) {
    const e = ledgerEntries[i];
    if (!e || e.disposition !== 'implemented_this_phase') continue;
    const ev = Array.isArray(e.evidence_paths) ? e.evidence_paths : [];
    if (ev.length === 0) {
      brokenEvidence.push({ entry: i, issue: 'evidence_paths_empty' });
      continue;
    }
    for (const p of ev) {
      const resolved = path.isAbsolute(p) ? p : path.join(cwd, p);
      if (!fs.existsSync(resolved)) {
        brokenEvidence.push({ entry: i, issue: 'evidence_path_missing', path: p });
      }
    }
  }
  if (brokenEvidence.length > 0) {
    for (const b of brokenEvidence) {
      missing_claims.push(`broken_evidence:entry${b.entry}:${b.issue}${b.path ? ':' + b.path : ''}`);
    }
  }
  info.broken_evidence_count = brokenEvidence.length;

  // Check 4 (meta-gate, GATE-09e embedded): every phase-introduced gate has
  // at least one fire-event on the trace.
  if (includeMetaGate) {
    const gatesIntroduced = extractPhaseGates(cwd, phase, contextContent);
    info.gates_introduced_by_phase = gatesIntroduced;
    const fireCounts = queryGateFireEvents(cwd, phase);
    if (fireCounts === null) {
      warnings.push('meta_gate_extractor_missing: gate_fire_events extractor not yet registered (Plan 19 may not have landed); skipping meta-gate check');
      info.meta_gate_skipped = true;
    } else {
      info.meta_gate_skipped = false;
      info.gate_fire_counts = fireCounts;
      for (const g of gatesIntroduced) {
        if (!fireCounts[g] || fireCounts[g] === 0) {
          unwired_gates.push(g);
        }
      }
    }
  } else {
    info.meta_gate_skipped = true;
    info.meta_gate_reason = 'disabled_via_flag';
  }

  // XRT-01 closeout check (Phase 58 Plan 18): capability-matrix diff.
  // Runs on every `verify ledger` invocation; independent of --no-meta-gate
  // because XRT-01 enforces cross-runtime substrate discipline, not gate
  // emission. Result rolled into the ledger verifier's block reasons so a
  // single `verify ledger <N>` call surfaces both GATE-09d and XRT-01 status.
  const xrtResult = verifyCapabilityMatrix(cwd, phase, info);
  info.xrt_01 = {
    status: xrtResult.status,
    reason: xrtResult.reason,
    note: xrtResult.note || null,
  };
  // Dedicated fire-event for XRT-01 closeout (Plan 19 extractor reads this).
  console.log(`::notice title=XRT-01::gate_fired=XRT-01 result=${xrtResult.status} reason=${xrtResult.reason}`);
  const xrtBlocked = xrtResult.status === 'block';
  if (xrtBlocked) {
    missing_claims.push(`xrt_01_capability_matrix_unreviewed:${xrtResult.reason}`);
  }

  // Emission
  const blockReasons = missing_claims.length + unwired_gates.length;
  const status = blockReasons === 0 ? 'pass' : 'block';
  const notice = `::notice title=GATE-09d::gate_fired=GATE-09d result=${status} missing_claims=${missing_claims.length} unwired_gates=${unwired_gates.length}`;
  console.log(notice);

  const result = {
    status,
    phase,
    missing_claims,
    unwired_gates,
    warnings,
    info,
  };

  // Exit behavior:
  //   - `raw` (script) callers get JSON + exit 0 and branch on status.
  //   - Non-raw callers get the human banner; in strict mode we exit 1 on
  //     block for shell-check usability.
  if (raw) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }
  output(result, raw, status);
  if (status === 'block' && strict) {
    process.exit(1);
  }
}

module.exports = {
  cmdVerifySummary,
  cmdVerifyPlanStructure,
  cmdVerifyPhaseCompleteness,
  cmdVerifyReferences,
  cmdVerifyCommits,
  cmdVerifyArtifacts,
  cmdVerifyKeyLinks,
  cmdValidateConsistency,
  cmdValidateHealth,
  cmdValidateAgents,
  cmdVerifySchemaDrift,
  cmdVerifyLedger,
  // Internals exported for unit tests:
  parseContextClaims,
  extractPhaseGates,
  findPhaseLedger,
  verifyCapabilityMatrix,
};
