#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const os = require('os');
const readline = require('readline');
const crypto = require('crypto');

// Colors
const cyan = '\x1b[36m';
const green = '\x1b[32m';
const yellow = '\x1b[33m';
const dim = '\x1b[2m';
const reset = '\x1b[0m';

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
const hasOpencode = args.includes('--opencode');
const hasClaude = args.includes('--claude');
const hasGemini = args.includes('--gemini');
const hasCodex = args.includes('--codex');
const hasBoth = args.includes('--both'); // Legacy flag, keeps working
const hasAll = args.includes('--all');
const hasUninstall = args.includes('--uninstall') || args.includes('-u');

// Runtime selection - can be set by flags or interactive prompt
let selectedRuntimes = [];
if (hasAll) {
  selectedRuntimes = ['claude', 'opencode', 'gemini', 'codex'];
} else if (hasBoth) {
  selectedRuntimes = ['claude', 'opencode'];
} else {
  if (hasOpencode) selectedRuntimes.push('opencode');
  if (hasClaude) selectedRuntimes.push('claude');
  if (hasGemini) selectedRuntimes.push('gemini');
  if (hasCodex) selectedRuntimes.push('codex');
}

// Helper to get directory name for a runtime (used for local/project installs)
function getDirName(runtime) {
  if (runtime === 'opencode') return '.opencode';
  if (runtime === 'gemini') return '.gemini';
  if (runtime === 'codex') return '.codex';
  return '.claude';
}

/**
 * Get the global config directory for OpenCode
 * OpenCode follows XDG Base Directory spec and uses ~/.config/opencode/
 * Priority: OPENCODE_CONFIG_DIR > dirname(OPENCODE_CONFIG) > XDG_CONFIG_HOME/opencode > ~/.config/opencode
 */
function getOpencodeGlobalDir() {
  // 1. Explicit OPENCODE_CONFIG_DIR env var
  if (process.env.OPENCODE_CONFIG_DIR) {
    return expandTilde(process.env.OPENCODE_CONFIG_DIR);
  }
  
  // 2. OPENCODE_CONFIG env var (use its directory)
  if (process.env.OPENCODE_CONFIG) {
    return path.dirname(expandTilde(process.env.OPENCODE_CONFIG));
  }
  
  // 3. XDG_CONFIG_HOME/opencode
  if (process.env.XDG_CONFIG_HOME) {
    return path.join(expandTilde(process.env.XDG_CONFIG_HOME), 'opencode');
  }
  
  // 4. Default: ~/.config/opencode (XDG default)
  return path.join(os.homedir(), '.config', 'opencode');
}

/**
 * Get the global config directory for a runtime
 * @param {string} runtime - 'claude', 'opencode', or 'gemini'
 * @param {string|null} explicitDir - Explicit directory from --config-dir flag
 */
