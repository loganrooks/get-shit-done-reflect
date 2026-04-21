#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const os = require('os');
const readline = require('readline');
const crypto = require('crypto');
const { execSync } = require('child_process');
const { getCodexConfigDir } = require('../get-shit-done/bin/lib/update-target.cjs');
const {
  INSTALLER_RUNTIME_METADATA,
  SUPPORTED_INSTALLER_RUNTIMES,
  UNSUPPORTED_INSTALLER_TARGETS,
  getInstallerRuntimeMetadata,
  getInstallerRuntimeLabel,
  expandInstallerRuntimeSelection,
  formatUnsupportedRuntimeMessage,
} = require('../get-shit-done/bin/lib/runtime-support.cjs');

// Colors
const cyan = '\x1b[36m';
const green = '\x1b[32m';
const yellow = '\x1b[33m';
const dim = '\x1b[2m';
const reset = '\x1b[0m';

// Codex agent config.toml marker -- distinct from MCP config marker (GSD:BEGIN)
// Uses marker-to-EOF pattern (upstream parity) rather than BEGIN/END pairs
const GSD_CODEX_MARKER = '# GSD Agent Configuration \u2014 managed by get-shit-done-reflect installer';

const CODEX_AGENT_SANDBOX = {
  'gsd-executor': 'workspace-write',
  'gsd-planner': 'workspace-write',
  'gsd-phase-researcher': 'workspace-write',
  'gsd-project-researcher': 'workspace-write',
  'gsd-research-synthesizer': 'workspace-write',
  'gsd-verifier': 'workspace-write',
  'gsd-codebase-mapper': 'workspace-write',
  'gsd-roadmapper': 'workspace-write',
  'gsd-debugger': 'workspace-write',
  'gsd-plan-checker': 'read-only',
  'gsd-integration-checker': 'read-only',
  'gsd-nyquist-auditor': 'workspace-write',
  'gsd-advisor-researcher': 'read-only',
};

/**
 * Safe wrapper for fs operations with descriptive error messages.
 * Wraps fs.*Sync calls in try-catch, logs operation/path/hint on failure, re-throws.
 * @param {string} operation - Name of the operation (e.g., 'mkdirSync', 'cpSync', 'renameSync')
 * @param {Function} fn - The fs function to call (thunk)
 * @param {string} src - Source path (or target for mkdir)
 * @param {string} [dest] - Destination path (for copy/rename)
 */
function safeFs(operation, fn, src, dest) {
  try {
    return fn();
  } catch (err) {
    const destMsg = dest ? ` -> ${dest}` : '';
    const hint = {
      EACCES: 'Check file/directory permissions',
      ENOSPC: 'Check available disk space',
      ENOENT: 'Source path does not exist',
      EPERM: 'Operation not permitted (check ownership)',
      EEXIST: 'Destination already exists',
    }[err.code] || '';
    console.error(`  ${yellow}!${reset} ${operation} failed: ${src}${destMsg}`);
    console.error(`    Error: ${err.message}`);
    if (hint) console.error(`    Hint: ${hint}`);
    throw err;
  }
}

// Get version from package.json
const pkg = require('../package.json');

// Parse args
const args = process.argv.slice(2);
const hasGlobal = args.includes('--global') || args.includes('-g');
const hasLocal = args.includes('--local') || args.includes('-l');
const hasClaude = args.includes('--claude');
const hasCodex = args.includes('--codex');
const hasOpencode = args.includes('--opencode');
const hasGemini = args.includes('--gemini');
const hasBoth = args.includes('--both');
const hasAll = args.includes('--all');
const hasUninstall = args.includes('--uninstall') || args.includes('-u');

const explicitRuntimeTargets = [];
if (hasClaude) explicitRuntimeTargets.push('claude');
if (hasCodex) explicitRuntimeTargets.push('codex');
if (hasOpencode) explicitRuntimeTargets.push('opencode');
if (hasGemini) explicitRuntimeTargets.push('gemini');
if (hasBoth) explicitRuntimeTargets.push('both');

const unsupportedInstallerTargets = explicitRuntimeTargets.filter((runtime) =>
  UNSUPPORTED_INSTALLER_TARGETS.includes(runtime)
);

let selectedRuntimes = [];
let runtimeSelectionError = null;

try {
  selectedRuntimes = expandInstallerRuntimeSelection({
    all: hasAll,
    explicit: explicitRuntimeTargets,
  });
} catch (error) {
  runtimeSelectionError = error;
}

if (!runtimeSelectionError && unsupportedInstallerTargets.length > 0) {
  runtimeSelectionError = new Error(formatUnsupportedRuntimeMessage(unsupportedInstallerTargets));
}

// Helper to get directory name for a runtime (used for local/project installs)
function getDirName(runtime) {
  const metadata = getInstallerRuntimeMetadata(runtime);
  if (!metadata) {
    throw new Error(formatUnsupportedRuntimeMessage([runtime]));
  }
  return metadata.dirName;
}

/**
 * Get the global config directory for a runtime
 * @param {string} runtime - 'claude' or 'codex'
 * @param {string|null} explicitDir - Explicit directory from --config-dir flag
 */
function getGlobalDir(runtime, explicitDir = null) {
  if (runtime === 'codex') {
    return getCodexConfigDir(explicitDir, process.env, os.homedir());
  }

  if (runtime !== 'claude') {
    throw new Error(formatUnsupportedRuntimeMessage([runtime]));
  }

  // Claude Code: --config-dir > CLAUDE_CONFIG_DIR > ~/.claude
  if (explicitDir) {
    return expandTilde(explicitDir);
  }
  if (process.env.CLAUDE_CONFIG_DIR) {
    return expandTilde(process.env.CLAUDE_CONFIG_DIR);
  }
  return path.join(os.homedir(), '.claude');
}

const banner = '\n' +
  cyan + '   ██████╗ ███████╗██████╗\n' +
  '  ██╔════╝ ██╔════╝██╔══██╗\n' +
  '  ██║  ███╗███████╗██║  ██║\n' +
  '  ██║   ██║╚════██║██║  ██║\n' +
  '  ╚██████╔╝███████║██████╔╝\n' +
  '   ╚═════╝ ╚══════╝╚═════╝' + reset + '\n' +
  yellow + '  ██████╗ ███████╗███████╗██╗     ███████╗ ██████╗████████╗\n' +
  '  ██╔══██╗██╔════╝██╔════╝██║     ██╔════╝██╔════╝╚══██╔══╝\n' +
  '  ██████╔╝█████╗  █████╗  ██║     █████╗  ██║        ██║\n' +
  '  ██╔══██╗██╔══╝  ██╔══╝  ██║     ██╔══╝  ██║        ██║\n' +
  '  ██║  ██║███████╗██║     ███████╗███████╗╚██████╗   ██║\n' +
  '  ╚═╝  ╚═╝╚══════╝╚═╝     ╚══════╝╚══════╝ ╚═════╝   ╚═╝' + reset + '\n' +
  '\n' +
  '  GSD Reflect ' + dim + 'v' + pkg.version + reset + '\n' +
  '  An AI coding agent that learns from its mistakes.\n' +
  '  Built on GSD by TACHES.\n';

// Parse --config-dir argument
function parseConfigDirArg() {
  const configDirIndex = args.findIndex(arg => arg === '--config-dir' || arg === '-c');
  if (configDirIndex !== -1) {
    const nextArg = args[configDirIndex + 1];
    // Error if --config-dir is provided without a value or next arg is another flag
    if (!nextArg || nextArg.startsWith('-')) {
      console.error(`  ${yellow}--config-dir requires a path argument${reset}`);
      process.exit(1);
    }
    return nextArg;
  }
  // Also handle --config-dir=value format
  const configDirArg = args.find(arg => arg.startsWith('--config-dir=') || arg.startsWith('-c='));
  if (configDirArg) {
    const value = configDirArg.split('=')[1];
    if (!value) {
      console.error(`  ${yellow}--config-dir requires a non-empty path${reset}`);
      process.exit(1);
    }
    return value;
  }
  return null;
}
const explicitConfigDir = parseConfigDirArg();
const hasHelp = args.includes('--help') || args.includes('-h');
const forceStatusline = args.includes('--force-statusline');

// Only print banner and show help when run directly (not when required as a module)
if (require.main === module) {
  console.log(banner);

  if (hasHelp) {
    console.log(`  ${yellow}Usage:${reset} npx get-shit-done-reflect-cc [options]\n\n  ${yellow}Options:${reset}\n    ${cyan}-g, --global${reset}              Install globally (to config directory)\n    ${cyan}-l, --local${reset}               Install locally (to current directory)\n    ${cyan}--claude${reset}                  Install for Claude Code only\n    ${cyan}--codex${reset}                   Install for Codex CLI only\n    ${cyan}--all${reset}                     Install for all supported runtimes (${SUPPORTED_INSTALLER_RUNTIMES.join(', ')})\n    ${cyan}-u, --uninstall${reset}           Uninstall GSD (remove all GSD files)\n    ${cyan}-c, --config-dir <path>${reset}   Specify custom config directory\n    ${cyan}-h, --help${reset}                Show this help message\n    ${cyan}--force-statusline${reset}        Replace existing statusline config\n\n  ${yellow}Examples:${reset}\n    ${dim}# Interactive install (prompts for runtime and location)${reset}\n    npx get-shit-done-reflect-cc\n\n    ${dim}# Install for Claude Code globally${reset}\n    npx get-shit-done-reflect-cc --claude --global\n\n    ${dim}# Install for Codex CLI globally${reset}\n    npx get-shit-done-reflect-cc --codex --global\n\n    ${dim}# Install for all supported runtimes globally${reset}\n    npx get-shit-done-reflect-cc --all --global\n\n    ${dim}# Install to custom config directory${reset}\n    npx get-shit-done-reflect-cc --claude --global --config-dir ~/.claude-bc\n\n    ${dim}# Install to current project only${reset}\n    npx get-shit-done-reflect-cc --claude --local\n\n    ${dim}# Uninstall GSD from Claude Code globally${reset}\n    npx get-shit-done-reflect-cc --claude --global --uninstall\n\n  ${yellow}Notes:${reset}\n    Unsupported legacy flags ${cyan}--opencode${reset}, ${cyan}--gemini${reset}, and ${cyan}--both${reset} now exit with migration guidance.\n    The --config-dir option takes priority over CLAUDE_CONFIG_DIR / CODEX_CONFIG_DIR environment variables.\n`);
    process.exit(0);
  }
}

/**
 * Expand ~ to home directory (shell doesn't expand in env vars passed to node)
 */
function expandTilde(filePath) {
  if (filePath && filePath.startsWith('~/')) {
    return path.join(os.homedir(), filePath.slice(2));
  }
  return filePath;
}

/**
 * Get the GSD home directory.
 * Priority: GSD_HOME env var > ~/.gsd (default)
 * @returns {string} Absolute path to GSD home directory
 */
function getGsdHome() {
  if (process.env.GSD_HOME) {
    const gsdHome = process.env.GSD_HOME;
    if (gsdHome.startsWith('~/')) {
      return path.join(os.homedir(), gsdHome.slice(2));
    }
    return gsdHome;
  }
  return path.join(os.homedir(), '.gsd');
}

/**
 * Count .md files in KB subdirectories (signals/, spikes/, lessons/)
 * @param {string} kbDir - Path to knowledge base directory
 * @returns {number} Total count of .md files
 */
function countKBEntries(kbDir) {
  let count = 0;
  for (const subdir of ['signals', 'spikes', 'lessons']) {
    const typeDir = path.join(kbDir, subdir);
    if (!fs.existsSync(typeDir)) continue;
    const entries = fs.readdirSync(typeDir, { recursive: true });
    count += entries.filter(f => typeof f === 'string' && f.endsWith('.md')).length;
  }
  return count;
}

/**
 * Migrate knowledge base to runtime-agnostic location.
 *
 * 1. Creates ~/.gsd/knowledge/{signals,spikes,lessons}
 * 2. If old KB (~/.claude/gsd-knowledge/) exists and is NOT a symlink:
 *    copies data, verifies entry count, creates backup, creates symlink
 * 3. If old KB is already a symlink: skips (idempotent)
 * 4. If old KB doesn't exist: optionally creates symlink for Claude runtime
 *
 * @param {string} gsdHome - GSD home directory (e.g., ~/.gsd)
 * @param {string[]} [runtimes=[]] - Selected runtimes for symlink decision
 */
