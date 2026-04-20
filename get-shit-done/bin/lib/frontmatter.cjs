/**
 * Frontmatter — YAML frontmatter parsing, serialization, and CRUD commands
 */

const fs = require('fs');
const path = require('path');
const { safeReadFile, normalizeMd, output, error, atomicWriteFileSync } = require('./core.cjs');

// ─── Parsing engine ───────────────────────────────────────────────────────────

/**
 * Split a YAML inline array body on commas, respecting quoted strings.
 * e.g. '"a, b", c' → ['a, b', 'c']
 */
function splitInlineArray(body) {
  const items = [];
  let current = '';
  let inQuote = null; // null | '"' | "'"

  for (let i = 0; i < body.length; i++) {
    const ch = body[i];
    if (inQuote) {
      if (ch === inQuote) {
        inQuote = null;
      } else {
        current += ch;
      }
    } else if (ch === '"' || ch === "'") {
      inQuote = ch;
    } else if (ch === ',') {
      const trimmed = current.trim();
      if (trimmed) items.push(trimmed);
      current = '';
    } else {
      current += ch;
    }
  }
  const trimmed = current.trim();
  if (trimmed) items.push(trimmed);
  return items;
}

function parseInlineValue(rawValue) {
  const value = String(rawValue).trim();
  if (value === '') return '';
  if (value === '[]') return [];
  if (value === '{}') return {};
  if (value.startsWith('[') && value.endsWith(']')) {
    return splitInlineArray(value.slice(1, -1)).map(item => item.replace(/^["']|["']$/g, ''));
  }
  return value.replace(/^["']|["']$/g, '');
}

function lineIndent(line) {
  const indentMatch = line.match(/^(\s*)/);
  return indentMatch ? indentMatch[1].length : 0;
}

function nextMeaningfulLine(lines, startIndex) {
  let index = startIndex;
  while (index < lines.length) {
    const trimmed = lines[index].trim();
    if (trimmed !== '' && !trimmed.startsWith('#')) return index;
    index++;
  }
  return index;
}

function parseObjectLines(lines, startIndex, baseIndent) {
  const obj = {};
  let index = startIndex;

  while (index < lines.length) {
    index = nextMeaningfulLine(lines, index);
    if (index >= lines.length) break;

    const line = lines[index];
    const indent = lineIndent(line);
    if (indent < baseIndent) break;
    if (indent > baseIndent) break;

    const trimmed = line.trim();
    if (trimmed.startsWith('- ')) break;

    const keyMatch = trimmed.match(/^([a-zA-Z0-9_-]+):\s*(.*)$/);
    if (!keyMatch) {
      index++;
      continue;
    }

    const key = keyMatch[1];
    const rawValue = keyMatch[2];
    if (rawValue !== '') {
      obj[key] = parseInlineValue(rawValue);
      index++;
      continue;
    }

    const childIndex = nextMeaningfulLine(lines, index + 1);
    if (childIndex >= lines.length || lineIndent(lines[childIndex]) <= indent) {
      obj[key] = {};
      index = childIndex;
      continue;
    }

    const childIndent = lineIndent(lines[childIndex]);
    const childTrimmed = lines[childIndex].trim();
    if (childTrimmed.startsWith('- ')) {
      const [arr, nextIndex] = parseArrayLines(lines, childIndex, childIndent);
      obj[key] = arr;
      index = nextIndex;
      continue;
    }

    const [nestedObj, nextIndex] = parseObjectLines(lines, childIndex, childIndent);
    obj[key] = nestedObj;
    index = nextIndex;
  }

  return [obj, index];
}

function parseArrayLines(lines, startIndex, baseIndent) {
  const arr = [];
  let index = startIndex;

  while (index < lines.length) {
    index = nextMeaningfulLine(lines, index);
    if (index >= lines.length) break;

    const line = lines[index];
    const indent = lineIndent(line);
    if (indent < baseIndent) break;
    if (indent !== baseIndent || !line.trim().startsWith('- ')) break;

    const content = line.trim().slice(2);

    if (content === '') {
      const childIndex = nextMeaningfulLine(lines, index + 1);
      if (childIndex >= lines.length || lineIndent(lines[childIndex]) <= indent) {
        arr.push('');
        index = childIndex;
        continue;
      }

      const childIndent = lineIndent(lines[childIndex]);
      if (lines[childIndex].trim().startsWith('- ')) {
        const [nestedArr, nextIndex] = parseArrayLines(lines, childIndex, childIndent);
        arr.push(nestedArr);
        index = nextIndex;
        continue;
      }

      const [nestedObj, nextIndex] = parseObjectLines(lines, childIndex, childIndent);
      arr.push(nestedObj);
      index = nextIndex;
      continue;
    }

    const inlineObjectMatch = content.match(/^([a-zA-Z0-9_-]+):\s*(.*)$/);
    if (inlineObjectMatch) {
      const item = {};
      const key = inlineObjectMatch[1];
      const rawValue = inlineObjectMatch[2];
      item[key] = rawValue === '' ? {} : parseInlineValue(rawValue);

      const childIndex = nextMeaningfulLine(lines, index + 1);
      if (childIndex < lines.length && lineIndent(lines[childIndex]) > indent && !lines[childIndex].trim().startsWith('- ')) {
        const [nestedObj, nextIndex] = parseObjectLines(lines, childIndex, lineIndent(lines[childIndex]));
        Object.assign(item, nestedObj);
        index = nextIndex;
      } else {
        index++;
      }

      arr.push(item);
      continue;
    }

    arr.push(parseInlineValue(content));
    index++;
  }

  return [arr, index];
}

function isScalarValue(value) {
  return value === null || value === undefined || typeof value !== 'object';
}

function formatScalar(value) {
  const stringValue = String(value);
  if (
    stringValue === '' ||
    /\s#/.test(stringValue) ||
    stringValue.includes(':') ||
    stringValue.startsWith('[') ||
    stringValue.startsWith('{') ||
    stringValue.startsWith('-') ||
    /^\s|\s$/.test(stringValue)
  ) {
    return JSON.stringify(stringValue);
  }
  return stringValue;
}

function serializeArrayItem(lines, item, indent) {
  const space = ' '.repeat(indent);
  if (Array.isArray(item)) {
    if (item.length === 0) {
      lines.push(`${space}- []`);
      return;
    }
    lines.push(`${space}-`);
    for (const nestedItem of item) {
      serializeArrayItem(lines, nestedItem, indent + 2);
    }
    return;
  }

  if (item && typeof item === 'object') {
    const entries = Object.entries(item).filter(([, value]) => value !== null && value !== undefined);
    if (entries.length === 0) {
      lines.push(`${space}- {}`);
      return;
    }

    const [firstKey, firstValue] = entries[0];
    if (isScalarValue(firstValue)) {
      lines.push(`${space}- ${firstKey}: ${formatScalar(firstValue)}`);
      for (const [key, value] of entries.slice(1)) {
        serializeKeyValue(lines, key, value, indent + 2);
      }
      return;
    }

    lines.push(`${space}-`);
    for (const [key, value] of entries) {
      serializeKeyValue(lines, key, value, indent + 2);
    }
    return;
  }

  lines.push(`${space}- ${formatScalar(item)}`);
}

function serializeKeyValue(lines, key, value, indent) {
  const space = ' '.repeat(indent);
  if (value === null || value === undefined) return;

  if (Array.isArray(value)) {
    if (value.length === 0) {
      lines.push(`${space}${key}: []`);
      return;
    }
    if (value.every(isScalarValue) && value.length <= 3 && value.join(', ').length < 60) {
      lines.push(`${space}${key}: [${value.map(formatScalar).join(', ')}]`);
      return;
    }
    lines.push(`${space}${key}:`);
    for (const item of value) {
      serializeArrayItem(lines, item, indent + 2);
    }
    return;
  }

  if (value && typeof value === 'object') {
    const entries = Object.entries(value).filter(([, nestedValue]) => nestedValue !== null && nestedValue !== undefined);
    if (entries.length === 0) {
      lines.push(`${space}${key}: {}`);
      return;
    }
    lines.push(`${space}${key}:`);
    for (const [nestedKey, nestedValue] of entries) {
      serializeKeyValue(lines, nestedKey, nestedValue, indent + 2);
    }
    return;
  }

  lines.push(`${space}${key}: ${formatScalar(value)}`);
}

function extractFrontmatter(content) {
  // Find ALL frontmatter blocks at the start of the file.
  // If multiple blocks exist (corruption from CRLF mismatch), use the LAST one
  // since it represents the most recent state sync.
  const allBlocks = [...content.matchAll(/(?:^|\n)\s*---\r?\n([\s\S]+?)\r?\n---/g)];
  const match = allBlocks.length > 0 ? allBlocks[allBlocks.length - 1] : null;
  if (!match) return {};

  const yaml = match[1];
  const lines = yaml.split(/\r?\n/);
  const [frontmatter] = parseObjectLines(lines, 0, 0);
  return frontmatter;
}

function reconstructFrontmatter(obj) {
  const lines = [];
  for (const [key, value] of Object.entries(obj || {})) {
    serializeKeyValue(lines, key, value, 0);
  }
  return lines.join('\n');
}

function spliceFrontmatter(content, newObj) {
  const yamlStr = reconstructFrontmatter(newObj);
  const match = content.match(/^---\r?\n[\s\S]+?\r?\n---/);
  if (match) {
    return `---\n${yamlStr}\n---` + content.slice(match[0].length);
  }
  return `---\n${yamlStr}\n---\n\n` + content;
}

function parseMustHavesBlock(content, blockName) {
  // Extract a specific block from must_haves in raw frontmatter YAML
  // Handles 3-level nesting: must_haves > artifacts/key_links > [{path, provides, ...}]
  const fmMatch = content.match(/^---\r?\n([\s\S]+?)\r?\n---/);
  if (!fmMatch) return [];

  const yaml = fmMatch[1];

  // Find must_haves: first to detect its indentation level
  const mustHavesMatch = yaml.match(/^(\s*)must_haves:\s*$/m);
  if (!mustHavesMatch) return [];
  const mustHavesIndent = mustHavesMatch[1].length;

  // Find the block (e.g., "truths:", "artifacts:", "key_links:") under must_haves
  // It must be indented more than must_haves but we detect the actual indent dynamically
  const blockPattern = new RegExp(`^(\\s+)${blockName}:\\s*$`, 'm');
  const blockMatch = yaml.match(blockPattern);
  if (!blockMatch) return [];

  const blockIndent = blockMatch[1].length;
  // The block must be nested under must_haves (more indented)
  if (blockIndent <= mustHavesIndent) return [];

  // Find where the block starts in the yaml string
  const blockStart = yaml.indexOf(blockMatch[0]);
  if (blockStart === -1) return [];

  const afterBlock = yaml.slice(blockStart);
  const blockLines = afterBlock.split(/\r?\n/).slice(1); // skip the header line

  // List items are indented one level deeper than blockIndent
  // Continuation KVs are indented one level deeper than list items
  const items = [];
  let current = null;
  let listItemIndent = -1; // detected from first "- " line

  for (const line of blockLines) {
    // Skip empty lines
    if (line.trim() === '') continue;
    const indent = line.match(/^(\s*)/)[1].length;
    // Stop at same or lower indent level than the block header
    if (indent <= blockIndent && line.trim() !== '') break;

    const trimmed = line.trim();

    if (trimmed.startsWith('- ')) {
      // Detect list item indent from the first occurrence
      if (listItemIndent === -1) listItemIndent = indent;

      // Only treat as a top-level list item if at the expected indent
      if (indent === listItemIndent) {
        if (current) items.push(current);
        current = {};
        const afterDash = trimmed.slice(2);
        // Check if it's a simple string item (no colon means not a key-value)
        if (!afterDash.includes(':')) {
          current = afterDash.replace(/^["']|["']$/g, '');
        } else {
          // Key-value on same line as dash: "- path: value"
          const kvMatch = afterDash.match(/^(\w+):\s*"?([^"]*)"?\s*$/);
          if (kvMatch) {
            current = {};
            current[kvMatch[1]] = kvMatch[2];
          }
        }
        continue;
      }
    }

    if (current && typeof current === 'object' && indent > listItemIndent) {
      // Continuation key-value or nested array item
      if (trimmed.startsWith('- ')) {
        // Array item under a key
        const arrVal = trimmed.slice(2).replace(/^["']|["']$/g, '');
        const keys = Object.keys(current);
        const lastKey = keys[keys.length - 1];
        if (lastKey && !Array.isArray(current[lastKey])) {
          current[lastKey] = current[lastKey] ? [current[lastKey]] : [];
        }
        if (lastKey) current[lastKey].push(arrVal);
      } else {
        const kvMatch = trimmed.match(/^(\w+):\s*"?([^"]*)"?\s*$/);
        if (kvMatch) {
          const val = kvMatch[2];
          // Try to parse as number
          current[kvMatch[1]] = /^\d+$/.test(val) ? parseInt(val, 10) : val;
        }
      }
    }
  }
  if (current) items.push(current);

  // Warn when must_haves block exists but parsed as empty -- likely YAML formatting issue.
  // This is a critical diagnostic: empty must_haves causes verification to silently degrade
  // to Option C (LLM-derived truths) instead of checking documented contracts.
  if (items.length === 0 && blockLines.length > 0) {
    const nonEmptyLines = blockLines.filter(l => l.trim() !== '').length;
    if (nonEmptyLines > 0) {
      process.stderr.write(
        `[gsd-tools] WARNING: must_haves.${blockName} block has ${nonEmptyLines} content lines but parsed 0 items. ` +
        `Possible YAML formatting issue — verification will fall back to LLM-derived truths.\n`
      );
    }
  }

  return items;
}

// ─── Frontmatter CRUD commands ────────────────────────────────────────────────

// ─── Fork Signal Schema ───────────────────────────────────────────────────────

const FORK_SIGNAL_SCHEMA = {
  required: ['id', 'type', 'project', 'tags', 'created', 'severity', 'signal_type'],
  conditional: [
    {
      when: { field: 'severity', value: 'critical' },
      require: ['evidence'],
      recommend: ['confidence', 'confidence_basis'],
    },
    {
      when: { field: 'severity', value: 'notable' },
      recommend: ['evidence', 'confidence'],
    },
  ],
  backward_compat: { field: 'lifecycle_state' },
  recommended: ['lifecycle_state', 'signal_category', 'confidence', 'confidence_basis'],
  optional: ['triage', 'remediation', 'verification', 'lifecycle_log',
             'recurrence_of', 'phase', 'plan', 'polarity', 'source',
             'occurrence_count', 'related_signals', 'runtime', 'model',
             'gsd_version', 'durability', 'status', 'provenance_schema',
             'provenance_status', 'about_work', 'detected_by', 'written_by'],
};

const SIGNATURE_REQUIRED_PATHS = [
  'signature.role',
  'signature.harness',
  'signature.platform',
  'signature.vendor',
  'signature.model',
  'signature.reasoning_effort',
  'signature.profile',
  'signature.gsd_version',
  'signature.generated_at',
  'signature.session_id',
  'signature.provenance_status.role',
  'signature.provenance_status.harness',
  'signature.provenance_status.platform',
  'signature.provenance_status.vendor',
  'signature.provenance_status.model',
  'signature.provenance_status.reasoning_effort',
  'signature.provenance_status.profile',
  'signature.provenance_status.gsd_version',
  'signature.provenance_status.generated_at',
  'signature.provenance_status.session_id',
  'signature.provenance_source.role',
  'signature.provenance_source.harness',
  'signature.provenance_source.platform',
  'signature.provenance_source.vendor',
  'signature.provenance_source.model',
  'signature.provenance_source.reasoning_effort',
  'signature.provenance_source.profile',
  'signature.provenance_source.gsd_version',
  'signature.provenance_source.generated_at',
  'signature.provenance_source.session_id',
];

// ─── Ledger Schema (GATE-09a) ─────────────────────────────────────────────────
//
// The ledger schema validates `NN-LEDGER.md` frontmatter per Phase 58 Research R6
// (Layout 1: standalone NN-LEDGER.md). It carries top-level required fields plus
// per-entry validation with disposition-conditional required fields. The
// validation plumbing is specialized because each entry is an array item with
// its own required fields + conditionals on `disposition`; the signal schema's
// top-level `conditional` hook does not express per-array-item logic.
//
// Consumed by Phase 58 Plan 17 (GATE-09d verifier).
// Authoritative spec: .planning/phases/58-structural-enforcement-gates/58-04-ledger-schema.md

const LEDGER_DISPOSITION_ENUM = [
  'implemented_this_phase',
  'explicitly_deferred',
  'rejected_with_reason',
  'left_open_blocking_planning',
];

const LEDGER_GENERATOR_ROLE_ENUM = ['planner', 'executor', 'verifier'];

const LEDGER_TARGET_PHASE_PATTERN = /^Phase \d+(\.\d+)?$/;

const LEDGER_SCHEMA = {
  required: ['phase', 'ledger_schema', 'generated_at', 'generator_role', 'entries'],
  ledger: true, // marker -- activates ledger-specific validation branch in cmdFrontmatterValidate
  schema_version_field: 'ledger_schema',
  schema_version_value: 'v1',
  entry_required: ['context_claim', 'disposition', 'load_bearing', 'role_split_provenance'],
  entry_nested_required: [
    'role_split_provenance.written_by',
    'role_split_provenance.written_at',
    'role_split_provenance.session_id',
  ],
  disposition_enum: LEDGER_DISPOSITION_ENUM,
  generator_role_enum: LEDGER_GENERATOR_ROLE_ENUM,
  target_phase_pattern: LEDGER_TARGET_PHASE_PATTERN,
};

const FRONTMATTER_SCHEMAS = {
  plan: {
    required: ['phase', 'plan', 'type', 'wave', 'depends_on', 'files_modified', 'autonomous', 'must_haves', 'signature'],
    nested_required: SIGNATURE_REQUIRED_PATHS,
  },
  summary: {
    required: ['phase', 'plan', 'subsystem', 'tags', 'duration', 'completed', 'signature'],
    nested_required: SIGNATURE_REQUIRED_PATHS,
  },
  verification: {
    required: ['phase', 'verified', 'status', 'score', 'signature'],
    nested_required: SIGNATURE_REQUIRED_PATHS,
  },
  signal: FORK_SIGNAL_SCHEMA,
  ledger: LEDGER_SCHEMA,
};

function getNestedValue(obj, fieldPath) {
  return String(fieldPath)
    .split('.')
    .reduce((current, segment) => {
      if (current === null || current === undefined) return undefined;
      if (typeof current !== 'object') return undefined;
      return current[segment];
    }, obj);
}

function hasStructuredValue(value) {
  if (value === undefined || value === null) return false;
  if (typeof value === 'string') return value.trim() !== '';
  if (Array.isArray(value)) return true;
  if (typeof value === 'object') return Object.keys(value).length > 0;
  return true;
}

function validateNestedRequiredPaths(frontmatter, fieldPaths) {
  return (fieldPaths || []).filter(fieldPath => !hasStructuredValue(getNestedValue(frontmatter, fieldPath)));
}

// ─── Ledger validation (GATE-09a) ────────────────────────────────────────────

function validateLedgerEntry(entry, index, schema) {
  const prefix = `entries[${index}]`;
  const missing = [];
  const invalid = [];
  const warnings = [];

  if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
    invalid.push(`${prefix}: not an object`);
    return { missing, invalid, warnings };
  }

  // Entry-level required fields
  for (const field of schema.entry_required) {
    if (entry[field] === undefined || entry[field] === null) {
      missing.push(`${prefix}.${field}`);
    }
  }

  // load_bearing must be boolean (YAML parser returns strings; accept "true"/"false" or true/false)
  if (entry.load_bearing !== undefined && entry.load_bearing !== null) {
    const lb = entry.load_bearing;
    if (typeof lb !== 'boolean' && lb !== 'true' && lb !== 'false') {
      invalid.push(`${prefix}.load_bearing: must be boolean (got ${JSON.stringify(lb)})`);
    }
  }

  // Entry-level nested required (role_split_provenance.*)
  for (const fieldPath of schema.entry_nested_required) {
    if (!hasStructuredValue(getNestedValue(entry, fieldPath))) {
      missing.push(`${prefix}.${fieldPath}`);
    }
  }

  // role_split_provenance.written_by must be in the generator_role enum
  const writtenBy = getNestedValue(entry, 'role_split_provenance.written_by');
  if (writtenBy !== undefined && writtenBy !== null && !schema.generator_role_enum.includes(String(writtenBy))) {
    invalid.push(`${prefix}.role_split_provenance.written_by: must be one of ${schema.generator_role_enum.join('|')} (got ${JSON.stringify(writtenBy)})`);
  }

  // disposition enum check
  if (entry.disposition !== undefined && entry.disposition !== null) {
    if (!schema.disposition_enum.includes(String(entry.disposition))) {
      invalid.push(`${prefix}.disposition: must be one of ${schema.disposition_enum.join('|')} (got ${JSON.stringify(entry.disposition)})`);
    }
  }

  // Conditional required fields keyed on disposition
  const disposition = entry.disposition;
  if (disposition === 'implemented_this_phase') {
    const ev = entry.evidence_paths;
    if (!Array.isArray(ev) || ev.length < 1) {
      missing.push(`${prefix}.evidence_paths (required when disposition=implemented_this_phase; must be array with >= 1 entry)`);
    }
  } else if (disposition === 'explicitly_deferred') {
    const target = entry.target_phase_if_deferred;
    if (target === undefined || target === null || String(target).trim() === '') {
      missing.push(`${prefix}.target_phase_if_deferred (required when disposition=explicitly_deferred)`);
    } else if (!schema.target_phase_pattern.test(String(target))) {
      invalid.push(`${prefix}.target_phase_if_deferred: must match pattern ${schema.target_phase_pattern.source} (got ${JSON.stringify(target)})`);
    }
  } else if (disposition === 'rejected_with_reason') {
    const origin = getNestedValue(entry, 'narrowing_provenance.originating_claim');
    const rationale = getNestedValue(entry, 'narrowing_provenance.rationale');
    if (!hasStructuredValue(origin)) {
      missing.push(`${prefix}.narrowing_provenance.originating_claim (required when disposition=rejected_with_reason)`);
    }
    if (!hasStructuredValue(rationale)) {
      missing.push(`${prefix}.narrowing_provenance.rationale (required when disposition=rejected_with_reason)`);
    }
    const decision = getNestedValue(entry, 'narrowing_provenance.narrowing_decision');
    if (!hasStructuredValue(decision)) {
      warnings.push(`${prefix}.narrowing_provenance.narrowing_decision (strongly recommended when disposition=rejected_with_reason)`);
    }
  }

  return { missing, invalid, warnings };
}

function validateLedgerFrontmatter(fm, schema) {
  const missing = schema.required.filter(f => fm[f] === undefined || fm[f] === null);
  const present = schema.required.filter(f => fm[f] !== undefined && fm[f] !== null);
  const invalid = [];
  const warnings = [];

  // ledger_schema must equal v1
  if (fm[schema.schema_version_field] !== undefined && fm[schema.schema_version_field] !== null) {
    if (String(fm[schema.schema_version_field]) !== schema.schema_version_value) {
      invalid.push(`${schema.schema_version_field}: must equal ${schema.schema_version_value} (got ${JSON.stringify(fm[schema.schema_version_field])})`);
    }
  }

  // generator_role enum
  if (fm.generator_role !== undefined && fm.generator_role !== null) {
    if (!schema.generator_role_enum.includes(String(fm.generator_role))) {
      invalid.push(`generator_role: must be one of ${schema.generator_role_enum.join('|')} (got ${JSON.stringify(fm.generator_role)})`);
    }
  }

  // entries must be an array (may be empty; empty is a warning, not fail)
  if (fm.entries !== undefined && fm.entries !== null) {
    if (!Array.isArray(fm.entries)) {
      invalid.push(`entries: must be an array (got ${typeof fm.entries})`);
    } else {
      if (fm.entries.length === 0) {
        warnings.push('entries: empty array (rare; phases with zero ledger-able claims)');
      }
      for (let i = 0; i < fm.entries.length; i++) {
        const result = validateLedgerEntry(fm.entries[i], i, schema);
        missing.push(...result.missing);
        invalid.push(...result.invalid);
        warnings.push(...result.warnings);
      }
    }
  }

  const allMissing = [...missing, ...invalid];
  return {
    valid: allMissing.length === 0,
    missing,
    invalid,
    present,
    warnings,
    entry_count: Array.isArray(fm.entries) ? fm.entries.length : 0,
  };
}

function cmdFrontmatterGet(cwd, filePath, field, raw) {
  if (!filePath) { error('file path required'); }
  // Path traversal guard: reject null bytes
  if (filePath.includes('\0')) { error('file path contains null bytes'); }
  const fullPath = path.isAbsolute(filePath) ? filePath : path.join(cwd, filePath);
  const content = safeReadFile(fullPath);
  if (!content) { output({ error: 'File not found', path: filePath }, raw); return; }
  const fm = extractFrontmatter(content);
  if (field) {
    const value = fm[field];
    if (value === undefined) { output({ error: 'Field not found', field }, raw); return; }
    output({ [field]: value }, raw, JSON.stringify(value));
  } else {
    output(fm, raw);
  }
}

function cmdFrontmatterSet(cwd, filePath, field, value, raw) {
  if (!filePath || !field || value === undefined) { error('file, field, and value required'); }
  // Path traversal guard: reject null bytes
  if (filePath.includes('\0')) { error('file path contains null bytes'); }
  const fullPath = path.isAbsolute(filePath) ? filePath : path.join(cwd, filePath);
  if (!fs.existsSync(fullPath)) { output({ error: 'File not found', path: filePath }, raw); return; }
  const content = fs.readFileSync(fullPath, 'utf-8');
  const fm = extractFrontmatter(content);
  let parsedValue;
  try { parsedValue = JSON.parse(value); } catch { parsedValue = value; }
  fm[field] = parsedValue;
  const newContent = spliceFrontmatter(content, fm);
  atomicWriteFileSync(fullPath, normalizeMd(newContent), 'utf-8');
  output({ updated: true, field, value: parsedValue }, raw, 'true');
}

function cmdFrontmatterMerge(cwd, filePath, data, raw) {
  if (!filePath || !data) { error('file and data required'); }
  const fullPath = path.isAbsolute(filePath) ? filePath : path.join(cwd, filePath);
  if (!fs.existsSync(fullPath)) { output({ error: 'File not found', path: filePath }, raw); return; }
  const content = fs.readFileSync(fullPath, 'utf-8');
  const fm = extractFrontmatter(content);
  let mergeData;
  try { mergeData = JSON.parse(data); } catch { error('Invalid JSON for --data'); return; }
  Object.assign(fm, mergeData);
  const newContent = spliceFrontmatter(content, fm);
  atomicWriteFileSync(fullPath, normalizeMd(newContent), 'utf-8');
  output({ merged: true, fields: Object.keys(mergeData) }, raw, 'true');
}

function cmdFrontmatterValidate(cwd, filePath, schemaName, raw) {
  if (!filePath || !schemaName) { error('file and schema required'); }
  const schema = FRONTMATTER_SCHEMAS[schemaName];
  if (!schema) { error(`Unknown schema: ${schemaName}. Available: ${Object.keys(FRONTMATTER_SCHEMAS).join(', ')}`); }
  const fullPath = path.isAbsolute(filePath) ? filePath : path.join(cwd, filePath);
  const content = safeReadFile(fullPath);
  if (!content) { output({ error: 'File not found', path: filePath }, raw); return; }
  const fm = extractFrontmatter(content);

  // Ledger validation (GATE-09a) — per-entry array validation + disposition-conditional required fields
  if (schema.ledger) {
    const result = validateLedgerFrontmatter(fm, schema);
    output({
      valid: result.valid,
      missing: result.missing,
      invalid: result.invalid,
      present: result.present,
      warnings: result.warnings,
      entry_count: result.entry_count,
      schema: schemaName,
    }, raw, result.valid ? 'valid' : 'invalid');
    return;
  }

  const missing = schema.required.filter(f => fm[f] === undefined);
  const present = schema.required.filter(f => fm[f] !== undefined);
  const nestedMissing = validateNestedRequiredPaths(fm, schema.nested_required);

  // Tiered validation (signal schema and any future tiered schemas)
  if (schema.conditional || schema.recommended) {
    const conditionalMissing = [];
    const conditionalWarnings = [];
    const backwardCompat = schema.backward_compat && fm[schema.backward_compat.field] === undefined;

    if (schema.conditional) {
      for (const cond of schema.conditional) {
        if (fm[cond.when.field] === cond.when.value) {
          if (cond.require) {
            for (const f of cond.require) {
              if (fm[f] === undefined) {
                if (backwardCompat) {
                  conditionalWarnings.push(`backward_compat: ${f}`);
                } else {
                  conditionalMissing.push(f);
                }
              }
            }
          }
          if (cond.recommend) {
            for (const f of cond.recommend) {
              if (fm[f] === undefined) conditionalWarnings.push(f);
            }
          }
        }
      }
    }

    // Evidence content validation
    if (!backwardCompat && schema.conditional) {
      for (const cond of schema.conditional) {
        if (fm[cond.when.field] === cond.when.value && cond.require) {
          for (const f of cond.require) {
            if (f === 'evidence' && fm.evidence !== undefined) {
              const ev = fm.evidence;
              const hasContent = ev.supporting && ev.supporting.length > 0;
              if (!hasContent) {
                conditionalMissing.push('evidence (empty)');
              }
            }
          }
        }
      }
    }

    const recommendedMissing = [];
    if (schema.recommended) {
      for (const f of schema.recommended) {
        if (fm[f] === undefined) recommendedMissing.push(f);
      }
    }

    const allMissing = [...missing, ...nestedMissing, ...conditionalMissing];
    output({
      valid: allMissing.length === 0,
      missing: allMissing,
      present,
      warnings: [...conditionalWarnings, ...recommendedMissing.map(f => `recommended: ${f}`)],
      schema: schemaName,
    }, raw, allMissing.length === 0 ? 'valid' : 'invalid');
    return;
  }

  // Simple validation (plan/summary/verification)
  const allMissing = [...missing, ...nestedMissing];
  output({ valid: allMissing.length === 0, missing: allMissing, present, schema: schemaName }, raw, allMissing.length === 0 ? 'valid' : 'invalid');
}

module.exports = {
  extractFrontmatter,
  reconstructFrontmatter,
  spliceFrontmatter,
  parseMustHavesBlock,
  FRONTMATTER_SCHEMAS,
  cmdFrontmatterGet,
  cmdFrontmatterSet,
  cmdFrontmatterMerge,
  cmdFrontmatterValidate,
};