function getGlobalDir(runtime, explicitDir = null) {
  if (runtime === 'opencode') {
    // For OpenCode, --config-dir overrides env vars
    if (explicitDir) {
      return expandTilde(explicitDir);
    }
    return getOpencodeGlobalDir();
  }
  
  if (runtime === 'gemini') {
    // Gemini: --config-dir > GEMINI_CONFIG_DIR > ~/.gemini
    if (explicitDir) {
      return expandTilde(explicitDir);
    }
    if (process.env.GEMINI_CONFIG_DIR) {
      return expandTilde(process.env.GEMINI_CONFIG_DIR);
    }
    return path.join(os.homedir(), '.gemini');
  }

  if (runtime === 'codex') {
    // Codex CLI: --config-dir > CODEX_CONFIG_DIR > ~/.codex
    if (explicitDir) {
      return expandTilde(explicitDir);
    }
    if (process.env.CODEX_CONFIG_DIR) {
      return expandTilde(process.env.CODEX_CONFIG_DIR);
    }
    return path.join(os.homedir(), '.codex');
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
    console.log(`  ${yellow}Usage:${reset} npx get-shit-done-reflect-cc [options]\n\n  ${yellow}Options:${reset}\n    ${cyan}-g, --global${reset}              Install globally (to config directory)\n    ${cyan}-l, --local${reset}               Install locally (to current directory)\n    ${cyan}--claude${reset}                  Install for Claude Code only\n    ${cyan}--opencode${reset}                Install for OpenCode only\n    ${cyan}--gemini${reset}                  Install for Gemini only\n    ${cyan}--codex${reset}                   Install for Codex CLI only\n    ${cyan}--all${reset}                     Install for all 4 runtimes\n    ${cyan}-u, --uninstall${reset}           Uninstall GSD (remove all GSD files)\n    ${cyan}-c, --config-dir <path>${reset}   Specify custom config directory\n    ${cyan}-h, --help${reset}                Show this help message\n    ${cyan}--force-statusline${reset}        Replace existing statusline config\n\n  ${yellow}Examples:${reset}\n    ${dim}# Interactive install (prompts for runtime and location)${reset}\n    npx get-shit-done-reflect-cc\n\n    ${dim}# Install for Claude Code globally${reset}\n    npx get-shit-done-reflect-cc --claude --global\n\n    ${dim}# Install for Gemini globally${reset}\n    npx get-shit-done-reflect-cc --gemini --global\n\n    ${dim}# Install for Codex CLI globally${reset}\n    npx get-shit-done-reflect-cc --codex --global\n\n    ${dim}# Install for all runtimes globally${reset}\n    npx get-shit-done-reflect-cc --all --global\n\n    ${dim}# Install to custom config directory${reset}\n    npx get-shit-done-reflect-cc --claude --global --config-dir ~/.claude-bc\n\n    ${dim}# Install to current project only${reset}\n    npx get-shit-done-reflect-cc --claude --local\n\n    ${dim}# Uninstall GSD from Claude Code globally${reset}\n    npx get-shit-done-reflect-cc --claude --global --uninstall\n\n  ${yellow}Notes:${reset}\n    The --config-dir option is useful when you have multiple configurations.\n    It takes priority over CLAUDE_CONFIG_DIR / GEMINI_CONFIG_DIR / CODEX_CONFIG_DIR environment variables.\n`);
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
 * Build a hook command path using forward slashes for cross-platform compatibility.
 * On Windows, $HOME is not expanded by cmd.exe/PowerShell, so we use the actual path.
 */
function buildHookCommand(configDir, hookName) {
  // Use forward slashes for Node.js compatibility on all platforms
  const hooksPath = configDir.replace(/\\/g, '/') + '/hooks/' + hookName;
  return `node "${hooksPath}"`;
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
 * @param {string} runtime - 'claude', 'opencode', or 'gemini'
 * @returns {null|undefined|string} null = remove, undefined = keep default, string = custom
 */
function getCommitAttribution(runtime) {
  // Return cached value if available
  if (attributionCache.has(runtime)) {
    return attributionCache.get(runtime);
  }

  let result;

  if (runtime === 'opencode') {
    const config = readSettings(path.join(getGlobalDir('opencode', null), 'opencode.json'));
    result = config.disable_ai_attribution === true ? null : undefined;
  } else if (runtime === 'gemini') {
    // Gemini: check gemini settings.json for attribution config
    const settings = readSettings(path.join(getGlobalDir('gemini', explicitConfigDir), 'settings.json'));
    if (!settings.attribution || settings.attribution.commit === undefined) {
      result = undefined;
    } else if (settings.attribution.commit === '') {
      result = null;
    } else {
      result = settings.attribution.commit;
    }
  } else if (runtime === 'codex') {
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

/**
 * Convert Claude Code frontmatter to opencode format
 * - Converts 'allowed-tools:' array to 'permission:' object
 * @param {string} content - Markdown file content with YAML frontmatter
 * @returns {string} - Content with converted frontmatter
 */
// Color name to hex mapping for opencode compatibility
const colorNameToHex = {
  cyan: '#00FFFF',
  red: '#FF0000',
  green: '#00FF00',
  blue: '#0000FF',
  yellow: '#FFFF00',
  magenta: '#FF00FF',
  orange: '#FFA500',
  purple: '#800080',
  pink: '#FFC0CB',
  white: '#FFFFFF',
  black: '#000000',
  gray: '#808080',
  grey: '#808080',
};

// Tool name mapping from Claude Code to OpenCode
// OpenCode uses lowercase tool names; special mappings for renamed tools
const claudeToOpencodeTools = {
  AskUserQuestion: 'question',
  SlashCommand: 'skill',
  TodoWrite: 'todowrite',
  WebFetch: 'webfetch',
  WebSearch: 'websearch',  // Plugin/MCP - keep for compatibility
};

// Tool name mapping from Claude Code to Gemini CLI
// Gemini CLI uses snake_case built-in tool names
const claudeToGeminiTools = {
  Read: 'read_file',
  Write: 'write_file',
  Edit: 'replace',
  Bash: 'run_shell_command',
  Glob: 'glob',
  Grep: 'search_file_content',
  WebSearch: 'google_web_search',
  WebFetch: 'web_fetch',
  TodoWrite: 'write_todos',
  AskUserQuestion: 'ask_user',
};

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
 * Convert a Claude Code tool name to OpenCode format
 * - Applies special mappings (AskUserQuestion -> question, etc.)
 * - Converts to lowercase (except MCP tools which keep their format)
 */
function convertToolName(claudeTool) {
  // Check for special mapping first
  if (claudeToOpencodeTools[claudeTool]) {
    return claudeToOpencodeTools[claudeTool];
  }
  // MCP tools (mcp__*) keep their format
  if (claudeTool.startsWith('mcp__')) {
    return claudeTool;
  }
  // Default: convert to lowercase
  return claudeTool.toLowerCase();
}

/**
 * Convert a Claude Code tool name to Gemini CLI format
 * - Applies Claude→Gemini mapping (Read→read_file, Bash→run_shell_command, etc.)
 * - Filters out MCP tools (mcp__*) — they are auto-discovered at runtime in Gemini
 * - Filters out Task — agents are auto-registered as tools in Gemini
 * @returns {string|null} Gemini tool name, or null if tool should be excluded
 */
function convertGeminiToolName(claudeTool) {
  // MCP tools: preserve as-is — Gemini CLI supports MCP servers
  if (claudeTool.startsWith('mcp__')) {
    return claudeTool;
  }
  // Task: exclude — agents are auto-registered as callable tools
  if (claudeTool === 'Task') {
    return null;
  }
  // Check for explicit mapping
  if (claudeToGeminiTools[claudeTool]) {
    return claudeToGeminiTools[claudeTool];
  }
  // Default: lowercase
  return claudeTool.toLowerCase();
}

/**
 * Strip HTML <sub> tags for Gemini CLI output
 * Terminals don't support subscript — Gemini renders these as raw HTML.
 * Converts <sub>text</sub> to italic *(text)* for readable terminal output.
 */
function stripSubTags(content) {
  return content.replace(/<sub>(.*?)<\/sub>/g, '*($1)*');
}

/**
 * Convert Claude Code agent frontmatter to Gemini CLI format
 * Gemini agents use .md files with YAML frontmatter, same as Claude,
 * but with different field names and formats:
 * - tools: must be a YAML array (not comma-separated string)
 * - tool names: must use Gemini built-in names (read_file, not Read)
 * - color: must be removed (causes validation error)
 * - mcp__* tools: preserved as-is (Gemini CLI supports MCP servers)
 */
function convertClaudeToGeminiAgent(content) {
  if (!content.startsWith('---')) return content;

  const endIndex = content.indexOf('---', 3);
  if (endIndex === -1) return content;

  const frontmatter = content.substring(3, endIndex).trim();
  const body = content.substring(endIndex + 3);

  const lines = frontmatter.split('\n');
  const newLines = [];
  let inAllowedTools = false;
  const tools = [];

  for (const line of lines) {
    const trimmed = line.trim();

    // Convert allowed-tools YAML array to tools list
    if (trimmed.startsWith('allowed-tools:')) {
      inAllowedTools = true;
      continue;
    }

    // Handle inline tools: field (comma-separated string)
    if (trimmed.startsWith('tools:')) {
      const toolsValue = trimmed.substring(6).trim();
      if (toolsValue) {
        const parsed = toolsValue.split(',').map(t => t.trim()).filter(t => t);
        for (const t of parsed) {
          const mapped = convertGeminiToolName(t);
          if (mapped) tools.push(mapped);
        }
      } else {
        // tools: with no value means YAML array follows
        inAllowedTools = true;
      }
      continue;
    }

    // Strip color field (not supported by Gemini CLI, causes validation error)
    if (trimmed.startsWith('color:')) continue;

    // Collect allowed-tools/tools array items
    if (inAllowedTools) {
      if (trimmed.startsWith('- ')) {
        const mapped = convertGeminiToolName(trimmed.substring(2).trim());
        if (mapped) tools.push(mapped);
        continue;
      } else if (trimmed && !trimmed.startsWith('-')) {
        inAllowedTools = false;
      }
    }

    if (!inAllowedTools) {
      newLines.push(line);
    }
  }

  // Add tools as YAML array (Gemini requires array format)
  if (tools.length > 0) {
    newLines.push('tools:');
    for (const tool of tools) {
      newLines.push(`  - ${tool}`);
    }
  }

  const newFrontmatter = newLines.join('\n').trim();
  // Apply tool name replacement to body text (same pattern as Codex converter)
  let processedBody = stripSubTags(body);
  for (const [claudeTool, geminiTool] of Object.entries(claudeToGeminiTools)) {
    processedBody = processedBody.replace(new RegExp(`\\b${claudeTool}\\b`, 'g'), geminiTool);
  }
  return `---\n${newFrontmatter}\n---${processedBody}`;
}

function convertClaudeToOpencodeFrontmatter(content) {
  // Replace tool name references in content (applies to all files)
  let convertedContent = content;
  convertedContent = convertedContent.replace(/\bAskUserQuestion\b/g, 'question');
  convertedContent = convertedContent.replace(/\bSlashCommand\b/g, 'skill');
  convertedContent = convertedContent.replace(/\bTodoWrite\b/g, 'todowrite');
  // Replace /gsd:command with /gsd-command for opencode (flat command structure)
  convertedContent = convertedContent.replace(/\/gsd:/g, '/gsd-');
  // Path replacement is handled by replacePathsInContent() at the call site.
  // Do NOT do path replacement here to avoid double-replacement.

  // Check if content has frontmatter
  if (!convertedContent.startsWith('---')) {
    return convertedContent;
  }

  // Find the end of frontmatter
  const endIndex = convertedContent.indexOf('---', 3);
  if (endIndex === -1) {
    return convertedContent;
  }

  const frontmatter = convertedContent.substring(3, endIndex).trim();
  const body = convertedContent.substring(endIndex + 3);

  // Parse frontmatter line by line (simple YAML parsing)
  const lines = frontmatter.split('\n');
  const newLines = [];
  let inAllowedTools = false;
  const allowedTools = [];

  for (const line of lines) {
    const trimmed = line.trim();

    // Detect start of allowed-tools array
    if (trimmed.startsWith('allowed-tools:')) {
      inAllowedTools = true;
      continue;
    }

    // Detect inline tools: field (comma-separated string)
    if (trimmed.startsWith('tools:')) {
      const toolsValue = trimmed.substring(6).trim();
      if (toolsValue) {
        // Parse comma-separated tools
        const tools = toolsValue.split(',').map(t => t.trim()).filter(t => t);
        allowedTools.push(...tools);
      }
      continue;
    }

    // Remove name: field - opencode uses filename for command name
    if (trimmed.startsWith('name:')) {
      continue;
    }

    // Convert color names to hex for opencode
    if (trimmed.startsWith('color:')) {
      const colorValue = trimmed.substring(6).trim().toLowerCase();
      const hexColor = colorNameToHex[colorValue];
      if (hexColor) {
        newLines.push(`color: "${hexColor}"`);
      } else if (colorValue.startsWith('#')) {
        // Validate hex color format (#RGB or #RRGGBB)
        if (/^#[0-9a-f]{3}$|^#[0-9a-f]{6}$/i.test(colorValue)) {
          // Already hex and valid, keep as is
          newLines.push(line);
        }
        // Skip invalid hex colors
      }
      // Skip unknown color names
      continue;
    }

    // Collect allowed-tools items
    if (inAllowedTools) {
      if (trimmed.startsWith('- ')) {
        allowedTools.push(trimmed.substring(2).trim());
        continue;
      } else if (trimmed && !trimmed.startsWith('-')) {
        // End of array, new field started
        inAllowedTools = false;
      }
    }

    // Keep other fields (including name: which opencode ignores)
    if (!inAllowedTools) {
      newLines.push(line);
    }
  }

  // Add tools object if we had allowed-tools or tools
  if (allowedTools.length > 0) {
    newLines.push('tools:');
    for (const tool of allowedTools) {
      newLines.push(`  ${convertToolName(tool)}: true`);
    }
  }

  // Rebuild frontmatter (body already has tool names converted)
  const newFrontmatter = newLines.join('\n').trim();
  return `---\n${newFrontmatter}\n---${body}`;
}

/**
 * Convert Claude Code markdown command to Gemini TOML format
 * @param {string} content - Markdown file content with YAML frontmatter
 * @returns {string} - TOML content
 */
function convertClaudeToGeminiToml(content) {
  // Check if content has frontmatter
  if (!content.startsWith('---')) {
    return `prompt = ${JSON.stringify(content)}\n`;
  }

  const endIndex = content.indexOf('---', 3);
  if (endIndex === -1) {
    return `prompt = ${JSON.stringify(content)}\n`;
  }

  const frontmatter = content.substring(3, endIndex).trim();
  const body = content.substring(endIndex + 3).trim();
  
  // Extract description from frontmatter
  let description = '';
  const lines = frontmatter.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('description:')) {
      description = trimmed.substring(12).trim();
      break;
    }
  }

  // Construct TOML
  let toml = '';
  if (description) {
    toml += `description = ${JSON.stringify(description)}\n`;
  }
  
  toml += `prompt = ${JSON.stringify(body)}\n`;
  
  return toml;
}

/**
 * Convert a Claude Code command markdown into Codex SKILL.md format.
 * - Replaces tool name references in body text using word-boundary regex
 * - Replaces /gsd:command-name with $gsd-command-name for Codex skill mention syntax
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

  // Step 2: Replace /gsd:command with $gsd-command for Codex skill mention
  converted = converted.replace(/\/gsd:([a-z0-9-]+)/g, '\\$gsd-$1');

  // Step 3: Convert @ file references to explicit read instructions
  // (After path replacement has already changed ~/.claude/ to the runtime prefix)
  if (pathPrefix) {
    const escapedPrefix = pathPrefix.replace(/[.*+?^${}()|[\]\\\/]/g, '\\$&');
    converted = converted.replace(new RegExp(`@(${escapedPrefix}[^\\s]+)`, 'g'), 'Read the file at `$1`');
  }
  // Also match tilde variant as fallback (covers calls without pathPrefix)
  converted = converted.replace(/@(~\/\.codex\/[^\s]+)/g, 'Read the file at `$1`');

  // Step 4: Parse frontmatter and rebuild as SKILL.md format
  if (!converted.startsWith('---')) {
    return `---\nname: ${commandName}\ndescription: GSD command: ${commandName}\n---\n\n${converted}`;
  }

  const endIndex = converted.indexOf('---', 3);
  if (endIndex === -1) return converted;

  const frontmatter = converted.substring(3, endIndex).trim();
  const body = converted.substring(endIndex + 3);

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
      content = replacePathsInContent(content, pathPrefix);
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

Use \`/skills\` or type \`$gsd-\` to discover GSD commands:

| Command | Purpose |
|---------|---------|
| \`$gsd-help\` | Show all commands and usage |
| \`$gsd-new-project\` | Initialize a new project |
| \`$gsd-plan-phase\` | Plan a project phase |
| \`$gsd-execute-phase\` | Execute a planned phase |
| \`$gsd-resume-work\` | Resume from last session |
| \`$gsd-pause-work\` | Save state for later |
| \`$gsd-progress\` | Show project progress |
| \`$gsd-signal\` | Record a signal (insight, mistake, etc.) |

## Workflow Conventions

- All project state lives in \`.planning/\` (git-committed, runtime-agnostic)
- Follow existing ROADMAP.md phases in order
- Verify each task before marking complete
- Use atomic git commits per completed task
- Read \`~/.gsd/knowledge/index.md\` before starting work for relevant lessons

## Runtime Capabilities

This runtime operates with limited capabilities compared to Claude Code:
- **No Task tool support** -- Codex cannot spawn sub-agents, so all execution is sequential within a single context
- **No hooks support** -- pre-commit hooks and other lifecycle hooks are unavailable in Codex
- **No tool restrictions** -- Codex does not support allowed-tools filtering, so all tools are always available to skills

For full runtime comparison, read the file at \`${pathPrefix}get-shit-done/references/capability-matrix.md\`.

## Non-interactive Usage (codex exec)

For scripted or CI environments, use \`codex exec\` to run GSD skills non-interactively:

\`\`\`
codex exec "Run $gsd-progress to show current project status"
codex exec "Run $gsd-execute-phase 3"
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

/**
 * Generate MCP server configuration for Codex CLI config.toml.
 * Uses marker-based section management (# GSD:BEGIN / # GSD:END) for idempotent updates.
 * Creates config.toml if it doesn't exist, merges with existing if it does.
 * @param {string} targetDir - Codex config directory (e.g., ~/.codex)
 */
function generateCodexMcpConfig(targetDir) {
  const configPath = path.join(targetDir, 'config.toml');
  const GSD_BEGIN = '# GSD:BEGIN (get-shit-done-reflect-cc)';
  const GSD_END = '# GSD:END (get-shit-done-reflect-cc)';

  // Build TOML section for all known MCP servers
  const serverEntries = Object.entries(gsdMcpServers).map(([name, server]) => {
    const argsStr = server.args.map(a => JSON.stringify(a)).join(', ');
    return `[mcp_servers.${name}]\ncommand = ${JSON.stringify(server.command)}\nargs = [${argsStr}]`;
  }).join('\n\n');

  const tomlSection = `${GSD_BEGIN}\n${serverEntries}\n${GSD_END}`;

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
 * @param {string} runtimePathPrefix - Target runtime path (e.g., "~/.config/opencode/")
 * @returns {string} Content with paths replaced
 */
function replacePathsInContent(content, runtimePathPrefix) {
  // Pass 1: Replace shared KB paths (tilde and $HOME variants)
  let result = content.replace(/~\/\.claude\/gsd-knowledge/g, '~/.gsd/knowledge');
  result = result.replace(/\$HOME\/\.claude\/gsd-knowledge/g, '$HOME/.gsd/knowledge');

  // Pass 2: Replace remaining runtime-specific paths
  // Negative lookahead for gsd-knowledge as a safety guard (Pass 1 already handled them)
  result = result.replace(/~\/\.claude\/(?!gsd-knowledge)/g, runtimePathPrefix);

  // Handle $HOME/.claude/ variant for runtime-specific paths
  // Derive the HOME-relative path suffix for $HOME substitution
  let runtimeSuffix;
  if (runtimePathPrefix.startsWith('~/')) {
    // Tilde prefix: strip ~/ to get relative-to-home path
    runtimeSuffix = runtimePathPrefix.slice(2);
  } else if (runtimePathPrefix.startsWith(os.homedir())) {
    // Absolute prefix: strip home directory to get relative-to-home path
    runtimeSuffix = runtimePathPrefix.slice(os.homedir().length + 1);
  } else {
    // Relative or other prefix (e.g., local install ./.claude/)
    // $HOME patterns are unlikely in local installs, but handle gracefully
    runtimeSuffix = runtimePathPrefix;
  }
  result = result.replace(/\$HOME\/\.claude\/(?!gsd-knowledge)/g, '$HOME/' + runtimeSuffix);

  return result;
}

/**
 * Copy commands to a flat structure for OpenCode
 * OpenCode expects: command/gsd-help.md (invoked as /gsd-help)
 * Source structure: commands/gsd/help.md
 * 
 * @param {string} srcDir - Source directory (e.g., commands/gsd/)
 * @param {string} destDir - Destination directory (e.g., command/)
 * @param {string} prefix - Prefix for filenames (e.g., 'gsd')
 * @param {string} pathPrefix - Path prefix for file references
 * @param {string} runtime - Target runtime ('claude' or 'opencode')
 */
function copyFlattenedCommands(srcDir, destDir, prefix, pathPrefix, runtime) {
  if (!fs.existsSync(srcDir)) {
    return;
  }
  
  // Remove old gsd-*.md files before copying new ones
  if (fs.existsSync(destDir)) {
    for (const file of fs.readdirSync(destDir)) {
      if (file.startsWith(`${prefix}-`) && file.endsWith('.md')) {
        fs.unlinkSync(path.join(destDir, file));
      }
    }
  } else {
    safeFs('mkdirSync', () => fs.mkdirSync(destDir, { recursive: true }), destDir);
  }

  const entries = fs.readdirSync(srcDir, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(srcDir, entry.name);
    
    if (entry.isDirectory()) {
      // Recurse into subdirectories, adding to prefix
      // e.g., commands/gsd/debug/start.md -> command/gsd-debug-start.md
      copyFlattenedCommands(srcPath, destDir, `${prefix}-${entry.name}`, pathPrefix, runtime);
    } else if (entry.name.endsWith('.md')) {
      // Flatten: help.md -> gsd-help.md
      const baseName = entry.name.replace('.md', '');
      const destName = `${prefix}-${baseName}.md`;
      const destPath = path.join(destDir, destName);

      let content = fs.readFileSync(srcPath, 'utf8');
      content = replacePathsInContent(content, pathPrefix);
      // Handle ~/.opencode/ -> target path migration (unrelated to two-pass KB/runtime split)
      const opencodeDirRegex = /~\/\.opencode\//g;
      content = content.replace(opencodeDirRegex, pathPrefix);
      content = processAttribution(content, getCommitAttribution(runtime));
      content = convertClaudeToOpencodeFrontmatter(content);

      fs.writeFileSync(destPath, content);
    }
  }
}

/**
 * Recursively copy directory, replacing paths in .md files
 * Deletes existing destDir first to remove orphaned files from previous versions
 * @param {string} srcDir - Source directory
 * @param {string} destDir - Destination directory
 * @param {string} pathPrefix - Path prefix for file references
 * @param {string} runtime - Target runtime ('claude', 'opencode', 'gemini')
 */
function copyWithPathReplacement(srcDir, destDir, pathPrefix, runtime) {
  const isOpencode = runtime === 'opencode';
  const dirName = getDirName(runtime);

  // Clean install: remove existing destination to prevent orphaned files
  if (fs.existsSync(destDir)) {
    fs.rmSync(destDir, { recursive: true });
  }
  safeFs('mkdirSync', () => fs.mkdirSync(destDir, { recursive: true }), destDir);

  const entries = fs.readdirSync(srcDir, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);

    if (entry.isDirectory()) {
      copyWithPathReplacement(srcPath, destPath, pathPrefix, runtime);
    } else if (entry.name.endsWith('.md')) {
      // Replace paths using centralized two-pass function
      let content = fs.readFileSync(srcPath, 'utf8');
      content = replacePathsInContent(content, pathPrefix);
      content = processAttribution(content, getCommitAttribution(runtime));

      // Convert frontmatter for opencode compatibility
      if (isOpencode) {
        content = convertClaudeToOpencodeFrontmatter(content);
        fs.writeFileSync(destPath, content);
      } else if (runtime === 'gemini') {
        // Convert to TOML for Gemini (strip <sub> tags — terminals can't render subscript)
        content = stripSubTags(content);
        const tomlContent = convertClaudeToGeminiToml(content);
        // Replace extension with .toml
        const tomlPath = destPath.replace(/\.md$/, '.toml');
        fs.writeFileSync(tomlPath, tomlContent);
      } else {
        fs.writeFileSync(destPath, content);
      }
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

/**
 * Clean up orphaned files from previous GSD versions
 */
function cleanupOrphanedFiles(configDir) {
  const orphanedFiles = [
    'hooks/gsd-notify.sh',  // Removed in v1.6.x
    'hooks/statusline.js',  // Renamed to gsd-statusline.js in v1.9.0
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
      !settings.statusLine.command.includes('gsd-statusline.js')) {
    // Replace old path with new path
    settings.statusLine.command = settings.statusLine.command.replace(
      /statusline\.js/,
      'gsd-statusline.js'
    );
    console.log(`  ${green}✓${reset} Updated statusline path (statusline.js → gsd-statusline.js)`);
  }

  return settings;
}

/**
 * Uninstall GSD from the specified directory for a specific runtime
 * Removes only GSD-specific files/directories, preserves user content
 * @param {boolean} isGlobal - Whether to uninstall from global or local
 * @param {string} runtime - Target runtime ('claude', 'opencode', 'gemini')
 */
function uninstall(isGlobal, runtime = 'claude') {
  const isOpencode = runtime === 'opencode';
  const isCodex = runtime === 'codex';
  const dirName = getDirName(runtime);

  // Get the target directory based on runtime and install type
  const targetDir = isGlobal
    ? getGlobalDir(runtime, explicitConfigDir)
    : path.join(process.cwd(), dirName);

  const locationLabel = isGlobal
    ? targetDir.replace(os.homedir(), '~')
    : targetDir.replace(process.cwd(), '.');

  let runtimeLabel = 'Claude Code';
  if (runtime === 'opencode') runtimeLabel = 'OpenCode';
  if (runtime === 'gemini') runtimeLabel = 'Gemini';
  if (runtime === 'codex') runtimeLabel = 'Codex CLI';

  console.log(`  Uninstalling GSD from ${cyan}${runtimeLabel}${reset} at ${cyan}${locationLabel}${reset}\n`);

  // Check if target directory exists
  if (!fs.existsSync(targetDir)) {
    console.log(`  ${yellow}⚠${reset} Directory does not exist: ${locationLabel}`);
    console.log(`  Nothing to uninstall.\n`);
    return;
  }

  let removedCount = 0;

  // 1. Remove GSD commands directory
  if (isCodex) {
    // Codex: remove skill directories (gsd-*/SKILL.md)
    const skillsDir = path.join(targetDir, 'skills');
    if (fs.existsSync(skillsDir)) {
      for (const entry of fs.readdirSync(skillsDir, { withFileTypes: true })) {
        if (entry.isDirectory() && entry.name.startsWith('gsd-')) {
          fs.rmSync(path.join(skillsDir, entry.name), { recursive: true });
          removedCount++;
        }
      }
      if (removedCount > 0) {
        console.log(`  ${green}✓${reset} Removed GSD skills`);
      }
    }
  } else if (isOpencode) {
    // OpenCode: remove command/gsd-*.md files
    const commandDir = path.join(targetDir, 'command');
    if (fs.existsSync(commandDir)) {
      const files = fs.readdirSync(commandDir);
      for (const file of files) {
        if (file.startsWith('gsd-') && file.endsWith('.md')) {
          fs.unlinkSync(path.join(commandDir, file));
          removedCount++;
        }
      }
      console.log(`  ${green}✓${reset} Removed GSD commands from command/`);
    }
  } else {
    // Claude Code & Gemini: remove commands/gsd/ directory
    const gsdCommandsDir = path.join(targetDir, 'commands', 'gsd');
    if (fs.existsSync(gsdCommandsDir)) {
      fs.rmSync(gsdCommandsDir, { recursive: true });
      removedCount++;
      console.log(`  ${green}✓${reset} Removed commands/gsd/`);
    }
  }

  // 2. Remove get-shit-done directory
  const gsdDir = path.join(targetDir, 'get-shit-done');
  if (fs.existsSync(gsdDir)) {
    fs.rmSync(gsdDir, { recursive: true });
    removedCount++;
    console.log(`  ${green}✓${reset} Removed get-shit-done/`);
  }

  // 3. Remove GSD agents (gsd-*.md files only) -- skip for Codex
  const agentsDir = path.join(targetDir, 'agents');
  if (fs.existsSync(agentsDir) && !isCodex) {
    const files = fs.readdirSync(agentsDir);
    let agentCount = 0;
    for (const file of files) {
      if (file.startsWith('gsd-') && file.endsWith('.md')) {
        fs.unlinkSync(path.join(agentsDir, file));
        agentCount++;
      }
    }
    if (agentCount > 0) {
      removedCount++;
      console.log(`  ${green}✓${reset} Removed ${agentCount} GSD agents`);
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

  // 3c. Remove GSD section from config.toml (Codex only)
  if (isCodex) {
    const configTomlPath = path.join(targetDir, 'config.toml');
    if (fs.existsSync(configTomlPath)) {
      let content = fs.readFileSync(configTomlPath, 'utf8');
      const GSD_BEGIN = '# GSD:BEGIN (get-shit-done-reflect-cc)';
      const GSD_END = '# GSD:END (get-shit-done-reflect-cc)';
      const beginIdx = content.indexOf(GSD_BEGIN);
      const endIdx = content.indexOf(GSD_END);
      if (beginIdx !== -1 && endIdx !== -1) {
        content = content.substring(0, beginIdx) + content.substring(endIdx + GSD_END.length);
        content = content.trim();
        if (content.length === 0) {
          fs.unlinkSync(configTomlPath);
        } else {
          fs.writeFileSync(configTomlPath, content + '\n');
        }
        console.log(`  ${green}✓${reset} Removed GSD section from config.toml`);
        removedCount++;
      }
    }
  }

  // 4. Remove GSD hooks (skip for Codex -- no hook system)
  if (!isCodex) {
    const hooksDir = path.join(targetDir, 'hooks');
    if (fs.existsSync(hooksDir)) {
      const gsdHooks = ['gsd-statusline.js', 'gsd-check-update.js', 'gsd-check-update.sh', 'gsd-version-check.js'];
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
        settings.statusLine.command.includes('gsd-statusline')) {
      delete settings.statusLine;
      settingsModified = true;
      console.log(`  ${green}✓${reset} Removed GSD statusline from settings`);
    }

    // Remove GSD hooks from SessionStart
    if (settings.hooks && settings.hooks.SessionStart) {
      const before = settings.hooks.SessionStart.length;
      settings.hooks.SessionStart = settings.hooks.SessionStart.filter(entry => {
        if (entry.hooks && Array.isArray(entry.hooks)) {
          // Filter out GSD hooks
          const hasGsdHook = entry.hooks.some(h =>
            h.command && (h.command.includes('gsd-check-update') || h.command.includes('gsd-statusline') || h.command.includes('gsd-version-check'))
          );
          return !hasGsdHook;
        }
        return true;
      });
      if (settings.hooks.SessionStart.length < before) {
        settingsModified = true;
        console.log(`  ${green}✓${reset} Removed GSD hooks from settings`);
      }
      // Clean up empty array
      if (settings.hooks.SessionStart.length === 0) {
        delete settings.hooks.SessionStart;
      }
      // Clean up empty hooks object
      if (Object.keys(settings.hooks).length === 0) {
        delete settings.hooks;
      }
    }

    if (settingsModified) {
      writeSettings(settingsPath, settings);
      removedCount++;
    }
  }

  // 6. For OpenCode, clean up permissions from opencode.json
  if (isOpencode) {
    const opencodeConfigDir = getOpencodeGlobalDir();
    const configPath = path.join(opencodeConfigDir, 'opencode.json');
    if (fs.existsSync(configPath)) {
      try {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        let modified = false;

        // Remove GSD permission entries
        if (config.permission) {
          for (const permType of ['read', 'external_directory']) {
            if (config.permission[permType]) {
              const keys = Object.keys(config.permission[permType]);
              for (const key of keys) {
                if (key.includes('get-shit-done')) {
                  delete config.permission[permType][key];
                  modified = true;
                }
              }
              // Clean up empty objects
              if (Object.keys(config.permission[permType]).length === 0) {
                delete config.permission[permType];
              }
            }
          }
          if (Object.keys(config.permission).length === 0) {
            delete config.permission;
          }
        }

        if (modified) {
          fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n');
          removedCount++;
          console.log(`  ${green}✓${reset} Removed GSD permissions from opencode.json`);
        }
      } catch (e) {
        // Ignore JSON parse errors
      }
    }
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
function parseJsonc(content) {
  // Strip BOM if present
  if (content.charCodeAt(0) === 0xFEFF) {
    content = content.slice(1);
  }

  // Remove single-line and block comments while preserving strings
  let result = '';
  let inString = false;
  let i = 0;
  while (i < content.length) {
    const char = content[i];
    const next = content[i + 1];

    if (inString) {
      result += char;
      // Handle escape sequences
      if (char === '\\' && i + 1 < content.length) {
        result += next;
        i += 2;
        continue;
      }
      if (char === '"') {
        inString = false;
      }
      i++;
    } else {
      if (char === '"') {
        inString = true;
        result += char;
        i++;
      } else if (char === '/' && next === '/') {
        // Skip single-line comment until end of line
        while (i < content.length && content[i] !== '\n') {
          i++;
        }
      } else if (char === '/' && next === '*') {
        // Skip block comment
        i += 2;
        while (i < content.length - 1 && !(content[i] === '*' && content[i + 1] === '/')) {
          i++;
        }
        i += 2; // Skip closing */
      } else {
        result += char;
        i++;
      }
    }
  }

  // Remove trailing commas before } or ]
  result = result.replace(/,(\s*[}\]])/g, '$1');

  return JSON.parse(result);
}

/**
 * Configure OpenCode permissions to allow reading GSD reference docs
 * This prevents permission prompts when GSD accesses the get-shit-done directory
 */
function configureOpencodePermissions() {
  // OpenCode config file is at ~/.config/opencode/opencode.json
  const opencodeConfigDir = getOpencodeGlobalDir();
  const configPath = path.join(opencodeConfigDir, 'opencode.json');

  // Ensure config directory exists
  safeFs('mkdirSync', () => fs.mkdirSync(opencodeConfigDir, { recursive: true }), opencodeConfigDir);

  // Read existing config or create empty object
  let config = {};
  if (fs.existsSync(configPath)) {
    try {
      const content = fs.readFileSync(configPath, 'utf8');
      config = parseJsonc(content);
    } catch (e) {
      // Cannot parse - DO NOT overwrite user's config
      console.log(`  ${yellow}⚠${reset} Could not parse opencode.json - skipping permission config`);
      console.log(`    ${dim}Reason: ${e.message}${reset}`);
      console.log(`    ${dim}Your config was NOT modified. Fix the syntax manually if needed.${reset}`);
      return;
    }
  }

  // Ensure permission structure exists
  if (!config.permission) {
    config.permission = {};
  }

  // Build the GSD path using the actual config directory
  // Use ~ shorthand if it's in the default location, otherwise use full path
  const defaultConfigDir = path.join(os.homedir(), '.config', 'opencode');
  const gsdPath = opencodeConfigDir === defaultConfigDir
    ? '~/.config/opencode/get-shit-done/*'
    : `${opencodeConfigDir.replace(/\\/g, '/')}/get-shit-done/*`;
  
  let modified = false;

  // Configure read permission
  if (!config.permission.read || typeof config.permission.read !== 'object') {
    config.permission.read = {};
  }
  if (config.permission.read[gsdPath] !== 'allow') {
    config.permission.read[gsdPath] = 'allow';
    modified = true;
  }

  // Configure external_directory permission (the safety guard for paths outside project)
  if (!config.permission.external_directory || typeof config.permission.external_directory !== 'object') {
    config.permission.external_directory = {};
  }
  if (config.permission.external_directory[gsdPath] !== 'allow') {
    config.permission.external_directory[gsdPath] = 'allow';
    modified = true;
  }

  if (!modified) {
    return; // Already configured
  }

  // Write config back
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n');
  console.log(`  ${green}✓${reset} Configured read permission for GSD docs`);
}

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
 * @param {string} runtime - Target runtime ('claude', 'opencode', 'gemini')
 */

// ──────────────────────────────────────────────────────
// Local Patch Persistence
// ──────────────────────────────────────────────────────

const PATCHES_DIR_NAME = 'gsd-local-patches';
const MANIFEST_NAME = 'gsd-file-manifest.json';

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
  const gsdDir = path.join(configDir, 'get-shit-done');
  const commandsDir = path.join(configDir, 'commands', 'gsd');
  const agentsDir = path.join(configDir, 'agents');
  const manifest = { version: pkg.version, timestamp: new Date().toISOString(), files: {} };

  const gsdHashes = generateManifest(gsdDir);
  for (const [rel, hash] of Object.entries(gsdHashes)) {
    manifest.files['get-shit-done/' + rel] = hash;
  }
  if (fs.existsSync(commandsDir)) {
    const cmdHashes = generateManifest(commandsDir);
    for (const [rel, hash] of Object.entries(cmdHashes)) {
      manifest.files['commands/gsd/' + rel] = hash;
    }
  }
  if (fs.existsSync(agentsDir)) {
    for (const file of fs.readdirSync(agentsDir)) {
      if (file.startsWith('gsd-') && file.endsWith('.md')) {
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
  const isOpencode = runtime === 'opencode';
  const isGemini = runtime === 'gemini';
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
  // For global installs: use full path
  // For local installs: use relative
  const pathPrefix = isGlobal
    ? `${targetDir.replace(/\\/g, '/')}/`
    : `./${dirName}/`;

  let runtimeLabel = 'Claude Code';
  if (isOpencode) runtimeLabel = 'OpenCode';
  if (isGemini) runtimeLabel = 'Gemini';
  if (isCodex) runtimeLabel = 'Codex CLI';

  console.log(`  Installing for ${cyan}${runtimeLabel}${reset} to ${cyan}${locationLabel}${reset}\n`);

  // Track installation failures
  const failures = [];

  // Save any locally modified GSD files before they get wiped
  saveLocalPatches(targetDir);

  // Clean up orphaned files from previous versions
  cleanupOrphanedFiles(targetDir);

  // Codex: Skills in skills/ directory
  // OpenCode uses 'command/' (singular) with flat structure
  // Claude Code & Gemini use 'commands/' (plural) with nested structure
  if (isCodex) {
    const skillsDir = path.join(targetDir, 'skills');
    safeFs('mkdirSync', () => fs.mkdirSync(skillsDir, { recursive: true }), skillsDir);
    const gsdSrc = path.join(src, 'commands', 'gsd');
    copyCodexSkills(gsdSrc, skillsDir, 'gsd', pathPrefix);
    if (verifyInstalled(skillsDir, 'skills/gsd-*')) {
      const count = fs.readdirSync(skillsDir).filter(d =>
        d.startsWith('gsd-') && fs.statSync(path.join(skillsDir, d)).isDirectory()
      ).length;
      console.log(`  ${green}+${reset} Installed ${count} skills to skills/`);
    } else {
      failures.push('skills/gsd-*');
    }
  } else if (isOpencode) {
    // OpenCode: flat structure in command/ directory
    const commandDir = path.join(targetDir, 'command');
    safeFs('mkdirSync', () => fs.mkdirSync(commandDir, { recursive: true }), commandDir);
    
    // Copy commands/gsd/*.md as command/gsd-*.md (flatten structure)
    const gsdSrc = path.join(src, 'commands', 'gsd');
    copyFlattenedCommands(gsdSrc, commandDir, 'gsd', pathPrefix, runtime);
    if (verifyInstalled(commandDir, 'command/gsd-*')) {
      const count = fs.readdirSync(commandDir).filter(f => f.startsWith('gsd-')).length;
      console.log(`  ${green}✓${reset} Installed ${count} commands to command/`);
    } else {
      failures.push('command/gsd-*');
    }
  } else {
    // Claude Code & Gemini: nested structure in commands/ directory
    const commandsDir = path.join(targetDir, 'commands');
    safeFs('mkdirSync', () => fs.mkdirSync(commandsDir, { recursive: true }), commandsDir);
    
    const gsdSrc = path.join(src, 'commands', 'gsd');
    const gsdDest = path.join(commandsDir, 'gsd');
    copyWithPathReplacement(gsdSrc, gsdDest, pathPrefix, runtime);
    if (verifyInstalled(gsdDest, 'commands/gsd')) {
      console.log(`  ${green}✓${reset} Installed commands/gsd`);
    } else {
      failures.push('commands/gsd');
    }
  }

  // Copy get-shit-done skill with path replacement
  const skillSrc = path.join(src, 'get-shit-done');
  const skillDest = path.join(targetDir, 'get-shit-done');
  copyWithPathReplacement(skillSrc, skillDest, pathPrefix, runtime);
  if (verifyInstalled(skillDest, 'get-shit-done')) {
    console.log(`  ${green}✓${reset} Installed get-shit-done`);
  } else {
    failures.push('get-shit-done');
  }

  // Verify feature manifest was installed
  const manifestDest = path.join(skillDest, 'feature-manifest.json');
  if (fs.existsSync(manifestDest)) {
    console.log(`  ${green}+${reset} Feature manifest installed`);
  } else {
    console.log(`  ${yellow}!${reset} Feature manifest not found (expected at ${manifestDest})`);
  }

  // Copy agents to agents directory (skip for Codex -- uses AGENTS.md instead)
  const agentsSrc = path.join(src, 'agents');
  if (fs.existsSync(agentsSrc) && !isCodex) {
    const agentsDest = path.join(targetDir, 'agents');
    safeFs('mkdirSync', () => fs.mkdirSync(agentsDest, { recursive: true }), agentsDest);

    // Remove old GSD agents (gsd-*.md) before copying new ones
    if (fs.existsSync(agentsDest)) {
      for (const file of fs.readdirSync(agentsDest)) {
        if (file.startsWith('gsd-') && file.endsWith('.md')) {
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
        content = replacePathsInContent(content, pathPrefix);
        content = processAttribution(content, getCommitAttribution(runtime));
        // Convert frontmatter for runtime compatibility
        if (isOpencode) {
          content = convertClaudeToOpencodeFrontmatter(content);
        } else if (isGemini) {
          content = convertClaudeToGeminiAgent(content);
        }
        fs.writeFileSync(path.join(agentsDest, entry.name), content);
      }
    }
    if (verifyInstalled(agentsDest, 'agents')) {
      console.log(`  ${green}✓${reset} Installed agents`);
    } else {
      failures.push('agents');
    }
  }

  // Generate AGENTS.md for Codex
  if (isCodex) {
    generateCodexAgentsMd(targetDir, pathPrefix);
    console.log(`  ${green}+${reset} Generated AGENTS.md`);
    generateCodexMcpConfig(targetDir);
    console.log(`  ${green}+${reset} Generated MCP config in config.toml`);
  }

  // Copy CHANGELOG.md
  const changelogSrc = path.join(src, 'CHANGELOG.md');
  const changelogDest = path.join(targetDir, 'get-shit-done', 'CHANGELOG.md');
  if (fs.existsSync(changelogSrc)) {
    fs.copyFileSync(changelogSrc, changelogDest);
    if (verifyFileInstalled(changelogDest, 'CHANGELOG.md')) {
      console.log(`  ${green}✓${reset} Installed CHANGELOG.md`);
    } else {
      failures.push('CHANGELOG.md');
    }
  }

  // Write VERSION file
  const versionDest = path.join(targetDir, 'get-shit-done', 'VERSION');
  fs.writeFileSync(versionDest, pkg.version);
  if (verifyFileInstalled(versionDest, 'VERSION')) {
    console.log(`  ${green}✓${reset} Wrote VERSION (${pkg.version})`);
  } else {
    failures.push('VERSION');
  }

  // Copy hooks from dist/ (bundled with dependencies) -- skip for Codex (no hook system)
  const hooksSrc = path.join(src, 'hooks', 'dist');
  if (fs.existsSync(hooksSrc) && !isCodex) {
    const hooksDest = path.join(targetDir, 'hooks');
    safeFs('mkdirSync', () => fs.mkdirSync(hooksDest, { recursive: true }), hooksDest);
    const hookEntries = fs.readdirSync(hooksSrc);
    for (const entry of hookEntries) {
      const srcFile = path.join(hooksSrc, entry);
      if (fs.statSync(srcFile).isFile()) {
        const destFile = path.join(hooksDest, entry);
        fs.copyFileSync(srcFile, destFile);
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

  // Codex: no settings.json, hooks, or statusline -- write manifest and return
  if (isCodex) {
    writeManifest(targetDir);
    console.log(`  ${green}✓${reset} Wrote file manifest (${MANIFEST_NAME})`);
    reportLocalPatches(targetDir);
    return { settingsPath: null, settings: {}, statuslineCommand: null, runtime };
  }

  // Configure statusline and hooks in settings.json
  // Gemini shares same hook system as Claude Code for now
  const settingsPath = path.join(targetDir, 'settings.json');
  const settings = cleanupOrphanedHooks(readSettings(settingsPath));
  const statuslineCommand = isGlobal
    ? buildHookCommand(targetDir, 'gsd-statusline.js')
    : 'node ' + dirName + '/hooks/gsd-statusline.js';
  const updateCheckCommand = isGlobal
    ? buildHookCommand(targetDir, 'gsd-check-update.js')
    : 'node ' + dirName + '/hooks/gsd-check-update.js';
  const versionCheckCommand = isGlobal
    ? buildHookCommand(targetDir, 'gsd-version-check.js')
    : 'node ' + dirName + '/hooks/gsd-version-check.js';

  // Enable experimental agents for Gemini CLI (required for custom sub-agents)
  if (isGemini) {
    if (!settings.experimental) {
      settings.experimental = {};
    }
    if (!settings.experimental.enableAgents) {
      settings.experimental.enableAgents = true;
      console.log(`  ${green}✓${reset} Enabled experimental agents`);
    }
  }

  // Configure SessionStart hook for update checking (skip for opencode)
  if (!isOpencode) {
    if (!settings.hooks) {
      settings.hooks = {};
    }
    if (!settings.hooks.SessionStart) {
      settings.hooks.SessionStart = [];
    }

    const hasGsdUpdateHook = settings.hooks.SessionStart.some(entry =>
      entry.hooks && entry.hooks.some(h => h.command && h.command.includes('gsd-check-update'))
    );

    if (!hasGsdUpdateHook) {
      settings.hooks.SessionStart.push({
        hooks: [
          {
            type: 'command',
            command: updateCheckCommand
          }
        ]
      });
      console.log(`  ${green}✓${reset} Configured update check hook`);
    }

    const hasGsdVersionHook = settings.hooks.SessionStart.some(entry =>
      entry.hooks && entry.hooks.some(h => h.command && h.command.includes('gsd-version-check'))
    );

    if (!hasGsdVersionHook) {
      settings.hooks.SessionStart.push({
        hooks: [
          {
            type: 'command',
            command: versionCheckCommand
          }
        ]
      });
      console.log(`  ${green}✓${reset} Configured version check hook`);
    }
  }

  // Write file manifest for future modification detection
  writeManifest(targetDir);
  console.log(`  ${green}✓${reset} Wrote file manifest (${MANIFEST_NAME})`);

  // Report any backed-up local patches
  reportLocalPatches(targetDir);

  return { settingsPath, settings, statuslineCommand, runtime };
}

/**
 * Apply statusline config, then print completion message
 */
function finishInstall(settingsPath, settings, statuslineCommand, shouldInstallStatusline, runtime = 'claude') {
  const isOpencode = runtime === 'opencode';

  if (shouldInstallStatusline && !isOpencode) {
    settings.statusLine = {
      type: 'command',
      command: statuslineCommand
    };
    console.log(`  ${green}✓${reset} Configured statusline`);
  }

  // Always write settings
  writeSettings(settingsPath, settings);

  // Configure OpenCode permissions
  if (isOpencode) {
    configureOpencodePermissions();
  }

  let program = 'Claude Code';
  if (runtime === 'opencode') program = 'OpenCode';
  if (runtime === 'gemini') program = 'Gemini';

  const command = isOpencode ? '/gsd-help' : '/gsd:help';
  console.log(`
  ${green}Done!${reset} Launch ${program} and run ${cyan}${command}${reset}.

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

  console.log(`  ${yellow}Which runtime(s) would you like to install for?${reset}\n\n  ${cyan}1${reset}) Claude Code ${dim}(~/.claude)${reset}
  ${cyan}2${reset}) OpenCode    ${dim}(~/.config/opencode)${reset} - open source, free models
  ${cyan}3${reset}) Gemini      ${dim}(~/.gemini)${reset}
  ${cyan}4${reset}) Codex CLI   ${dim}(~/.codex)${reset}
  ${cyan}5${reset}) All
`);

  rl.question(`  Choice ${dim}[1]${reset}: `, (answer) => {
    answered = true;
    rl.close();
    const choice = answer.trim() || '1';
    if (choice === '5') {
      callback(['claude', 'opencode', 'gemini', 'codex']);
    } else if (choice === '4') {
      callback(['codex']);
    } else if (choice === '3') {
      callback(['gemini']);
    } else if (choice === '2') {
      callback(['opencode']);
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

  const results = [];

  for (const runtime of runtimes) {
    const result = install(isGlobal, runtime);
    results.push(result);
  }

  // Handle statusline for Claude & Gemini (OpenCode uses themes)
  const claudeResult = results.find(r => r.runtime === 'claude');
  const geminiResult = results.find(r => r.runtime === 'gemini');

  // Logic: if both are present, ask once if interactive? Or ask for each?
  // Simpler: Ask once and apply to both if applicable.
  
  if (claudeResult || geminiResult) {
    // Use whichever settings exist to check for existing statusline
    const primaryResult = claudeResult || geminiResult;

    handleStatusline(primaryResult.settings, isInteractive, (shouldInstallStatusline) => {
      if (claudeResult) {
        finishInstall(claudeResult.settingsPath, claudeResult.settings, claudeResult.statuslineCommand, shouldInstallStatusline, 'claude');
      }
      if (geminiResult) {
         finishInstall(geminiResult.settingsPath, geminiResult.settings, geminiResult.statuslineCommand, shouldInstallStatusline, 'gemini');
      }

      const opencodeResult = results.find(r => r.runtime === 'opencode');
      if (opencodeResult) {
        finishInstall(opencodeResult.settingsPath, opencodeResult.settings, opencodeResult.statuslineCommand, false, 'opencode');
      }

      const codexResult = results.find(r => r.runtime === 'codex');
      if (codexResult) {
        console.log(`\n  ${green}Done!${reset} Launch Codex CLI and run ${cyan}$gsd-help${reset}.\n`);
      }
    });
  } else {
    // Only non-Claude/non-Gemini runtimes
    const opencodeResult = results.find(r => r.runtime === 'opencode');
    if (opencodeResult) {
      finishInstall(opencodeResult.settingsPath, opencodeResult.settings, opencodeResult.statuslineCommand, false, 'opencode');
    }

    const codexResult = results.find(r => r.runtime === 'codex');
    if (codexResult) {
      console.log(`\n  ${green}Done!${reset} Launch Codex CLI and run ${cyan}$gsd-help${reset}.\n`);
    }
  }
}

// Main logic -- only execute when run directly
if (require.main === module) {
if (hasGlobal && hasLocal) {
  console.error(`  ${yellow}Cannot specify both --global and --local${reset}`);
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
module.exports = { replacePathsInContent, getGsdHome, migrateKB, countKBEntries, installKBScripts, convertClaudeToCodexSkill, copyCodexSkills, generateCodexAgentsMd, generateCodexMcpConfig, convertClaudeToGeminiAgent, safeFs };