function migrateKB(gsdHome, runtimes) {
  if (!runtimes) runtimes = [];
  const newKBDir = path.join(gsdHome, 'knowledge');

  // PRE-MIGRATION BACKUP: Safety net before any KB operations
  if (fs.existsSync(newKBDir)) {
    const existingEntries = countKBEntries(newKBDir);
    if (existingEntries > 0) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const backupDir = newKBDir + '.backup-' + timestamp;
      safeFs('cpSync', () => fs.cpSync(newKBDir, backupDir, { recursive: true }), newKBDir, backupDir);

      // Verify backup integrity
      const backupEntries = countKBEntries(backupDir);
      if (backupEntries < existingEntries) {
        console.error(`  ${yellow}!${reset} Backup verification failed: ${existingEntries} entries in source, ${backupEntries} in backup`);
        console.error(`    Aborting migration. Manual intervention required.`);
        return;
      }
      console.log(`  ${green}+${reset} Backed up ${existingEntries} KB entries to ${path.basename(backupDir)}`);
    }
  }

  // Step 1: Create new KB directory structure
  safeFs('mkdirSync', () => fs.mkdirSync(path.join(newKBDir, 'signals'), { recursive: true }), path.join(newKBDir, 'signals'));
  safeFs('mkdirSync', () => fs.mkdirSync(path.join(newKBDir, 'spikes'), { recursive: true }), path.join(newKBDir, 'spikes'));
  safeFs('mkdirSync', () => fs.mkdirSync(path.join(newKBDir, 'lessons'), { recursive: true }), path.join(newKBDir, 'lessons'));

  const oldKBDir = path.join(os.homedir(), '.claude', 'gsd-knowledge');

  // Check for dangling symlink at old path (existsSync returns false for dangling symlinks)
  try {
    const oldStat = fs.lstatSync(oldKBDir);
    if (oldStat.isSymbolicLink()) {
      // Symlink exists — check if target is valid
      if (!fs.existsSync(oldKBDir)) {
        // Dangling symlink — remove it and create fresh one pointing to new location
        console.log(`  ${yellow}!${reset} Removing dangling symlink at ${oldKBDir}`);
        fs.unlinkSync(oldKBDir);
        fs.symlinkSync(newKBDir, oldKBDir);
        console.log(`  ${green}✓${reset} Knowledge base already at: ${newKBDir}`);
        return;
      }
    }
  } catch (e) {
    // lstat failed — path doesn't exist at all, proceed normally
  }

  // Step 2: Check if old KB exists
  if (fs.existsSync(oldKBDir)) {
    // Check if it's already a symlink (re-install after migration)
    let isSymlink = false;
    try {
      isSymlink = fs.lstatSync(oldKBDir).isSymbolicLink();
    } catch (e) {
      // lstat failed, treat as not a symlink
    }

    if (isSymlink) {
      // Already migrated - skip
      console.log(`  ${green}✓${reset} Knowledge base already at: ${newKBDir}`);
      return;
    }

    // First migration: copy old to new
    const oldEntries = countKBEntries(oldKBDir);
    if (oldEntries > 0) {
      safeFs('cpSync', () => fs.cpSync(oldKBDir, newKBDir, { recursive: true }), oldKBDir, newKBDir);

      // Verify zero data loss
      const newEntries = countKBEntries(newKBDir);
      if (newEntries < oldEntries) {
        console.error(`  ${yellow}✗${reset} Migration verification failed: ${oldEntries} entries in source, ${newEntries} in destination`);
        console.error(`    Both copies preserved. Manual intervention required.`);
        return;
      }
    }

    // Rename old to backup, create symlink
    const backupDir = oldKBDir + '.migration-backup';
    // Check for existing backup — append timestamp if collision
    let finalBackupDir = backupDir;
    if (fs.existsSync(backupDir)) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      finalBackupDir = backupDir + '-' + timestamp;
    }
    safeFs('renameSync', () => fs.renameSync(oldKBDir, finalBackupDir), oldKBDir, finalBackupDir);
    fs.symlinkSync(newKBDir, oldKBDir);
    console.log(`  ${green}✓${reset} Migrated knowledge base: ${oldEntries} entries`);
    console.log(`    ${oldKBDir} -> ${newKBDir}`);
    return;
  }

  // Step 3: Old KB doesn't exist - create symlink only for Claude runtime
  if (runtimes.includes('claude')) {
    // Ensure ~/.claude/ directory exists
    safeFs('mkdirSync', () => fs.mkdirSync(path.join(os.homedir(), '.claude'), { recursive: true }), path.join(os.homedir(), '.claude'));
    // Create symlink from old path to new path
    if (!fs.existsSync(oldKBDir)) {
      fs.symlinkSync(newKBDir, oldKBDir);
    }
  }

  console.log(`  ${green}✓${reset} Created knowledge base at: ${newKBDir}`);
}

/**
 * Copy KB management scripts to ~/.gsd/bin/ so they are accessible
 * from any runtime (not just Claude). Source scripts remain in
 * .claude/agents/ in the repo as the source of truth.
 */
function installKBScripts(gsdHome) {
  const binDir = path.join(gsdHome, 'bin');
  safeFs('mkdirSync', () => fs.mkdirSync(binDir, { recursive: true }), binDir);

  const scriptSrcDir = path.join(__dirname, '..', '.claude', 'agents');
  const scripts = ['kb-rebuild-index.sh', 'kb-create-dirs.sh'];

  for (const script of scripts) {
    const src = path.join(scriptSrcDir, script);
    const dest = path.join(binDir, script);
    if (!fs.existsSync(src)) {
      console.log(`  ${yellow}!${reset} KB script not found, skipping: ${src}`);
      continue;
    }
    fs.copyFileSync(src, dest);
    fs.chmodSync(dest, 0o755);
  }

  console.log(`  ${green}+${reset} Installed KB scripts to ${binDir}`);
}

/**
 * Create project-local KB directories when .planning/ exists.
 * This enables project-local knowledge storage as primary KB location.
 * Creates .planning/knowledge/{signals,reflections,spikes} directories.
 * Does NOT create lessons/ (lessons are deprecated).
 */
function createProjectLocalKB() {
  const planningDir = path.join(process.cwd(), '.planning');
  if (!fs.existsSync(planningDir)) {
    return;
  }

  const kbDir = path.join(planningDir, 'knowledge');
  const subdirs = ['signals', 'reflections', 'spikes'];

  for (const sub of subdirs) {
    const subPath = path.join(kbDir, sub);
    if (!fs.existsSync(subPath)) {
      safeFs('mkdirSync', () => fs.mkdirSync(subPath, { recursive: true }), subPath);
    }
  }

  console.log(`  ${green}+${reset} Project-local KB at .planning/knowledge/`);
}

/**
 * Build a hook command path using forward slashes for cross-platform compatibility.
 * On Windows, $HOME is not expanded by cmd.exe/PowerShell, so we use the actual path.
 */
function buildHookCommand(configDir, hookName) {
  // Use forward slashes for Node.js compatibility on all platforms
  const hooksPath = configDir.replace(/\\/g, '/') + '/hooks/' + hookName;
  return `node "${hooksPath}"`;
}

/**
 * Build a worktree-safe hook command for local/project installs.
 * Anchors to $CLAUDE_PROJECT_DIR so path resolution is correct regardless
 * of the shell's current working directory (#1906 upstream fix). Also wraps
 * with shell existence guard so hooks exit 0 silently when .claude/ is absent
 * (e.g., in git worktrees where .claude/ is gitignored and not present).
 */
function buildLocalHookCommand(dirName, hookName) {
  const localPrefix = '"$CLAUDE_PROJECT_DIR"/' + dirName;
  const hookPath = localPrefix + '/hooks/' + hookName;
  return 'test -f ' + localPrefix + '/hooks/' + hookName + ' && node ' + hookPath + ' || true';
}

/**
 * Read and parse settings.json, returning empty object if it doesn't exist
 */
function readSettings(settingsPath) {
  if (fs.existsSync(settingsPath)) {
    try {
      return JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    } catch (e) {
      return {};
    }
  }
  return {};
}

/**
 * Write settings.json with proper formatting
 */
function writeSettings(settingsPath, settings) {
  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + '\n');
}

// Cache for attribution settings (populated once per runtime during install)
const attributionCache = new Map();

/**
 * Get commit attribution setting for a runtime
 * @param {string} runtime - 'claude' or 'codex'
 * @returns {null|undefined|string} null = remove, undefined = keep default, string = custom
 */
function getCommitAttribution(runtime) {
  // Return cached value if available
  if (attributionCache.has(runtime)) {
    return attributionCache.get(runtime);
  }

  let result;

  if (runtime === 'codex') {
    // Codex CLI: no settings.json, keep default attribution
    result = undefined;
  } else {
    // Claude Code
    const settings = readSettings(path.join(getGlobalDir('claude', explicitConfigDir), 'settings.json'));
    if (!settings.attribution || settings.attribution.commit === undefined) {
      result = undefined;
    } else if (settings.attribution.commit === '') {
      result = null;
    } else {
      result = settings.attribution.commit;
    }
  }

  // Cache and return
  attributionCache.set(runtime, result);
  return result;
}

/**
 * Process Co-Authored-By lines based on attribution setting
 * @param {string} content - File content to process
 * @param {null|undefined|string} attribution - null=remove, undefined=keep, string=replace
 * @returns {string} Processed content
 */
function processAttribution(content, attribution) {
  if (attribution === null) {
    // Remove Co-Authored-By lines and the preceding blank line
    return content.replace(/(\r?\n){2}Co-Authored-By:.*$/gim, '');
  }
  if (attribution === undefined) {
    return content;
  }
  // Replace with custom attribution (escape $ to prevent backreference injection)
  const safeAttribution = attribution.replace(/\$/g, '$$$$');
  return content.replace(/Co-Authored-By:.*$/gim, `Co-Authored-By: ${safeAttribution}`);
}

// Tool name mapping from Claude Code to Codex CLI
// Codex CLI uses snake_case built-in tool names (codex-rs)
const claudeToCodexTools = {
  Read: 'read_file',
  Write: 'apply_patch',
  Edit: 'apply_patch',
  Bash: 'shell',
  Glob: 'list_dir',
  Grep: 'grep_files',
  WebSearch: 'web_search',
  WebFetch: null,
  AskUserQuestion: 'request_user_input',
  Task: null,
  TodoWrite: 'update_plan',
  SlashCommand: null,
};

/**
 * Extract YAML frontmatter and body from markdown content.
 * @param {string} content - File content potentially starting with ---
 * @returns {{ frontmatter: string|null, body: string }}
 */
function extractFrontmatterAndBody(content) {
  if (!content.startsWith('---')) {
    return { frontmatter: null, body: content };
  }
  const endIndex = content.indexOf('---', 3);
  if (endIndex === -1) {
    return { frontmatter: null, body: content };
  }
  return {
    frontmatter: content.substring(3, endIndex).trim(),
    body: content.substring(endIndex + 3),
  };
}

/**
 * Extract a single field value from parsed frontmatter text.
 * @param {string} frontmatter - Raw frontmatter text (without --- delimiters)
 * @param {string} fieldName - Field name to extract
 * @returns {string|null} Field value or null
 */
function extractFrontmatterField(frontmatter, fieldName) {
  const regex = new RegExp(`^${fieldName}:\\s*(.+)$`, 'm');
  const match = frontmatter.match(regex);
  if (!match) return null;
  return match[1].trim().replace(/^['"]|['"]$/g, '');
}

/**
 * Convert Claude Code markdown content to Codex-compatible markdown.
 * Applies content-level conversions for workflow/reference/template files:
 * - Replaces /gsdr:command-name with $gsdr-command-name for Codex skill mention syntax
 * - Replaces $ARGUMENTS with {{GSD_ARGS}} Codex argument placeholder
 * Note: This does NOT do full skill conversion (see convertClaudeToCodexSkill for that).
 * @param {string} content - Markdown file content
 * @returns {string} - Converted markdown content
 */
function convertClaudeToCodexMarkdown(content) {
  let converted = content;
  // Replace /gsdr:command-name with $gsdr-command-name for Codex skill mention syntax
  converted = converted.replace(/\/gsdr:([a-z0-9-]+)/gi, '\\$gsdr-$1');
  // Replace $ARGUMENTS with Codex argument placeholder
  converted = converted.replace(/\$ARGUMENTS\b/g, '{{GSD_ARGS}}');
  return converted;
}

/**
 * Convert Claude Code agent markdown to Codex agent TOML format.
 * Uses TOML literal multi-line strings (''') for developer_instructions
 * to avoid backslash escape issues with bash/regex patterns in agent content.
 * @param {string} content - Markdown file content with optional YAML frontmatter
 * @param {string} [agentName] - Agent name for sandbox mode lookup (e.g., 'gsdr-executor')
 * @returns {string} - TOML content with literal string delimiters
 */
function convertClaudeToCodexAgentToml(content, agentName) {
  let description = '';
  let name = '';
  let body = content;

  // Parse YAML frontmatter if present
  const { frontmatter, body: rawBody } = extractFrontmatterAndBody(content);
  if (frontmatter) {
    body = rawBody.trim();
    description = extractFrontmatterField(frontmatter, 'description') || '';
    name = extractFrontmatterField(frontmatter, 'name') || '';
  }

  // Fallback description if not found in frontmatter
  if (!description) {
    description = name ? `GSD agent: ${name}` : 'GSD agent';
  }

  // Resolve sandbox mode: strip gsdr- prefix for lookup, default to read-only
  let sandboxKey = agentName || '';
  if (sandboxKey.startsWith('gsdr-')) {
    sandboxKey = sandboxKey.replace(/^gsdr-/, 'gsd-');
  }
  const sandboxMode = CODEX_AGENT_SANDBOX[sandboxKey] || 'read-only';

  // Escape any triple single quotes in body to avoid premature TOML literal string termination
  const safeBody = body.replace(/'''/g, "' ' '");

  // Build TOML with literal multi-line string (''') for developer_instructions
  let toml = `description = ${JSON.stringify(description)}\n`;
  toml += `sandbox_mode = "${sandboxMode}"\n`;
  toml += `developer_instructions = '''\n${safeBody}\n'''\n`;

  return toml;
}

/**
 * Convert a Claude Code command markdown into Codex SKILL.md format.
 * - Replaces tool name references in body text using word-boundary regex
 * - Replaces /gsdr:command-name with $gsdr-command-name for Codex skill mention syntax
 * - Converts @~/.codex/ file references to explicit read instructions
 * - Parses frontmatter: keeps only name (rewritten) and description (truncated to 1024 chars)
 * - Drops allowed-tools, argument-hint, color fields
 * @param {string} content - Markdown file content with YAML frontmatter
 * @param {string} commandName - The skill name (e.g., 'gsd-help')
 * @param {string} [pathPrefix] - Runtime path prefix (e.g., '~/.codex/' or '/abs/path/.codex/') for @ reference conversion
 * @returns {string} - SKILL.md content
 */
function convertClaudeToCodexSkill(content, commandName, pathPrefix) {
  // Step 1: Replace tool name references in body text
  let converted = content;
  for (const [claudeTool, codexTool] of Object.entries(claudeToCodexTools)) {
    if (codexTool === null) continue;
    converted = converted.replace(new RegExp(`\\b${claudeTool}\\b`, 'g'), codexTool);
  }

  // Step 2: Replace /gsdr:command with $gsdr-command for Codex skill mention
  converted = converted.replace(/\/gsdr:([a-z0-9-]+)/g, '\\$gsdr-$1');

  // Step 3: Convert @ file references to explicit read instructions
  // (After path replacement has already changed ~/.claude/ to the runtime prefix)
  if (pathPrefix) {
    const escapedPrefix = pathPrefix.replace(/[.*+?^${}()|[\]\\\/]/g, '\\$&');
    converted = converted.replace(new RegExp(`@(${escapedPrefix}[^\\s]+)`, 'g'), 'Read the file at `$1`');
  }
  // Also match tilde variant as fallback (covers calls without pathPrefix)
  converted = converted.replace(/@(~\/\.codex\/[^\s]+)/g, 'Read the file at `$1`');

  // Step 4: Parse frontmatter and rebuild as SKILL.md format
  const { frontmatter, body } = extractFrontmatterAndBody(converted);
  if (!frontmatter) {
    return `---\nname: ${commandName}\ndescription: GSD command: ${commandName}\n---\n\n${converted}`;
  }

  // Parse frontmatter fields
  let description = '';
  const lines = frontmatter.split('\n');
  let inArrayField = false;

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith('description:')) {
      description = trimmed.substring(12).trim();
      inArrayField = false;
      continue;
    }

    // Skip fields not in SKILL.md schema
    if (trimmed.startsWith('name:') ||
        trimmed.startsWith('allowed-tools:') ||
        trimmed.startsWith('argument-hint:') ||
        trimmed.startsWith('color:')) {
      inArrayField = trimmed.startsWith('allowed-tools:');
      continue;
    }

    // Skip array items from allowed-tools
    if (inArrayField && trimmed.startsWith('- ')) {
      continue;
    } else if (inArrayField && !trimmed.startsWith('-')) {
      inArrayField = false;
    }
  }

  // Truncate description to 1024 chars, remove angle brackets
  description = description.replace(/[<>]/g, '').substring(0, 1024);
  if (!description) {
    description = `GSD command: ${commandName}`;
  }

  return `---\nname: ${commandName}\ndescription: ${description}\n---${body}`;
}

/**
 * Copy GSD commands as Codex Skill directories.
 * Each command becomes a directory with a SKILL.md file inside.
 * Source: commands/gsd/help.md -> skills/gsd-help/SKILL.md
 * Source: commands/gsd/debug/start.md -> skills/gsd-debug-start/SKILL.md
 * @param {string} srcDir - Source directory (e.g., commands/gsd/)
 * @param {string} destDir - Destination directory (e.g., skills/)
 * @param {string} prefix - Prefix for skill names (e.g., 'gsd')
 * @param {string} pathPrefix - Path prefix for file references
 */
function copyCodexSkills(srcDir, destDir, prefix, pathPrefix) {
  if (!fs.existsSync(srcDir)) return;

  // Clean existing GSD skills before copying new ones
  if (fs.existsSync(destDir)) {
    for (const entry of fs.readdirSync(destDir, { withFileTypes: true })) {
      if (entry.isDirectory() && entry.name.startsWith(`${prefix}-`)) {
        fs.rmSync(path.join(destDir, entry.name), { recursive: true });
      }
    }
  } else {
    safeFs('mkdirSync', () => fs.mkdirSync(destDir, { recursive: true }), destDir);
  }

  const entries = fs.readdirSync(srcDir, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(srcDir, entry.name);

    if (entry.isDirectory()) {
      // Recurse: commands/gsd/debug/start.md -> skills/gsd-debug-start/SKILL.md
      copyCodexSkills(srcPath, destDir, `${prefix}-${entry.name}`, pathPrefix);
    } else if (entry.name.endsWith('.md')) {
      const baseName = entry.name.replace('.md', '');
      const skillName = `${prefix}-${baseName}`;
      const skillDir = path.join(destDir, skillName);

      safeFs('mkdirSync', () => fs.mkdirSync(skillDir, { recursive: true }), skillDir);

      let content = fs.readFileSync(srcPath, 'utf8');
      content = replacePathsInContent(content, pathPrefix, './.codex/');
      content = processAttribution(content, getCommitAttribution('codex'));
      content = convertClaudeToCodexSkill(content, skillName, pathPrefix);

      fs.writeFileSync(path.join(skillDir, 'SKILL.md'), content);
    }
  }
}

/**
 * Generate ~/.codex/AGENTS.md with GSD workflow instructions.
 * Uses marker comments for idempotent section replacement.
 * Content is kept under 4KB to leave room for project-level AGENTS.md.
 * @param {string} targetDir - Codex config directory (e.g., ~/.codex)
 * @param {string} pathPrefix - Path prefix for file references
 */
function generateCodexAgentsMd(targetDir, pathPrefix) {
  const agentsMdPath = path.join(targetDir, 'AGENTS.md');
  const GSD_BEGIN = '<!-- GSD:BEGIN (get-shit-done-reflect-cc) -->';
  const GSD_END = '<!-- GSD:END (get-shit-done-reflect-cc) -->';

  const gsdSection = `${GSD_BEGIN}
# GSD Workflow System

GSD (Get Shit Done) is installed as Codex skills for structured project planning and execution.

## Available Commands

Use \`/skills\` or type \`$gsdr-\` to discover GSD commands:

| Command | Purpose |
|---------|---------|
| \`$gsdr-help\` | Show all commands and usage |
| \`$gsdr-new-project\` | Initialize a new project |
| \`$gsdr-plan-phase\` | Plan a project phase |
| \`$gsdr-execute-phase\` | Execute a planned phase |
| \`$gsdr-resume-work\` | Resume from last session |
| \`$gsdr-pause-work\` | Save state for later |
| \`$gsdr-progress\` | Show project progress |
| \`$gsdr-signal\` | Record a signal (insight, mistake, etc.) |

## Workflow Conventions

- All project state lives in \`.planning/\` (git-committed, runtime-agnostic)
- Follow existing ROADMAP.md phases in order
- Verify each task before marking complete
- Use atomic git commits per completed task
- Read \`~/.gsd/knowledge/index.md\` before starting work for relevant lessons

## Runtime Capabilities

This runtime differs from Claude Code in a few important ways:
- **Task tool support is available via Codex subagents/threads** -- Codex can delegate bounded subtasks and run them in parallel, but the control surface differs from Claude's \`Task()\`-style spawning. Some GSD workflows may still fall back to sequential execution until they are adapted to Codex-native delegation patterns.
- **No hooks support** -- pre-commit hooks and other lifecycle hooks are unavailable in Codex
- **No tool restrictions** -- Codex does not support allowed-tools filtering, so all tools are always available to skills

For full runtime comparison, read the file at \`${pathPrefix}get-shit-done-reflect/references/capability-matrix.md\`.

## Non-interactive Usage (codex exec)

For scripted or CI environments, use \`codex exec\` to run GSD skills non-interactively:

\`\`\`
codex exec "Run $gsdr-progress to show current project status"
codex exec "Run $gsdr-execute-phase 3"
\`\`\`

This bypasses the interactive prompt and executes directly.
${GSD_END}`;

  if (fs.existsSync(agentsMdPath)) {
    let existing = fs.readFileSync(agentsMdPath, 'utf8');
    const beginIdx = existing.indexOf(GSD_BEGIN);
    const endIdx = existing.indexOf(GSD_END);

    if (beginIdx !== -1 && endIdx !== -1) {
      // Replace existing GSD section
      existing = existing.substring(0, beginIdx) + gsdSection +
                 existing.substring(endIdx + GSD_END.length);
    } else {
      // Append GSD section
      existing = existing.trimEnd() + '\n\n' + gsdSection + '\n';
    }
    fs.writeFileSync(agentsMdPath, existing);
  } else {
    fs.writeFileSync(agentsMdPath, gsdSection + '\n');
  }
}

// Known MCP servers used by GSD
const gsdMcpServers = {
  context7: {
    command: 'npx',
    args: ['-y', '@upstash/context7-mcp']
  }
};

function getCodexCompactPromptPath(targetDir) {
  return path.join(targetDir, 'get-shit-done-reflect', 'templates', 'codex-compact-prompt.md').replace(/\\/g, '/');
}

/**
 * Generate the GSD-managed Codex CLI config.toml block.
 * Uses marker-based section management (# GSD:BEGIN / # GSD:END) for idempotent updates.
 * Includes MCP servers plus the documented experimental_compact_prompt_file override.
 * Creates config.toml if it doesn't exist, merges with existing if it does.
 * @param {string} targetDir - Codex config directory (e.g., ~/.codex)
 */
function generateCodexMcpConfig(targetDir) {
  const configPath = path.join(targetDir, 'config.toml');
  const GSD_BEGIN = '# GSD:BEGIN (get-shit-done-reflect-cc)';
  const GSD_END = '# GSD:END (get-shit-done-reflect-cc)';
  const compactPromptPath = getCodexCompactPromptPath(targetDir);

  // Build TOML section for all known MCP servers
  const serverEntries = Object.entries(gsdMcpServers).map(([name, server]) => {
    const argsStr = server.args.map(a => JSON.stringify(a)).join(', ');
    return `[mcp_servers.${name}]\ncommand = ${JSON.stringify(server.command)}\nargs = [${argsStr}]`;
  }).join('\n\n');

  const tomlSection = `${GSD_BEGIN}\nexperimental_compact_prompt_file = ${JSON.stringify(compactPromptPath)}\n\n${serverEntries}\n${GSD_END}`;

  if (fs.existsSync(configPath)) {
    let existing = fs.readFileSync(configPath, 'utf8');
    const beginIdx = existing.indexOf(GSD_BEGIN);
    const endIdx = existing.indexOf(GSD_END);

    if (beginIdx !== -1 && endIdx !== -1) {
      // Replace existing GSD section
      existing = existing.substring(0, beginIdx) + tomlSection + existing.substring(endIdx + GSD_END.length);
    } else {
      // Append GSD section
      existing = existing.trimEnd() + '\n\n' + tomlSection + '\n';
    }
    fs.writeFileSync(configPath, existing);
  } else {
    fs.writeFileSync(configPath, tomlSection + '\n');
  }
}

/**
 * Generate a TOML config block for registering GSD agents in Codex config.toml.
 * Uses marker-to-EOF pattern (upstream parity) with [agents.name] entries.
 * @param {Array<{name: string, description: string}>} agents - Agent metadata
 * @returns {string} - TOML config block with marker header
 */
function generateCodexConfigBlock(agents, targetDir) {
  const agentsPrefix = targetDir
    ? path.join(targetDir, 'agents').replace(/\\/g, '/')
    : 'agents';
  const lines = [
    GSD_CODEX_MARKER,
    '',
  ];
  for (const { name, description } of agents) {
    lines.push(`[agents.${name}]`);
    lines.push(`description = ${JSON.stringify(description)}`);
    lines.push(`config_file = "${agentsPrefix}/${name}.toml"`);
    lines.push('');
  }
  return lines.join('\n');
}

/**
 * Strip GSD agent registration from Codex config.toml content.
 * Removes everything from GSD_CODEX_MARKER to EOF, preserving content before marker.
 * @param {string} content - config.toml content
 * @returns {string|null} - Cleaned content, or null if file would be empty
 */
function stripGsdFromCodexConfig(content) {
  const markerIndex = content.indexOf(GSD_CODEX_MARKER);
  if (markerIndex !== -1) {
    let before = content.substring(0, markerIndex).trimEnd();
    return before || null;
  }
  return content;
}

/**
 * Merge GSD agent config block into Codex config.toml.
 * Creates file if missing, replaces existing GSD section if present, appends otherwise.
 * @param {string} configPath - Path to config.toml
 * @param {string} gsdBlock - TOML block from generateCodexConfigBlock
 */
function mergeCodexConfig(configPath, gsdBlock) {
  if (!fs.existsSync(configPath)) {
    fs.writeFileSync(configPath, gsdBlock + '\n');
    return;
  }
  const existing = fs.readFileSync(configPath, 'utf8');
  const markerIndex = existing.indexOf(GSD_CODEX_MARKER);
  if (markerIndex !== -1) {
    let before = existing.substring(0, markerIndex).trimEnd();
    if (before) {
      fs.writeFileSync(configPath, before + '\n\n' + gsdBlock + '\n');
    } else {
      fs.writeFileSync(configPath, gsdBlock + '\n');
    }
    return;
  }
  const content = existing.trimEnd() + '\n\n' + gsdBlock + '\n';
  fs.writeFileSync(configPath, content);
}

/**
 * Replace path references in file content using a two-pass approach.
 *
 * Pass 1 (Shared paths): Replace ~/.claude/gsd-knowledge with ~/.gsd/knowledge
 * and $HOME/.claude/gsd-knowledge with $HOME/.gsd/knowledge. These are shared
 * across all runtimes and must NOT be transformed to runtime-specific locations.
 *
 * Pass 2 (Runtime-specific paths): Replace remaining ~/.claude/ references with
 * runtimePathPrefix, and $HOME/.claude/ with the $HOME equivalent. A negative
 * lookahead for gsd-knowledge is included as a safety guard.
 *
 * @param {string} content - File content to process
 * @param {string} runtimePathPrefix - Target runtime path (e.g., "~/.codex/")
 * @param {string|null} [runtimeLocalPathPrefix] - Relative runtime path for
 * local-scope references (e.g. "./.codex/")
 * @returns {string} Content with paths replaced
 */
function replacePathsInContent(content, runtimePathPrefix, runtimeLocalPathPrefix = null) {
  // Pass 1: Replace shared KB paths (tilde and $HOME variants)
  let result = content.replace(/~\/\.claude\/gsd-knowledge/g, '~/.gsd/knowledge');
  result = result.replace(/\$HOME\/\.claude\/gsd-knowledge/g, '$HOME/.gsd/knowledge');

  // Pass 2: Replace remaining runtime-specific paths
  // Negative lookahead for gsd-knowledge as a safety guard (Pass 1 already handled them)
  result = result.replace(/~\/\.claude\/(?!gsd-knowledge)(?! )/g, runtimePathPrefix);

  // Handle $HOME/.claude/ variant for runtime-specific paths
  // Derive the HOME-relative path suffix for $HOME substitution
  let runtimeSuffix;
  if (runtimePathPrefix.startsWith('~/')) {
    // Tilde prefix: strip ~/ to get relative-to-home path
    runtimeSuffix = runtimePathPrefix.slice(2);
  } else if (runtimePathPrefix.startsWith('$HOME/')) {
    // $HOME prefix (e.g., global install pathPrefix): strip $HOME/ to avoid doubling
    runtimeSuffix = runtimePathPrefix.slice('$HOME/'.length);
  } else if (runtimePathPrefix.startsWith(os.homedir())) {
    // Absolute prefix: strip home directory to get relative-to-home path
    runtimeSuffix = runtimePathPrefix.slice(os.homedir().length + 1);
  } else {
    // Relative or other prefix (e.g., local install ./.claude/)
    // $HOME patterns are unlikely in local installs, but handle gracefully
    runtimeSuffix = runtimePathPrefix;
  }
  result = result.replace(/\$HOME\/\.claude\/(?!gsd-knowledge)(?! )/g, '$HOME/' + runtimeSuffix);

  if (runtimeLocalPathPrefix) {
    result = result.replace(/\.\/\.claude\/(?!gsd-knowledge)(?! )/g, runtimeLocalPathPrefix);
  }

  // Pass 3: GSDR namespace rewriting (install-time co-installation isolation)
  // Order: 3a before 3c to avoid partial matches on directory path
  // Safety: (?!tools) in 3c preserves gsd-tools.cjs filename (237 occurrences)
  //
  // Double-replacement safety (proven by deliberation):
  // - get-shit-done/ requires /. get-shit-done-reflect/ has - not /. No match.
  // - /gsd: requires :. /gsdr: has r not :. No match.
  // - gsd- requires -. gsdr- has r not -. No match.

  // 3a: Runtime directory in remaining path refs
  result = result.replace(/get-shit-done\//g, 'get-shit-done-reflect/');
  // 3b: Command prefix
  result = result.replace(/\/gsd:/g, '/gsdr:');
  // 3c: Agent/hook/subagent_type prefix — exclude gsd-tools (filename, not namespace)
  result = result.replace(/\bgsd-(?!tools)/g, 'gsdr-');
  // 3d: UI banner prefix
  result = result.replace(/GSD ►/g, 'GSDR ►');

  return result;
}

/**
 * Inject version into command file frontmatter description.
 * Appends "(vX.Y.Z)" to the description field so users can see which
 * version a command comes from in autocomplete. Claude Code already
 * discriminates local vs global by path, so scope is not included.
 *
 * @param {string} content - File content with YAML frontmatter
 * @param {string} version - Version string (e.g., "1.15.0")
 * @param {string} _scope - Unused (kept for call-site compatibility)
 * @returns {string} Modified content with version in description
 */
function injectVersionScope(content, version, _scope) {
  const { frontmatter, body } = extractFrontmatterAndBody(content);
  if (!frontmatter) return content;
  const delimited = `---\n${frontmatter}\n---`;
  // Strip any existing version suffix (with or without scope/+dev) before adding new one
  const modified = delimited.replace(
    /^(description:\s*)(.+?)(\s*\(v[\d.]+(?:\+\w+)?(?:\s+(?:local|global))?\))?$/m,
    `$1$2 (v${version})`
  );
  return modified + body;
}

/**
 * Walk a directory (non-recursively) and apply injectVersionScope to all .md files.
 *
 * @param {string} dir - Directory to walk
 * @param {string} version - Version string
 * @param {string} scope - "local" or "global"
 */
function applyVersionScopeToCommands(dir, version, scope) {
  if (!fs.existsSync(dir)) return;
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isFile() && entry.name.endsWith('.md')) {
        const content = fs.readFileSync(fullPath, 'utf8');
        const modified = injectVersionScope(content, version, scope);
        if (modified !== content) {
          fs.writeFileSync(fullPath, modified);
        }
      } else if (entry.isDirectory()) {
        // Recurse into subdirectories (for nested command structure)
        applyVersionScopeToCommands(fullPath, version, scope);
      }
    }
  } catch {
    // Non-critical — skip version injection on error
  }
}

/**
 * Save user-generated files from destDir to an in-memory map before a wipe.
 * (#1924 upstream fix: preserve USER-PROFILE.md and dev-preferences.md on re-install)
 *
 * @param {string} destDir - Directory that is about to be wiped
 * @param {string[]} fileNames - Relative file names to preserve
 * @returns {Map<string, string>} Map of fileName → file content
 */
function preserveUserArtifacts(destDir, fileNames) {
  const saved = new Map();
  for (const name of fileNames) {
    const fullPath = path.join(destDir, name);
    if (fs.existsSync(fullPath)) {
      try {
        saved.set(name, fs.readFileSync(fullPath, 'utf8'));
      } catch { /* skip unreadable files */ }
    }
  }
  return saved;
}

/**
 * Restore user-generated files saved by preserveUserArtifacts after a wipe.
 *
 * @param {string} destDir - Directory that was wiped and recreated
 * @param {Map<string, string>} saved - Map returned by preserveUserArtifacts
 */
function restoreUserArtifacts(destDir, saved) {
  for (const [name, content] of saved) {
    const fullPath = path.join(destDir, name);
    try {
      fs.mkdirSync(path.dirname(fullPath), { recursive: true });
      fs.writeFileSync(fullPath, content, 'utf8');
    } catch { /* skip unwritable paths */ }
  }
}

/**
 * Recursively copy directory, replacing paths in .md files
 * Deletes existing destDir first to remove orphaned files from previous versions
 * @param {string} srcDir - Source directory
 * @param {string} destDir - Destination directory
 * @param {string} pathPrefix - Path prefix for file references
 * @param {string} runtime - Target runtime ('claude' or 'codex')
 * @param {boolean} [isCommand=false] - Preserved for call-site compatibility
 * @param {boolean} [isGlobal=false] - Whether this is a global install
 */
function copyWithPathReplacement(srcDir, destDir, pathPrefix, runtime, isCommand = false, isGlobal = false) {
  const dirName = getDirName(runtime);

  // Clean install: remove existing destination to prevent orphaned files.
  // Preserve user-generated artifacts (USER-PROFILE.md) across wipes (#1924).
  const userArtifacts = preserveUserArtifacts(destDir, ['USER-PROFILE.md']);
  if (fs.existsSync(destDir)) {
    fs.rmSync(destDir, { recursive: true });
  }
  safeFs('mkdirSync', () => fs.mkdirSync(destDir, { recursive: true }), destDir);
  restoreUserArtifacts(destDir, userArtifacts);

  const entries = fs.readdirSync(srcDir, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);

    if (entry.isDirectory()) {
      copyWithPathReplacement(srcPath, destPath, pathPrefix, runtime, isCommand, isGlobal);
    } else if (entry.name.endsWith('.md')) {
      // Replace paths using centralized two-pass function
      let content = fs.readFileSync(srcPath, 'utf8');
      content = replacePathsInContent(content, pathPrefix, `./${dirName}/`);
      content = processAttribution(content, getCommitAttribution(runtime));

      if (runtime === 'codex') {
        content = convertClaudeToCodexMarkdown(content);
      }

      fs.writeFileSync(destPath, content);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

/**
 * Compare two dot-delimited version strings.
 * Returns -1 if a < b, 0 if a === b, 1 if a > b.
 * Strips +dev suffix before comparison.
 */
function compareVersions(a, b) {
  const partsA = a.replace(/\+dev$/, '').split('.').map(Number);
  const partsB = b.replace(/\+dev$/, '').split('.').map(Number);
  const len = Math.max(partsA.length, partsB.length);
  for (let i = 0; i < len; i++) {
    const segA = partsA[i] || 0;
    const segB = partsB[i] || 0;
    if (segA < segB) return -1;
    if (segA > segB) return 1;
  }
  return 0;
}

/**
 * Returns true if version is strictly greater than fromVersion
 * AND less than or equal to toVersion.
 * Strips +dev suffix before comparison.
 */
function isVersionInRange(version, fromVersion, toVersion) {
  return compareVersions(version, fromVersion) > 0 && compareVersions(version, toVersion) <= 0;
}

/**
 * Generate a MIGRATION-GUIDE.md for upgrades by reading migration spec JSONs.
 * Reads all JSON files from get-shit-done/migrations/ (relative to package root),
 * filters to specs in the (previousVersion, currentVersion] range, sorts by version,
 * and writes a Markdown guide to targetDir/MIGRATION-GUIDE.md.
 * If no applicable specs are found, does nothing (no empty guide).
 */
function generateMigrationGuide(targetDir, previousVersion, currentVersion) {
  const migrationsDir = path.join(__dirname, '..', 'get-shit-done', 'migrations');
  if (!fs.existsSync(migrationsDir)) return;

  const specFiles = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.json'));
  const applicableSpecs = [];

  for (const file of specFiles) {
    try {
      const spec = JSON.parse(fs.readFileSync(path.join(migrationsDir, file), 'utf8'));
      if (spec.version && isVersionInRange(spec.version, previousVersion, currentVersion)) {
        applicableSpecs.push(spec);
      }
    } catch {
      // Skip malformed spec files
    }
  }

  if (applicableSpecs.length === 0) return;

  // Sort by version ascending
  applicableSpecs.sort((a, b) => compareVersions(a.version, b.version));

  const categoryBadge = {
    breaking: '**BREAKING:**',
    config: '**Config:**',
    feature: '**Feature:**',
  };

  const lines = [];
  lines.push(`# Migration Guide: ${previousVersion} -> ${currentVersion}`);
  lines.push('');
  lines.push(`> Generated: ${new Date().toISOString()}`);
  lines.push(`> Previous version: ${previousVersion}`);
  lines.push(`> Current version: ${currentVersion}`);
  lines.push('');

  for (const spec of applicableSpecs) {
    lines.push(`## Version ${spec.version}: ${spec.title}`);
    lines.push('');
    for (const section of spec.sections) {
      const badge = categoryBadge[section.category] || `**${section.category}:**`;
      lines.push(`### ${badge} ${section.heading}`);
      lines.push('');
      lines.push(section.body);
      lines.push('');
      if (section.action === 'automatic') {
        lines.push('> *This change is applied automatically during installation.*');
        lines.push('');
      } else if (section.action === 'run-upgrade-project') {
        lines.push('> *Action required:* Run `/gsdr:upgrade-project` to apply this change.');
        lines.push('');
      }
    }
  }

  lines.push('---');
  lines.push('');
  lines.push('For project-level config migrations, run `/gsdr:upgrade-project`.');
  lines.push('');

  const guidePath = path.join(targetDir, 'MIGRATION-GUIDE.md');
  fs.writeFileSync(guidePath, lines.join('\n'));
  console.log(`  + Generated MIGRATION-GUIDE.md (${previousVersion} -> ${currentVersion})`);
}

/**
 * Clean up orphaned files from previous GSD versions
 */
function cleanupOrphanedFiles(configDir) {
  const orphanedFiles = [
    'hooks/gsd-notify.sh',  // Removed in v1.6.x
    'hooks/statusline.js',  // Renamed to gsd-statusline.js in v1.9.0
    'hooks/gsd-statusline.js',     // Renamed to gsdr-statusline.js (co-installation namespace)
    'hooks/gsd-check-update.js',   // Renamed to gsdr-check-update.js
    'hooks/gsd-version-check.js',  // Renamed to gsdr-version-check.js
    'hooks/gsd-ci-status.js',      // Renamed to gsdr-ci-status.js
    'hooks/gsd-health-check.js',   // Renamed to gsdr-health-check.js
    'hooks/gsd-context-monitor.js',  // Renamed to gsdr-context-monitor.js
    // Pre-modularization stale artifacts (v1.17 -> v1.18)
    'get-shit-done-reflect/bin/gsd-tools.js',  // Renamed to gsd-tools.cjs in Phase 45
  ];

  for (const relPath of orphanedFiles) {
    const fullPath = path.join(configDir, relPath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      console.log(`  ${green}✓${reset} Removed orphaned ${relPath}`);
    }
  }
}

/**
 * Clean up orphaned hook registrations from settings.json
 */
function cleanupOrphanedHooks(settings) {
  const orphanedHookPatterns = [
    'gsd-notify.sh',  // Removed in v1.6.x
    'hooks/statusline.js',  // Renamed to gsd-statusline.js in v1.9.0
    'gsd-intel-index.js',  // Removed in v1.9.2
    'gsd-intel-session.js',  // Removed in v1.9.2
    'gsd-intel-prune.js',  // Removed in v1.9.2
    'gsd-statusline.js',       // Renamed to gsdr-statusline.js (co-installation namespace)
    'gsd-check-update.js',     // Renamed to gsdr-check-update.js
    'gsd-version-check.js',    // Renamed to gsdr-version-check.js
    'gsd-ci-status.js',        // Renamed to gsdr-ci-status.js
    'gsd-health-check.js',     // Renamed to gsdr-health-check.js
    'gsd-context-monitor.js',  // Renamed to gsdr-context-monitor.js
  ];

  let cleanedHooks = false;

  // Check all hook event types (Stop, SessionStart, etc.)
  if (settings.hooks) {
    for (const eventType of Object.keys(settings.hooks)) {
      const hookEntries = settings.hooks[eventType];
      if (Array.isArray(hookEntries)) {
        // Filter out entries that contain orphaned hooks
        const filtered = hookEntries.filter(entry => {
          if (entry.hooks && Array.isArray(entry.hooks)) {
            // Check if any hook in this entry matches orphaned patterns
            const hasOrphaned = entry.hooks.some(h =>
              h.command && orphanedHookPatterns.some(pattern => h.command.includes(pattern))
            );
            if (hasOrphaned) {
              cleanedHooks = true;
              return false;  // Remove this entry
            }
          }
          return true;  // Keep this entry
        });
        settings.hooks[eventType] = filtered;
      }
    }
  }

  if (cleanedHooks) {
    console.log(`  ${green}✓${reset} Removed orphaned hook registrations`);
  }

  // Fix #330: Update statusLine if it points to old statusline.js path
  if (settings.statusLine && settings.statusLine.command &&
      settings.statusLine.command.includes('statusline.js') &&
      !settings.statusLine.command.includes('gsdr-statusline.js') &&
      !settings.statusLine.command.includes('gsd-statusline.js')) {
    // Replace old path with new path
    settings.statusLine.command = settings.statusLine.command.replace(
      /statusline\.js/,
      'gsdr-statusline.js'
    );
    console.log(`  ${green}✓${reset} Updated statusline path (statusline.js → gsdr-statusline.js)`);
  }

  return settings;
}

/**
 * Validate hook field structure in settings.hooks.
 * Strips entries missing required sub-fields to prevent Zod rejection in settings.json.
 * Two-pass approach: filter invalid entries, then prune empty event type keys.
 * @param {object} settings - The settings object (mutated in place)
 * @returns {object} - The mutated settings object
 */
function validateHookFields(settings) {
  if (!settings.hooks || typeof settings.hooks !== 'object') {
    return settings;
  }

  // Pass 1: Filter invalid entries from each event type
  for (const eventType of Object.keys(settings.hooks)) {
    const hookEntries = settings.hooks[eventType];
    if (!Array.isArray(hookEntries)) continue;

    settings.hooks[eventType] = hookEntries.filter(entry => {
      // Must have a hooks property that is a non-empty array
      if (!entry.hooks || !Array.isArray(entry.hooks) || entry.hooks.length === 0) {
        console.log(`  ${green}+${reset} Removed invalid hook entry from ${eventType}`);
        return false;
      }
      // Each hook in the array must have either prompt or command
      const allValid = entry.hooks.every(h => h.prompt || h.command);
      if (!allValid) {
        console.log(`  ${green}+${reset} Removed invalid hook entry from ${eventType}`);
        return false;
      }
      return true;
    });
  }

  // Pass 2: Delete empty event type keys
  for (const eventType of Object.keys(settings.hooks)) {
    if (Array.isArray(settings.hooks[eventType]) && settings.hooks[eventType].length === 0) {
      delete settings.hooks[eventType];
    }
  }

  // Delete hooks property entirely if all event types removed
  if (Object.keys(settings.hooks).length === 0) {
    delete settings.hooks;
  }

  return settings;
}

/**
 * Uninstall GSD from the specified directory for a specific runtime
 * Removes only GSD-specific files/directories, preserves user content
 * @param {boolean} isGlobal - Whether to uninstall from global or local
 * @param {string} runtime - Target runtime ('claude' or 'codex')
 */
function uninstall(isGlobal, runtime = 'claude') {
  const isCodex = runtime === 'codex';
  const dirName = getDirName(runtime);

  // Get the target directory based on runtime and install type
  const targetDir = isGlobal
    ? getGlobalDir(runtime, explicitConfigDir)
    : path.join(process.cwd(), dirName);

  const locationLabel = isGlobal
    ? targetDir.replace(os.homedir(), '~')
    : targetDir.replace(process.cwd(), '.');

  const runtimeLabel = getInstallerRuntimeLabel(runtime);

  console.log(`  Uninstalling GSDR from ${cyan}${runtimeLabel}${reset} at ${cyan}${locationLabel}${reset}\n`);

  // Check if target directory exists
  if (!fs.existsSync(targetDir)) {
    console.log(`  ${yellow}⚠${reset} Directory does not exist: ${locationLabel}`);
    console.log(`  Nothing to uninstall.\n`);
    return;
  }

  let removedCount = 0;

  // Co-installation safety: only touch gsd namespace if it's a legacy Reflect install
  const cleanLegacy = isLegacyReflectInstall(targetDir);

  // 1. Remove GSDR commands (and legacy gsd commands only if from Reflect)
  if (isCodex) {
    const skillsDir = path.join(targetDir, 'skills');
    if (fs.existsSync(skillsDir)) {
      for (const entry of fs.readdirSync(skillsDir, { withFileTypes: true })) {
        if (entry.isDirectory() && entry.name.startsWith('gsdr-')) {
          fs.rmSync(path.join(skillsDir, entry.name), { recursive: true });
          removedCount++;
        } else if (cleanLegacy && entry.isDirectory() && entry.name.startsWith('gsd-')) {
          fs.rmSync(path.join(skillsDir, entry.name), { recursive: true });
          removedCount++;
        }
      }
      if (removedCount > 0) {
        console.log(`  ${green}✓${reset} Removed GSDR skills`);
      }
    }
  } else {
    // Claude Code: remove commands/gsdr/ (and commands/gsd/ only if legacy Reflect)
    const gsdrCommandsDir = path.join(targetDir, 'commands', 'gsdr');
    if (fs.existsSync(gsdrCommandsDir)) {
      fs.rmSync(gsdrCommandsDir, { recursive: true });
      removedCount++;
      console.log(`  ${green}✓${reset} Removed commands/gsdr/`);
    }
    if (cleanLegacy) {
      const gsdCommandsDir = path.join(targetDir, 'commands', 'gsd');
      if (fs.existsSync(gsdCommandsDir)) {
        fs.rmSync(gsdCommandsDir, { recursive: true });
        removedCount++;
        console.log(`  ${green}✓${reset} Removed commands/gsd/ (legacy Reflect cleanup)`);
      }
    }
  }

  // 2. Remove get-shit-done-reflect/ (and get-shit-done/ only if legacy Reflect)
  const gsdrDir = path.join(targetDir, 'get-shit-done-reflect');
  if (fs.existsSync(gsdrDir)) {
    fs.rmSync(gsdrDir, { recursive: true });
    removedCount++;
    console.log(`  ${green}✓${reset} Removed get-shit-done-reflect/`);
  }
  if (cleanLegacy) {
    const gsdDir = path.join(targetDir, 'get-shit-done');
    if (fs.existsSync(gsdDir)) {
      fs.rmSync(gsdDir, { recursive: true });
      removedCount++;
      console.log(`  ${green}✓${reset} Removed get-shit-done/ (legacy Reflect cleanup)`);
    }
  }

  // 3. Remove GSDR agents (and gsd-*.md only if legacy Reflect) -- skip for Codex
  const agentsDir = path.join(targetDir, 'agents');
  if (fs.existsSync(agentsDir) && !isCodex) {
    const files = fs.readdirSync(agentsDir);
    let agentCount = 0;
    for (const file of files) {
      if (file.startsWith('gsdr-') && file.endsWith('.md')) {
        fs.unlinkSync(path.join(agentsDir, file));
        agentCount++;
      } else if (cleanLegacy && file.startsWith('gsd-') && file.endsWith('.md')) {
        fs.unlinkSync(path.join(agentsDir, file));
        agentCount++;
      }
    }
    if (agentCount > 0) {
      removedCount++;
      console.log(`  ${green}✓${reset} Removed ${agentCount} GSDR agents`);
    }
  }

  // 3b. Remove GSD section from AGENTS.md (Codex only)
  if (isCodex) {
    const agentsMdPath = path.join(targetDir, 'AGENTS.md');
    if (fs.existsSync(agentsMdPath)) {
      let content = fs.readFileSync(agentsMdPath, 'utf8');
      const GSD_BEGIN = '<!-- GSD:BEGIN (get-shit-done-reflect-cc) -->';
      const GSD_END = '<!-- GSD:END (get-shit-done-reflect-cc) -->';
      const beginIdx = content.indexOf(GSD_BEGIN);
      const endIdx = content.indexOf(GSD_END);
      if (beginIdx !== -1 && endIdx !== -1) {
        content = content.substring(0, beginIdx) + content.substring(endIdx + GSD_END.length);
        content = content.trim();
        if (content.length === 0) {
          fs.unlinkSync(agentsMdPath);
        } else {
          fs.writeFileSync(agentsMdPath, content + '\n');
        }
        console.log(`  ${green}✓${reset} Removed GSD section from AGENTS.md`);
        removedCount++;
      }
    }
  }

  // 3c. Remove GSD agent registration and MCP config from config.toml (Codex only)
  if (isCodex) {
    const configTomlPath = path.join(targetDir, 'config.toml');
    if (fs.existsSync(configTomlPath)) {
      let content = fs.readFileSync(configTomlPath, 'utf8');
      // Strip agent registration (marker-to-EOF pattern)
      const cleaned = stripGsdFromCodexConfig(content);
      if (cleaned === null) {
        fs.unlinkSync(configTomlPath);
        console.log(`  ${green}✓${reset} Removed config.toml (was GSD-only)`);
        removedCount++;
      } else if (cleaned !== content) {
        // Also strip MCP config section if present
        const GSD_MCP_BEGIN = '# GSD:BEGIN (get-shit-done-reflect-cc)';
        const GSD_MCP_END = '# GSD:END (get-shit-done-reflect-cc)';
        let finalContent = cleaned;
        const mBegin = finalContent.indexOf(GSD_MCP_BEGIN);
        const mEnd = finalContent.indexOf(GSD_MCP_END);
        if (mBegin !== -1 && mEnd !== -1) {
          finalContent = finalContent.substring(0, mBegin) + finalContent.substring(mEnd + GSD_MCP_END.length);
          finalContent = finalContent.trim();
        }
        if (!finalContent) {
          fs.unlinkSync(configTomlPath);
          console.log(`  ${green}✓${reset} Removed config.toml (was GSD-only)`);
        } else {
          fs.writeFileSync(configTomlPath, finalContent + '\n');
          console.log(`  ${green}✓${reset} Cleaned GSD sections from config.toml`);
        }
        removedCount++;
      } else {
        // No agent marker found, still check MCP markers
        const GSD_MCP_BEGIN = '# GSD:BEGIN (get-shit-done-reflect-cc)';
        const GSD_MCP_END = '# GSD:END (get-shit-done-reflect-cc)';
        const mBegin = content.indexOf(GSD_MCP_BEGIN);
        const mEnd = content.indexOf(GSD_MCP_END);
        if (mBegin !== -1 && mEnd !== -1) {
          let finalContent = content.substring(0, mBegin) + content.substring(mEnd + GSD_MCP_END.length);
          finalContent = finalContent.trim();
          if (!finalContent) {
            fs.unlinkSync(configTomlPath);
          } else {
            fs.writeFileSync(configTomlPath, finalContent + '\n');
          }
          console.log(`  ${green}✓${reset} Removed GSD MCP section from config.toml`);
          removedCount++;
        }
      }
    }
  }

  // 4. Remove GSD hooks (skip for Codex -- no hook system)
  if (!isCodex) {
    const hooksDir = path.join(targetDir, 'hooks');
    if (fs.existsSync(hooksDir)) {
      const gsdHooks = [
        'gsdr-statusline.js', 'gsdr-check-update.js', 'gsdr-version-check.js', 'gsdr-ci-status.js', 'gsdr-health-check.js', 'gsdr-context-monitor.js',
        'gsd-statusline.js', 'gsd-check-update.js', 'gsd-check-update.sh', 'gsd-version-check.js', 'gsd-ci-status.js', 'gsd-health-check.js', 'gsd-context-monitor.js'
      ];
      let hookCount = 0;
      for (const hook of gsdHooks) {
        const hookPath = path.join(hooksDir, hook);
        if (fs.existsSync(hookPath)) {
          fs.unlinkSync(hookPath);
          hookCount++;
        }
      }
      if (hookCount > 0) {
        removedCount++;
        console.log(`  ${green}✓${reset} Removed ${hookCount} GSD hooks`);
      }
    }
  }

  // 5. Clean up settings.json (remove GSD hooks and statusline) -- skip for Codex
  const settingsPath = path.join(targetDir, 'settings.json');
  if (fs.existsSync(settingsPath) && !isCodex) {
    let settings = readSettings(settingsPath);
    let settingsModified = false;

    // Remove GSD statusline if it references our hook
    if (settings.statusLine && settings.statusLine.command &&
        (settings.statusLine.command.includes('gsdr-statusline') || settings.statusLine.command.includes('gsd-statusline'))) {
      delete settings.statusLine;
      settingsModified = true;
      console.log(`  ${green}✓${reset} Removed GSD statusline from settings`);
    }

    // Remove GSD hooks from settings — per-hook granularity to preserve
    // user hooks that share an entry with a GSD hook (#1755 upstream fix)
    const isGsdrHookCommand = (cmd) =>
      cmd && (
        cmd.includes('gsdr-check-update') || cmd.includes('gsdr-statusline') ||
        cmd.includes('gsdr-version-check') || cmd.includes('gsdr-ci-status') ||
        cmd.includes('gsdr-health-check') || cmd.includes('gsdr-context-monitor') ||
        cmd.includes('gsdr-workflow-guard') ||
        // Legacy gsd- prefix (pre-reflect branding)
        cmd.includes('gsd-check-update') || cmd.includes('gsd-statusline') ||
        cmd.includes('gsd-version-check') || cmd.includes('gsd-ci-status') ||
        cmd.includes('gsd-health-check') || cmd.includes('gsd-context-monitor') ||
        cmd.includes('gsd-workflow-guard')
      );

    for (const eventName of ['SessionStart', 'PostToolUse', 'AfterTool', 'PreToolUse', 'BeforeTool']) {
      if (settings.hooks && settings.hooks[eventName]) {
        const before = JSON.stringify(settings.hooks[eventName]);
        settings.hooks[eventName] = settings.hooks[eventName]
          .map(entry => {
            if (!entry.hooks || !Array.isArray(entry.hooks)) return entry;
            // Filter out individual GSD hooks, keep user hooks in the same entry
            entry.hooks = entry.hooks.filter(h => !isGsdrHookCommand(h.command));
            return entry.hooks.length > 0 ? entry : null;
          })
          .filter(Boolean);
        if (JSON.stringify(settings.hooks[eventName]) !== before) {
          settingsModified = true;
        }
        if (settings.hooks[eventName].length === 0) {
          delete settings.hooks[eventName];
        }
      }
    }

    if (settingsModified) {
      console.log(`  ${green}✓${reset} Removed GSD hooks from settings`);
    }

    // Clean up empty hooks object
    if (settings.hooks && Object.keys(settings.hooks).length === 0) {
      delete settings.hooks;
    }

    if (settingsModified) {
      writeSettings(settingsPath, settings);
      removedCount++;
    }
  }

  // Remove the file manifest that the installer wrote at install time.
  // Without this step the metadata file persists after uninstall (#1908).
  const manifestPath = path.join(targetDir, MANIFEST_NAME);
  if (fs.existsSync(manifestPath)) {
    fs.rmSync(manifestPath, { force: true });
    removedCount++;
    console.log(`  ${green}✓${reset} Removed ${MANIFEST_NAME}`);
  }

  if (removedCount === 0) {
    console.log(`  ${yellow}⚠${reset} No GSD files found to remove.`);
  }

  console.log(`
  ${green}Done!${reset} GSD has been uninstalled from ${runtimeLabel}.
  Your other files and settings have been preserved.
`);
}

/**
 * Parse JSONC (JSON with Comments) by stripping comments and trailing commas.
 * OpenCode supports JSONC format via jsonc-parser, so users may have comments.
 * This is a lightweight inline parser to avoid adding dependencies.
 */
/**
 * Verify a directory exists and contains files
 */
function verifyInstalled(dirPath, description) {
  if (!fs.existsSync(dirPath)) {
    console.error(`  ${yellow}✗${reset} Failed to install ${description}: directory not created`);
    return false;
  }
  try {
    const entries = fs.readdirSync(dirPath);
    if (entries.length === 0) {
      console.error(`  ${yellow}✗${reset} Failed to install ${description}: directory is empty`);
      return false;
    }
  } catch (e) {
    console.error(`  ${yellow}✗${reset} Failed to install ${description}: ${e.message}`);
    return false;
  }
  return true;
}

/**
 * Verify a file exists
 */
function verifyFileInstalled(filePath, description) {
  if (!fs.existsSync(filePath)) {
    console.error(`  ${yellow}✗${reset} Failed to install ${description}: file not created`);
    return false;
  }
  return true;
}

/**
 * Install to the specified directory for a specific runtime
 * @param {boolean} isGlobal - Whether to install globally or locally
 * @param {string} runtime - Target runtime ('claude' or 'codex')
 */

// ──────────────────────────────────────────────────────
// Local Patch Persistence
// ──────────────────────────────────────────────────────

const PATCHES_DIR_NAME = 'gsdr-local-patches';
const MANIFEST_NAME = 'gsd-file-manifest.json';

/**
 * Detect whether the gsd namespace in a config directory belongs to a pre-Phase-44
 * GSD Reflect installation (safe to clean up) vs upstream GSD (must not touch).
 *
 * Detection: gsd-file-manifest.json is Reflect-only. If it exists and contains
 * get-shit-done/ paths, this is a pre-Phase-44 Reflect install.
 */
function isLegacyReflectInstall(configDir) {
  const manifestPath = path.join(configDir, MANIFEST_NAME);
  if (!fs.existsSync(manifestPath)) return false;
  try {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    // Pre-Phase-44 manifests have get-shit-done/ paths (not get-shit-done-reflect/)
    return Object.keys(manifest.files || {}).some(f => f.startsWith('get-shit-done/'));
  } catch {
    return false;
  }
}

/**
 * Compute SHA256 hash of file contents
 */
function fileHash(filePath) {
  const content = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(content).digest('hex');
}

/**
 * Recursively collect all files in dir with their hashes
 */
function generateManifest(dir, baseDir) {
  if (!baseDir) baseDir = dir;
  const manifest = {};
  if (!fs.existsSync(dir)) return manifest;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relPath = path.relative(baseDir, fullPath).replace(/\\/g, '/');
    if (entry.isDirectory()) {
      Object.assign(manifest, generateManifest(fullPath, baseDir));
    } else {
      manifest[relPath] = fileHash(fullPath);
    }
  }
  return manifest;
}

/**
 * Write file manifest after installation for future modification detection
 */
function writeManifest(configDir) {
  const gsdDir = path.join(configDir, 'get-shit-done-reflect');
  const commandsDir = path.join(configDir, 'commands', 'gsdr');
  const agentsDir = path.join(configDir, 'agents');
  const manifest = { version: pkg.version, timestamp: new Date().toISOString(), files: {} };

  const gsdHashes = generateManifest(gsdDir);
  for (const [rel, hash] of Object.entries(gsdHashes)) {
    manifest.files['get-shit-done-reflect/' + rel] = hash;
  }
  if (fs.existsSync(commandsDir)) {
    const cmdHashes = generateManifest(commandsDir);
    for (const [rel, hash] of Object.entries(cmdHashes)) {
      manifest.files['commands/gsdr/' + rel] = hash;
    }
  }
  if (fs.existsSync(agentsDir)) {
    for (const file of fs.readdirSync(agentsDir)) {
      if (file.startsWith('gsdr-') && file.endsWith('.md')) {
        manifest.files['agents/' + file] = fileHash(path.join(agentsDir, file));
      }
    }
  }

  fs.writeFileSync(path.join(configDir, MANIFEST_NAME), JSON.stringify(manifest, null, 2));
  return manifest;
}

/**
 * Detect user-modified GSD files by comparing against install manifest.
 * Backs up modified files to gsd-local-patches/ for reapply after update.
 */
function saveLocalPatches(configDir) {
  const manifestPath = path.join(configDir, MANIFEST_NAME);
  if (!fs.existsSync(manifestPath)) return [];

  let manifest;
  try { manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8')); } catch { return []; }

  const patchesDir = path.join(configDir, PATCHES_DIR_NAME);
  const modified = [];

  for (const [relPath, originalHash] of Object.entries(manifest.files || {})) {
    const fullPath = path.join(configDir, relPath);
    if (!fs.existsSync(fullPath)) continue;
    const currentHash = fileHash(fullPath);
    if (currentHash !== originalHash) {
      const backupPath = path.join(patchesDir, relPath);
      safeFs('mkdirSync', () => fs.mkdirSync(path.dirname(backupPath), { recursive: true }), path.dirname(backupPath));
      fs.copyFileSync(fullPath, backupPath);
      modified.push(relPath);
    }
  }

  if (modified.length > 0) {
    const meta = {
      backed_up_at: new Date().toISOString(),
      from_version: manifest.version,
      files: modified
    };
    fs.writeFileSync(path.join(patchesDir, 'backup-meta.json'), JSON.stringify(meta, null, 2));
    console.log('  ' + yellow + 'i' + reset + '  Found ' + modified.length + ' locally modified GSD file(s) — backed up to ' + PATCHES_DIR_NAME + '/');
    for (const f of modified) {
      console.log('     ' + dim + f + reset);
    }
  }
  return modified;
}

/**
 * Remove patches that are identical to newly installed files.
 * After an update, a backed-up "modification" may actually match what we just
 * installed (e.g., user already had the new content from a dev install, or the
 * only difference was the installer's own path normalization). These aren't
 * real user patches — prune them to avoid false-positive noise.
 */
function pruneRedundantPatches(configDir) {
  const patchesDir = path.join(configDir, PATCHES_DIR_NAME);
  const metaPath = path.join(patchesDir, 'backup-meta.json');
  if (!fs.existsSync(metaPath)) return;

  let meta;
  try { meta = JSON.parse(fs.readFileSync(metaPath, 'utf8')); } catch { return; }

  const remaining = [];
  let pruned = 0;

  for (const relPath of (meta.files || [])) {
    const patchPath = path.join(patchesDir, relPath);
    const installedPath = path.join(configDir, relPath);

    if (!fs.existsSync(patchPath) || !fs.existsSync(installedPath)) {
      remaining.push(relPath);
      continue;
    }

    if (fileHash(patchPath) === fileHash(installedPath)) {
      // Patch is identical to newly installed file — not a real modification
      fs.unlinkSync(patchPath);
      pruned++;
    } else {
      remaining.push(relPath);
    }
  }

  if (pruned === 0) return;

  if (remaining.length === 0) {
    // No real patches — clean up entirely
    fs.rmSync(patchesDir, { recursive: true, force: true });
  } else {
    // Update meta with pruned list
    meta.files = remaining;
    fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2));
    // Clean up empty subdirectories left after pruning
    for (const sub of ['agents', 'get-shit-done', 'commands']) {
      const subDir = path.join(patchesDir, sub);
      if (fs.existsSync(subDir)) {
        try {
          const entries = fs.readdirSync(subDir, { recursive: true }).filter(e => {
            const full = path.join(subDir, e);
            return fs.existsSync(full) && fs.statSync(full).isFile();
          });
          if (entries.length === 0) fs.rmSync(subDir, { recursive: true, force: true });
        } catch { /* ignore cleanup errors */ }
      }
    }
  }
}

/**
 * After install, report backed-up patches for user to reapply.
 */
function reportLocalPatches(configDir) {
  const patchesDir = path.join(configDir, PATCHES_DIR_NAME);
  const metaPath = path.join(patchesDir, 'backup-meta.json');
  if (!fs.existsSync(metaPath)) return [];

  let meta;
  try { meta = JSON.parse(fs.readFileSync(metaPath, 'utf8')); } catch { return []; }

  if (meta.files && meta.files.length > 0) {
    console.log('');
    console.log('  ' + yellow + 'Local patches detected' + reset + ' (from v' + meta.from_version + '):');
    for (const f of meta.files) {
      console.log('     ' + cyan + f + reset);
    }
    console.log('');
    console.log('  Your modifications are saved in ' + cyan + PATCHES_DIR_NAME + '/' + reset);
    console.log('  Run ' + cyan + '/gsd:reapply-patches' + reset + ' to merge them into the new version.');
    console.log('  Or manually compare and merge the files.');
    console.log('');
  }
  return meta.files || [];
}

function install(isGlobal, runtime = 'claude') {
  const isCodex = runtime === 'codex';
  const dirName = getDirName(runtime);
  const src = path.join(__dirname, '..');

  // Get the target directory based on runtime and install type
  const targetDir = isGlobal
    ? getGlobalDir(runtime, explicitConfigDir)
    : path.join(process.cwd(), dirName);

  const locationLabel = isGlobal
    ? targetDir.replace(os.homedir(), '~')
    : targetDir.replace(process.cwd(), '.');

  // Path prefix for file references in markdown content
  // For global installs: use $HOME for shell compatibility (C5)
  // For local installs: use relative
  const pathPrefix = isGlobal
    ? `$HOME/${path.basename(targetDir)}/`
    : `./${dirName}/`;

  const runtimeLabel = getInstallerRuntimeLabel(runtime);

  // Cache legacy detection once — reads and parses gsd-file-manifest.json
  const cleanLegacy = isLegacyReflectInstall(targetDir);

  console.log(`  Installing for ${cyan}${runtimeLabel}${reset} to ${cyan}${locationLabel}${reset}\n`);

  // Cross-scope detection: warn if the other scope already has GSD installed
  const otherScopeVersionPath = isGlobal
    ? path.join(process.cwd(), dirName, 'get-shit-done-reflect', 'VERSION')
    : path.join(getGlobalDir(runtime, explicitConfigDir), 'get-shit-done-reflect', 'VERSION');
  if (fs.existsSync(otherScopeVersionPath)) {
    try {
      const otherVersion = fs.readFileSync(otherScopeVersionPath, 'utf8').trim();
      const otherLabel = isGlobal ? 'local (this project)' : 'global';
      console.log(`  ${yellow}Note:${reset} GSD is also installed ${otherLabel} (v${otherVersion}).`);
      console.log(`  You will have dual installations after this install.`);
      console.log(`  ${dim}Local always takes precedence. Commands may appear twice in autocomplete.${reset}`);
      console.log(`  ${dim}See: .claude/get-shit-done-reflect/references/dual-installation.md${reset}\n`);
    } catch {
      // Ignore read errors — non-critical informational warning
    }
  }

  // Track installation failures
  const failures = [];

  // Version string: +dev suffix for dogfooding visibility
  // Applied when: local installs (always dev), or global installs from git repo (not from npm)
  const isFromGitRepo = fs.existsSync(path.join(src, '.git'));
  const versionString = (!isGlobal || isFromGitRepo) ? `${pkg.version}+dev` : pkg.version;

  // Fresh vs upgrade detection (UPD-04)
  const reflectVersionPath = path.join(targetDir, 'get-shit-done-reflect', 'VERSION');
  let previousVersion = null;
  if (fs.existsSync(reflectVersionPath)) {
    try {
      previousVersion = fs.readFileSync(reflectVersionPath, 'utf8').trim()
        .replace(/\+dev$/, '');
    } catch { /* treat as fresh install */ }
  }
  const currentVersionClean = versionString.replace(/\+dev$/, '');
  const isUpgrade = previousVersion && previousVersion !== currentVersionClean;

  // Save any locally modified GSD files before they get wiped
  saveLocalPatches(targetDir);

  // Clean up orphaned files from previous versions
  cleanupOrphanedFiles(targetDir);

  // Codex uses skills/; Claude uses commands/.
  if (isCodex) {
    const skillsDir = path.join(targetDir, 'skills');
    safeFs('mkdirSync', () => fs.mkdirSync(skillsDir, { recursive: true }), skillsDir);
    const gsdSrc = path.join(src, 'commands', 'gsd');
    copyCodexSkills(gsdSrc, skillsDir, 'gsdr', pathPrefix);
    if (verifyInstalled(skillsDir, 'skills/gsdr-*')) {
      const count = fs.readdirSync(skillsDir).filter(d =>
        d.startsWith('gsdr-') && fs.statSync(path.join(skillsDir, d)).isDirectory()
      ).length;
      console.log(`  ${green}+${reset} Installed ${count} skills to skills/`);
    } else {
      failures.push('skills/gsdr-*');
    }
    // Inject version/scope into Codex skill descriptions
    applyVersionScopeToCommands(skillsDir, versionString, isGlobal ? 'global' : 'local');
  } else {
    // Claude Code: nested structure in commands/ directory
    const commandsDir = path.join(targetDir, 'commands');
    safeFs('mkdirSync', () => fs.mkdirSync(commandsDir, { recursive: true }), commandsDir);

    const gsdSrc = path.join(src, 'commands', 'gsd');
    const gsdDest = path.join(commandsDir, 'gsdr');
    copyWithPathReplacement(gsdSrc, gsdDest, pathPrefix, runtime, true, isGlobal);
    if (verifyInstalled(gsdDest, 'commands/gsdr')) {
      console.log(`  ${green}✓${reset} Installed commands/gsdr`);
    } else {
      failures.push('commands/gsdr');
    }
    // Inject version/scope into Claude command descriptions
    applyVersionScopeToCommands(gsdDest, versionString, isGlobal ? 'global' : 'local');
  }

  // Copy get-shit-done skill with path replacement
  const skillSrc = path.join(src, 'get-shit-done');
  const skillDest = path.join(targetDir, 'get-shit-done-reflect');
  copyWithPathReplacement(skillSrc, skillDest, pathPrefix, runtime, false, isGlobal);
  if (verifyInstalled(skillDest, 'get-shit-done-reflect')) {
    console.log(`  ${green}✓${reset} Installed get-shit-done-reflect`);
  } else {
    failures.push('get-shit-done-reflect');
  }

  // Verify feature manifest was installed
  const manifestDest = path.join(skillDest, 'feature-manifest.json');
  if (fs.existsSync(manifestDest)) {
    console.log(`  ${green}+${reset} Feature manifest installed`);
  } else {
    console.log(`  ${yellow}!${reset} Feature manifest not found (expected at ${manifestDest})`);
  }

  // Copy agents to agents directory (Claude: .md files; Codex: .toml files)
  const agentsSrc = path.join(src, 'agents');
  if (fs.existsSync(agentsSrc) && !isCodex) {
    const agentsDest = path.join(targetDir, 'agents');
    safeFs('mkdirSync', () => fs.mkdirSync(agentsDest, { recursive: true }), agentsDest);

    // Remove gsdr-*.md agents (our namespace). Only remove gsd-*.md if legacy Reflect install.
    if (fs.existsSync(agentsDest)) {
      for (const file of fs.readdirSync(agentsDest)) {
        if (file.startsWith('gsdr-') && file.endsWith('.md')) {
          fs.unlinkSync(path.join(agentsDest, file));
        } else if (cleanLegacy && file.startsWith('gsd-') && file.endsWith('.md')) {
          fs.unlinkSync(path.join(agentsDest, file));
        }
      }
    }

    // Copy new agents
    const agentEntries = fs.readdirSync(agentsSrc, { withFileTypes: true });
    for (const entry of agentEntries) {
      if (entry.isFile() && entry.name.endsWith('.md')) {
        let content = fs.readFileSync(path.join(agentsSrc, entry.name), 'utf8');
        // Replace paths using centralized two-pass function
        content = replacePathsInContent(content, pathPrefix, `./${getDirName(runtime)}/`);
        content = processAttribution(content, getCommitAttribution(runtime));
        // Rename gsd-*.md -> gsdr-*.md (preserves knowledge-store.md, kb-templates/)
        const destName = entry.name.startsWith('gsd-')
          ? entry.name.replace(/^gsd-/, 'gsdr-')
          : entry.name;
        fs.writeFileSync(path.join(agentsDest, destName), content);
      }
    }
    if (verifyInstalled(agentsDest, 'agents')) {
      console.log(`  ${green}✓${reset} Installed agents`);
    } else {
      failures.push('agents');
    }
  }

  // Generate Codex agent .toml files (individual agent definitions with literal strings)
  if (fs.existsSync(agentsSrc) && isCodex) {
    const codexAgentsDest = path.join(targetDir, 'agents');
    safeFs('mkdirSync', () => fs.mkdirSync(codexAgentsDest, { recursive: true }), codexAgentsDest);

    // Clean existing gsdr-*.toml files
    if (fs.existsSync(codexAgentsDest)) {
      for (const file of fs.readdirSync(codexAgentsDest)) {
        if (file.startsWith('gsdr-') && file.endsWith('.toml')) {
          fs.unlinkSync(path.join(codexAgentsDest, file));
        }
      }
    }

    // Convert each agent .md source to .toml, collecting metadata for config.toml
    const agentEntries = fs.readdirSync(agentsSrc, { withFileTypes: true });
    const agents = [];
    for (const entry of agentEntries) {
      if (entry.isFile() && entry.name.endsWith('.md')) {
        let content = fs.readFileSync(path.join(agentsSrc, entry.name), 'utf8');
        // Apply same transforms as other runtimes
        content = replacePathsInContent(content, pathPrefix, `./${getDirName(runtime)}/`);
        content = processAttribution(content, getCommitAttribution(runtime));
        // Rename gsd-*.md -> gsdr-*.toml
        const destName = entry.name.startsWith('gsd-')
          ? entry.name.replace(/^gsd-/, 'gsdr-').replace(/\.md$/, '.toml')
          : entry.name.replace(/\.md$/, '.toml');
        const agentBaseName = destName.replace('.toml', '');
        // Convert to TOML with literal multi-line strings, passing agent name for sandbox mode lookup
        const tomlContent = convertClaudeToCodexAgentToml(content, agentBaseName);
        fs.writeFileSync(path.join(codexAgentsDest, destName), tomlContent);
        // Collect metadata for config.toml registration
        const { frontmatter } = extractFrontmatterAndBody(content);
        const description = extractFrontmatterField(frontmatter, 'description') || '';
        agents.push({ name: agentBaseName, description });
      }
    }
    if (verifyInstalled(codexAgentsDest, 'agents')) {
      console.log(`  ${green}✓${reset} Installed agents (TOML)`);
    } else {
      failures.push('agents');
    }

    // Register agents in config.toml
    if (agents.length > 0) {
      const configPath = path.join(targetDir, 'config.toml');
      const gsdBlock = generateCodexConfigBlock(agents, targetDir);
      mergeCodexConfig(configPath, gsdBlock);
      console.log(`  ${green}+${reset} Registered ${agents.length} agents in config.toml`);
    }
  }

  // Generate AGENTS.md for Codex (supplements individual agent TOML files)
  if (isCodex) {
    generateCodexAgentsMd(targetDir, pathPrefix);
    console.log(`  ${green}+${reset} Generated AGENTS.md`);
    generateCodexMcpConfig(targetDir);
    console.log(`  ${green}+${reset} Generated MCP config in config.toml`);
  }

  // Copy CHANGELOG.md
  const changelogSrc = path.join(src, 'CHANGELOG.md');
  const changelogDest = path.join(targetDir, 'get-shit-done-reflect', 'CHANGELOG.md');
  if (fs.existsSync(changelogSrc)) {
    fs.copyFileSync(changelogSrc, changelogDest);
    if (verifyFileInstalled(changelogDest, 'CHANGELOG.md')) {
      console.log(`  ${green}✓${reset} Installed CHANGELOG.md`);
    } else {
      failures.push('CHANGELOG.md');
    }
  }

  // Write VERSION file
  const versionDest = path.join(targetDir, 'get-shit-done-reflect', 'VERSION');
  fs.writeFileSync(versionDest, versionString);
  if (verifyFileInstalled(versionDest, 'VERSION')) {
    console.log(`  ${green}✓${reset} Wrote VERSION (${versionString})`);
  } else {
    failures.push('VERSION');
  }

  // Generate migration guide for upgrades only (UPD-01, UPD-04)
  if (isUpgrade) {
    generateMigrationGuide(targetDir, previousVersion, currentVersionClean);
  }

  // Copy hooks from dist/ (bundled with dependencies) -- skip for Codex (no hook system)
  const hooksSrc = path.join(src, 'hooks', 'dist');
  if (!fs.existsSync(hooksSrc) && !isCodex) {
    const buildScript = path.join(src, 'scripts', 'build-hooks.js');
    if (fs.existsSync(buildScript)) {
      console.log(`  Building hooks...`);
      execSync(`node ${JSON.stringify(buildScript)}`, { cwd: src, stdio: 'pipe' });
      console.log(`  ${green}✓${reset} Hooks built`);
    }
  }
  if (fs.existsSync(hooksSrc) && !isCodex) {
    const hooksDest = path.join(targetDir, 'hooks');
    safeFs('mkdirSync', () => fs.mkdirSync(hooksDest, { recursive: true }), hooksDest);
    const hookEntries = fs.readdirSync(hooksSrc);
    for (const entry of hookEntries) {
      const srcFile = path.join(hooksSrc, entry);
      if (fs.statSync(srcFile).isFile()) {
        const destName = entry.startsWith('gsd-')
          ? entry.replace(/^gsd-/, 'gsdr-')
          : entry;
        const destFile = path.join(hooksDest, destName);
        let content = fs.readFileSync(srcFile, 'utf8');
        content = content.replace(/get-shit-done\//g, 'get-shit-done-reflect/');
        content = content.replace(/\bgsd-(?!tools)/g, 'gsdr-');
        content = content.replace(/\/gsd:/g, '/gsdr:');
        content = content.replace(/'get-shit-done'/g, "'get-shit-done-reflect'");
        fs.writeFileSync(destFile, content);
      }
    }
    if (verifyInstalled(hooksDest, 'hooks')) {
      console.log(`  ${green}✓${reset} Installed hooks (bundled)`);
    } else {
      failures.push('hooks');
    }
  }

  if (failures.length > 0) {
    console.error(`\n  ${yellow}Installation incomplete!${reset} Failed: ${failures.join(', ')}`);
    process.exit(1);
  }

  // Upgrade cleanup: only remove old gsd namespace if it's a pre-Phase-44 Reflect install.
  // Never remove upstream GSD's namespace — co-installation must be preserved.
  if (cleanLegacy) {
    const oldGsdDir = path.join(targetDir, 'get-shit-done');
    if (fs.existsSync(oldGsdDir)) {
      fs.rmSync(oldGsdDir, { recursive: true });
      console.log(`  ${green}✓${reset} Removed old get-shit-done/ (legacy Reflect upgrade)`);
    }
    const oldCommandsDir = path.join(targetDir, 'commands', 'gsd');
    if (fs.existsSync(oldCommandsDir)) {
      fs.rmSync(oldCommandsDir, { recursive: true });
      console.log(`  ${green}✓${reset} Removed old commands/gsd/ (legacy Reflect upgrade)`);
    }
  }

  // Codex: no settings.json, hooks, or statusline -- write manifest and return
  if (isCodex) {
    const gsdHome = getGsdHome();
    const defaultsPath = path.join(gsdHome, 'defaults.json');
    let defaults = {};
    if (fs.existsSync(defaultsPath)) {
      try { defaults = JSON.parse(fs.readFileSync(defaultsPath, 'utf8')); } catch {}
    }
    if (defaults.resolve_model_ids !== 'omit') {
      defaults.resolve_model_ids = 'omit';
      fs.writeFileSync(defaultsPath, JSON.stringify(defaults, null, 2) + '\n');
      console.log(`  ${green}+${reset} Set resolve_model_ids: omit for ${runtimeLabel}`);
    }

    writeManifest(targetDir);
    console.log(`  ${green}✓${reset} Wrote file manifest (${MANIFEST_NAME})`);
    pruneRedundantPatches(targetDir);
    reportLocalPatches(targetDir);
    return { settingsPath: null, settings: {}, statuslineCommand: null, runtime };
  }

  // Configure statusline and hooks in settings.json
  const settingsPath = path.join(targetDir, 'settings.json');
  const settings = validateHookFields(cleanupOrphanedHooks(readSettings(settingsPath)));
  const statuslineCommand = isGlobal
    ? buildHookCommand(targetDir, 'gsdr-statusline.js')
    : buildLocalHookCommand(dirName, 'gsdr-statusline.js');
  const updateCheckCommand = isGlobal
    ? buildHookCommand(targetDir, 'gsdr-check-update.js')
    : buildLocalHookCommand(dirName, 'gsdr-check-update.js');
  const versionCheckCommand = isGlobal
    ? buildHookCommand(targetDir, 'gsdr-version-check.js')
    : buildLocalHookCommand(dirName, 'gsdr-version-check.js');
  const ciStatusCommand = isGlobal
    ? buildHookCommand(targetDir, 'gsdr-ci-status.js')
    : buildLocalHookCommand(dirName, 'gsdr-ci-status.js');
  const healthCheckCommand = isGlobal
    ? buildHookCommand(targetDir, 'gsdr-health-check.js')
    : buildLocalHookCommand(dirName, 'gsdr-health-check.js');
  const contextMonitorCommand = isGlobal
    ? buildHookCommand(targetDir, 'gsdr-context-monitor.js')
    : 'node ' + dirName + '/hooks/gsdr-context-monitor.js';
  if (!settings.hooks) {
    settings.hooks = {};
  }
  if (!settings.hooks.SessionStart) {
    settings.hooks.SessionStart = [];
  }

  // Helper: add hook if missing, or upgrade unguarded command to guarded version.
  // Guard: only register if the hook file was actually installed (#1754 upstream).
  // When hooks/dist/ is missing from the npm package, the copy step produces no
  // files but the registration step ran unconditionally, causing hook errors on
  // every tool invocation.
  function ensureHook(hookSubstring, newCommand, label, hookFileName) {
    const hookFile = path.join(targetDir, 'hooks', hookFileName);
    const existingEntry = settings.hooks.SessionStart.find(entry =>
      entry.hooks && entry.hooks.some(h => h.command && h.command.includes(hookSubstring))
    );

    if (!existingEntry) {
      if (fs.existsSync(hookFile)) {
        settings.hooks.SessionStart.push({
          hooks: [{ type: 'command', command: newCommand }]
        });
        console.log(`  ${green}✓${reset} Configured ${label} hook`);
      } else {
        console.warn(`  ${yellow}⚠${reset}  Skipped ${label} hook — ${hookFileName} not found at target`);
      }
    } else if (!isGlobal) {
      const hook = existingEntry.hooks.find(h => h.command && h.command.includes(hookSubstring));
      if (hook && !hook.command.includes('test -f')) {
        hook.command = newCommand;
        console.log(`  ${green}✓${reset} Upgraded ${label} hook (worktree-safe guard)`);
      }
    }
  }

  ensureHook('gsdr-check-update', updateCheckCommand, 'update check', 'gsdr-check-update.js');
  ensureHook('gsdr-version-check', versionCheckCommand, 'version check', 'gsdr-version-check.js');
  ensureHook('gsdr-ci-status', ciStatusCommand, 'CI status', 'gsdr-ci-status.js');
  ensureHook('gsdr-health-check', healthCheckCommand, 'health check', 'gsdr-health-check.js');

  // Configure post-tool hook for context window monitoring
  if (!settings.hooks.PostToolUse) {
    settings.hooks.PostToolUse = [];
  }

  const hasContextMonitorHook = settings.hooks.PostToolUse.some(entry =>
    entry.hooks && entry.hooks.some(h => h.command && h.command.includes('gsdr-context-monitor'))
  );

  const contextMonitorFile = path.join(targetDir, 'hooks', 'gsdr-context-monitor.js');
  if (!hasContextMonitorHook && fs.existsSync(contextMonitorFile)) {
    settings.hooks.PostToolUse.push({
      matcher: 'Bash|Edit|Write|MultiEdit|Agent|Task',
      hooks: [
        {
          type: 'command',
          command: contextMonitorCommand,
          timeout: 10
        }
      ]
    });
    console.log(`  ${green}✓${reset} Configured context window monitor hook`);
  } else if (!hasContextMonitorHook && !fs.existsSync(contextMonitorFile)) {
    console.warn(`  ${yellow}⚠${reset}  Skipped context monitor hook — gsdr-context-monitor.js not found at target`);
  } else {
    for (const entry of settings.hooks.PostToolUse) {
      if (entry.hooks && entry.hooks.some(h => h.command && h.command.includes('gsdr-context-monitor'))) {
        let migrated = false;
        if (!entry.matcher) {
          entry.matcher = 'Bash|Edit|Write|MultiEdit|Agent|Task';
          migrated = true;
        }
        for (const h of entry.hooks) {
          if (h.command && h.command.includes('gsdr-context-monitor') && !h.timeout) {
            h.timeout = 10;
            migrated = true;
          }
        }
        if (migrated) {
          console.log(`  ${green}✓${reset} Updated context monitor hook (added matcher + timeout)`);
        }
      }
    }
  }

  // Write file manifest for future modification detection
  writeManifest(targetDir);
  console.log(`  ${green}✓${reset} Wrote file manifest (${MANIFEST_NAME})`);

  // Prune patches that match the newly installed files (false positives)
  pruneRedundantPatches(targetDir);

  // Report any backed-up local patches
  reportLocalPatches(targetDir);

  return { settingsPath, settings, statuslineCommand, runtime };
}

/**
 * Apply statusline config, then print completion message
 */
function finishInstall(settingsPath, settings, statuslineCommand, shouldInstallStatusline, runtime = 'claude') {
  if (shouldInstallStatusline) {
    settings.statusLine = {
      type: 'command',
      command: statuslineCommand
    };
    console.log(`  ${green}✓${reset} Configured statusline`);
  } else if (settings.statusLine && settings.statusLine.command &&
             settings.statusLine.command.includes('statusline') &&
             !settings.statusLine.command.includes('test -f') &&
             statuslineCommand && statuslineCommand.includes('test -f')) {
    // Upgrade existing statusline to worktree-safe guarded command
    settings.statusLine.command = statuslineCommand;
    console.log(`  ${green}✓${reset} Upgraded statusline (worktree-safe guard)`);
  }

  // Validate hook fields before writing (C7: strip invalid entries to prevent Zod rejection)
  validateHookFields(settings);
  // Always write settings
  writeSettings(settingsPath, settings);

  const program = getInstallerRuntimeLabel(runtime);
  console.log(`
  ${green}Done!${reset} Launch ${program} and run ${cyan}/gsdr:help${reset}.

  ${cyan}Join the community:${reset} https://github.com/loganrooks/get-shit-done-reflect/discussions
`);
}

/**
 * Handle statusline configuration with optional prompt
 */
function handleStatusline(settings, isInteractive, callback) {
  const hasExisting = settings.statusLine != null;

  if (!hasExisting) {
    callback(true);
    return;
  }

  if (forceStatusline) {
    callback(true);
    return;
  }

  if (!isInteractive) {
    console.log(`  ${yellow}⚠${reset} Skipping statusline (already configured)`);
    console.log(`    Use ${cyan}--force-statusline${reset} to replace\n`);
    callback(false);
    return;
  }

  const existingCmd = settings.statusLine.command || settings.statusLine.url || '(custom)';

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  console.log(`
  ${yellow}⚠${reset} Existing statusline detected\n
  Your current statusline:
    ${dim}command: ${existingCmd}${reset}

  GSD includes a statusline showing:
    • Model name
    • Current task (from todo list)
    • Context window usage (color-coded)

  ${cyan}1${reset}) Keep existing
  ${cyan}2${reset}) Replace with GSD statusline
`);

  rl.question(`  Choice ${dim}[1]${reset}: `, (answer) => {
    rl.close();
    const choice = answer.trim() || '1';
    callback(choice === '2');
  });
}

/**
 * Prompt for runtime selection
 */
function promptRuntime(callback) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  let answered = false;

  rl.on('close', () => {
    if (!answered) {
      answered = true;
      console.log(`\n  ${yellow}Installation cancelled${reset}\n`);
      process.exit(0);
    }
  });

  console.log(`  ${yellow}Which runtime(s) would you like to install for?${reset}\n\n  ${cyan}1${reset}) ${INSTALLER_RUNTIME_METADATA.claude.label} ${dim}(${INSTALLER_RUNTIME_METADATA.claude.globalDirDisplay})${reset}
  ${cyan}2${reset}) ${INSTALLER_RUNTIME_METADATA.codex.label}  ${dim}(${INSTALLER_RUNTIME_METADATA.codex.globalDirDisplay})${reset}
  ${cyan}3${reset}) All supported runtimes
`);

  rl.question(`  Choice ${dim}[1]${reset}: `, (answer) => {
    answered = true;
    rl.close();
    const choice = answer.trim() || '1';
    if (choice === '3') {
      callback([...SUPPORTED_INSTALLER_RUNTIMES]);
    } else if (choice === '2') {
      callback(['codex']);
    } else {
      callback(['claude']);
    }
  });
}

/**
 * Prompt for install location
 */
function promptLocation(runtimes) {
  if (!process.stdin.isTTY) {
    console.log(`  ${yellow}Non-interactive terminal detected, defaulting to global install${reset}\n`);
    installAllRuntimes(runtimes, true, false);
    return;
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  let answered = false;

  rl.on('close', () => {
    if (!answered) {
      answered = true;
      console.log(`\n  ${yellow}Installation cancelled${reset}\n`);
      process.exit(0);
    }
  });

  const pathExamples = runtimes.map(r => {
    const globalPath = getGlobalDir(r, explicitConfigDir);
    return globalPath.replace(os.homedir(), '~');
  }).join(', ');

  const localExamples = runtimes.map(r => `./${getDirName(r)}`).join(', ');

  console.log(`  ${yellow}Where would you like to install?${reset}\n\n  ${cyan}1${reset}) Global ${dim}(${pathExamples})${reset} - available in all projects
  ${cyan}2${reset}) Local  ${dim}(${localExamples})${reset} - this project only
`);

  rl.question(`  Choice ${dim}[1]${reset}: `, (answer) => {
    answered = true;
    rl.close();
    const choice = answer.trim() || '1';
    const isGlobal = choice !== '2';
    installAllRuntimes(runtimes, isGlobal, true);
  });
}

/**
 * Install GSD for all selected runtimes
 */
function installAllRuntimes(runtimes, isGlobal, isInteractive) {
  // Resolve GSD home and migrate KB once before per-runtime loop
  const gsdHome = getGsdHome();
  migrateKB(gsdHome, runtimes);
  installKBScripts(gsdHome);

  // Create project-local KB directories when .planning/ exists
  createProjectLocalKB();

  const results = [];

  for (const runtime of runtimes) {
    const result = install(isGlobal, runtime);
    results.push(result);
  }

  const claudeResult = results.find(r => r.runtime === 'claude');
  if (claudeResult) {
    handleStatusline(claudeResult.settings, isInteractive, (shouldInstallStatusline) => {
      if (claudeResult) {
        finishInstall(claudeResult.settingsPath, claudeResult.settings, claudeResult.statuslineCommand, shouldInstallStatusline, 'claude');
      }

      const codexResult = results.find(r => r.runtime === 'codex');
      if (codexResult) {
        console.log(`\n  ${green}Done!${reset} Launch Codex CLI and run ${cyan}$gsdr-help${reset}.\n`);
      }
    });
  } else {
    const codexResult = results.find(r => r.runtime === 'codex');
    if (codexResult) {
      console.log(`\n  ${green}Done!${reset} Launch Codex CLI and run ${cyan}$gsdr-help${reset}.\n`);
    }
  }
}

// Main logic -- only execute when run directly
if (require.main === module) {
if (hasGlobal && hasLocal) {
  console.error(`  ${yellow}Cannot specify both --global and --local${reset}`);
  process.exit(1);
} else if (runtimeSelectionError) {
  console.error(`  ${yellow}${runtimeSelectionError.message}${reset}`);
  process.exit(1);
} else if (explicitConfigDir && hasLocal) {
  console.error(`  ${yellow}Cannot use --config-dir with --local${reset}`);
  process.exit(1);
} else if (hasUninstall) {
  if (!hasGlobal && !hasLocal) {
    console.error(`  ${yellow}--uninstall requires --global or --local${reset}`);
    process.exit(1);
  }
  const runtimes = selectedRuntimes.length > 0 ? selectedRuntimes : ['claude'];
  for (const runtime of runtimes) {
    uninstall(hasGlobal, runtime);
  }
} else if (selectedRuntimes.length > 0) {
  if (!hasGlobal && !hasLocal) {
    promptLocation(selectedRuntimes);
  } else {
    installAllRuntimes(selectedRuntimes, hasGlobal, false);
  }
} else if (hasGlobal || hasLocal) {
  // Default to Claude if no runtime specified but location is
  installAllRuntimes(['claude'], hasGlobal, false);
} else {
  // Interactive
  if (!process.stdin.isTTY) {
    console.log(`  ${yellow}Non-interactive terminal detected, defaulting to Claude Code global install${reset}\n`);
    installAllRuntimes(['claude'], true, false);
  } else {
    promptRuntime((runtimes) => {
      promptLocation(runtimes);
    });
  }
}

} // end require.main === module

// Export for testing
module.exports = { replacePathsInContent, injectVersionScope, getGsdHome, migrateKB, countKBEntries, installKBScripts, createProjectLocalKB, convertClaudeToCodexSkill, convertClaudeToCodexMarkdown, convertClaudeToCodexAgentToml, copyCodexSkills, generateCodexAgentsMd, generateCodexMcpConfig, generateCodexConfigBlock, stripGsdFromCodexConfig, mergeCodexConfig, CODEX_AGENT_SANDBOX, GSD_CODEX_MARKER, safeFs, buildLocalHookCommand, extractFrontmatterAndBody, extractFrontmatterField, readSettings, writeSettings, copyWithPathReplacement, generateMigrationGuide, isVersionInRange, compareVersions, cleanupOrphanedFiles, validateHookFields, getCodexCompactPromptPath };
