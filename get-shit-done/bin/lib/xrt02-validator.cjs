'use strict';

const fs = require('node:fs');
const path = require('node:path');

const {
  claudeToCodexTools,
  replacePathsInContent,
  convertClaudeToCodexMarkdown,
  convertClaudeToCodexAgentToml,
  extractFrontmatterAndBody,
  extractFrontmatterField,
} = require('../../../bin/install.js');

const {
  artifactCategoryApplies,
  loadCapabilityMatrix,
} = require('./patch-classifier.cjs');

function normalizeRelPath(relPath) {
  return String(relPath || '').replace(/\\/g, '/');
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function detectFormat(relPath) {
  const normalized = normalizeRelPath(relPath);
  if (normalized.endsWith('SKILL.md') || normalized.endsWith('.md')) return 'markdown';
  if (normalized.endsWith('.toml')) return 'toml';
  return 'unknown';
}

function readFrontmatterMetadata(patchContent) {
  const content = String(patchContent || '');
  const parsed = extractFrontmatterAndBody(content);
  const hasDelimitedFrontmatter = content.startsWith('---');
  const malformedFrontmatter = hasDelimitedFrontmatter && parsed.frontmatter === null;

  return {
    ...parsed,
    malformedFrontmatter,
    name: parsed.frontmatter ? extractFrontmatterField(parsed.frontmatter, 'name') : null,
    description: parsed.frontmatter ? extractFrontmatterField(parsed.frontmatter, 'description') : null,
    version: parsed.frontmatter
      ? extractFrontmatterField(parsed.frontmatter, 'version') || extractFrontmatterField(parsed.frontmatter, 'from_version')
      : null,
  };
}

function extractFrontmatterArray(frontmatter, fieldName) {
  if (!frontmatter) return [];
  const inlinePattern = new RegExp(`^${escapeRegex(fieldName)}:\\s*\\[([^\\]]*)\\]`, 'm');
  const inlineMatch = frontmatter.match(inlinePattern);
  if (inlineMatch) {
    return inlineMatch[1]
      .split(',')
      .map((entry) => entry.trim().replace(/^['"]|['"]$/g, ''))
      .filter(Boolean);
  }

  const lines = frontmatter.split('\n');
  const values = [];
  let inArray = false;
  for (const line of lines) {
    const trimmed = line.trim();
    if (!inArray) {
      if (trimmed === `${fieldName}:`) {
        inArray = true;
      }
      continue;
    }

    if (!trimmed.startsWith('- ')) {
      break;
    }
    values.push(trimmed.slice(2).trim().replace(/^['"]|['"]$/g, ''));
  }

  return values.filter(Boolean);
}

function findClaudeToolReferences(patchContent) {
  const { frontmatter, body } = readFrontmatterMetadata(patchContent);
  const references = new Set();
  const searchableText = `${frontmatter || ''}\n${body || ''}`;

  for (const fieldName of ['allowed-tools', 'allowed_tools']) {
    for (const toolName of extractFrontmatterArray(frontmatter, fieldName)) {
      if (Object.prototype.hasOwnProperty.call(claudeToCodexTools, toolName)) {
        references.add(toolName);
      }
    }
  }

  for (const toolName of Object.keys(claudeToCodexTools || {})) {
    const callPattern = new RegExp(`\\b${escapeRegex(toolName)}\\s*\\(`);
    if (callPattern.test(searchableText)) {
      references.add(toolName);
    }
  }

  return Array.from(references);
}

function referencesClaudeHooks(patchContent) {
  const hookPatterns = [
    /settings\.hooks\.[A-Za-z]+/i,
    /~\/\.claude\/hooks\/[A-Za-z0-9._/-]+/i,
    /(?:^|[^A-Za-z0-9_.-])hooks\/[A-Za-z0-9._/-]+/i,
  ];

  return hookPatterns.some((pattern) => pattern.test(String(patchContent || '')));
}

function resolveCapabilityMatrixText({ capabilityMatrixText, targetRuntime, targetRuntimeDir }) {
  if (capabilityMatrixText) return capabilityMatrixText;
  if (targetRuntimeDir) {
    const matrixFromInstall = loadCapabilityMatrix(targetRuntimeDir, targetRuntime);
    if (matrixFromInstall) return matrixFromInstall;
  }

  const bundledMatrixPath = path.resolve(__dirname, '..', '..', 'references', 'capability-matrix.md');
  if (fs.existsSync(bundledMatrixPath)) {
    return fs.readFileSync(bundledMatrixPath, 'utf8');
  }

  return null;
}

function runtimeAxis({ patchContent, targetRuntime, relPath, capabilityMatrixText }) {
  const normalized = normalizeRelPath(relPath);
  const representability = artifactCategoryApplies(targetRuntime, normalized, capabilityMatrixText);
  if (!representability.applies) {
    return {
      compatible: false,
      class: 'feature-gap',
      reason: representability.reason || 'target-runtime-has-no-surface',
    };
  }

  if (targetRuntime === 'codex' && referencesClaudeHooks(patchContent)) {
    return {
      compatible: false,
      class: 'feature-gap',
      reason: 'codex-hooks-under-development',
    };
  }

  if (targetRuntime === 'codex') {
    const referencedClaudeTools = findClaudeToolReferences(patchContent);
    const unmappableTools = referencedClaudeTools.filter((toolName) => !claudeToCodexTools[toolName]);
    if (unmappableTools.length > 0) {
      return {
        compatible: false,
        class: 'feature-gap',
        reason: `claude-tools-with-no-codex-mapping:${unmappableTools.join(',')}`,
      };
    }
  }

  return { compatible: true, reason: null };
}

function formatAxis({ patchContent, relPath, targetRuntime }) {
  const normalized = normalizeRelPath(relPath);
  const format = detectFormat(normalized);
  const metadata = readFrontmatterMetadata(patchContent);

  if (metadata.malformedFrontmatter) {
    return {
      compatible: false,
      class: 'format-drift',
      reason: 'malformed-markdown-frontmatter',
    };
  }

  if (normalized.endsWith('SKILL.md') && targetRuntime === 'claude') {
    return {
      compatible: false,
      class: 'feature-gap',
      reason: 'skill-md-is-codex-only',
    };
  }

  if (format === 'toml' && targetRuntime === 'claude') {
    return {
      compatible: false,
      class: 'feature-gap',
      reason: 'toml-format-is-codex-only',
    };
  }

  if (format === 'unknown') {
    return {
      compatible: true,
      reason: 'unknown-format-assumed-text',
      low_confidence: true,
    };
  }

  return {
    compatible: true,
    reason: null,
    metadata: {
      name: metadata.name,
      description: metadata.description,
    },
  };
}

function majorVersion(version) {
  const match = String(version || '').match(/^(\d+)/);
  return match ? Number.parseInt(match[1], 10) : null;
}

function versionAxis({ patchSourceVersion, targetVersion }) {
  if (!patchSourceVersion || !targetVersion) {
    return { compatible: true, reason: null };
  }

  const sourceMajor = majorVersion(patchSourceVersion);
  const targetMajor = majorVersion(targetVersion);
  if (sourceMajor == null || targetMajor == null) {
    return {
      compatible: true,
      reason: 'version-format-unparsed',
      low_confidence: true,
    };
  }

  if (sourceMajor !== targetMajor) {
    return {
      compatible: false,
      class: 'feature-gap',
      reason: `major-version-mismatch:${patchSourceVersion}->${targetVersion}`,
    };
  }

  return { compatible: true, reason: null };
}

function rewriteClaudeToolReferences(content) {
  let converted = content;
  for (const [claudeTool, codexTool] of Object.entries(claudeToCodexTools || {})) {
    if (!codexTool) continue;
    const pattern = new RegExp(`\\b${escapeRegex(claudeTool)}\\b`, 'g');
    converted = converted.replace(pattern, codexTool);
  }
  return converted;
}

function deriveAgentName(relPath) {
  const normalized = normalizeRelPath(relPath);
  const parsed = path.posix.parse(normalized);
  if (!parsed.name) return '';
  if (parsed.name.startsWith('gsd-')) {
    return parsed.name.replace(/^gsd-/, 'gsdr-');
  }
  return parsed.name;
}

function convertClaudePatchToCodex({ patchContent, relPath }) {
  let converted = replacePathsInContent(String(patchContent || ''), '~/.codex/', './.codex/');
  converted = convertClaudeToCodexMarkdown(converted);
  converted = rewriteClaudeToolReferences(converted);

  const normalized = normalizeRelPath(relPath);
  if (normalized.startsWith('agents/') && detectFormat(normalized) === 'markdown') {
    converted = convertClaudeToCodexAgentToml(converted, deriveAgentName(normalized));
  }

  return converted;
}

function findResidualClaudeSyntax(convertedContent) {
  const residuals = [];
  const text = String(convertedContent || '');

  if (/~\/\.claude\//.test(text) || /\$HOME\/\.claude\//.test(text) || /\.\/\.claude\//.test(text)) {
    residuals.push('claude-path-prefix');
  }
  if (/\/gsdr:/.test(text) || /\$ARGUMENTS\b/.test(text)) {
    residuals.push('claude-command-syntax');
  }

  return residuals;
}

function conversionAxis({ patchContent, patchSourceRuntime, targetRuntime, relPath }) {
  const originalContent = String(patchContent || '');

  if (patchSourceRuntime === targetRuntime) {
    return {
      compatible: true,
      reason: null,
      converted: originalContent,
    };
  }

  if (patchSourceRuntime === 'claude' && targetRuntime === 'codex') {
    try {
      const converted = convertClaudePatchToCodex({ patchContent: originalContent, relPath });
      if (!converted.trim()) {
        return {
          compatible: false,
          class: 'format-drift',
          reason: 'conversion-produced-empty-output',
          low_confidence: true,
        };
      }

      const sizeRatio = converted.length / Math.max(originalContent.length, 1);
      if (sizeRatio < 0.25 || sizeRatio > 4) {
        return {
          compatible: false,
          class: 'format-drift',
          reason: 'conversion-output-size-anomaly',
          converted,
          low_confidence: true,
        };
      }

      const residuals = findResidualClaudeSyntax(converted);
      if (residuals.length > 0) {
        return {
          compatible: false,
          class: 'format-drift',
          reason: `conversion-left-residuals:${residuals.join(',')}`,
          converted,
          low_confidence: true,
        };
      }

      return {
        compatible: true,
        reason: converted === originalContent ? null : 'converted-claude-patch-to-codex',
        converted,
      };
    } catch (error) {
      return {
        compatible: false,
        class: 'format-drift',
        reason: `conversion-threw:${error.message}`,
        low_confidence: true,
      };
    }
  }

  return {
    compatible: false,
    class: 'format-drift',
    reason: 'codex-to-claude-conversion-not-yet-implemented',
    low_confidence: true,
  };
}

function resultConfidence({ compatible, className, lowConfidence }) {
  if (lowConfidence) return 'low';
  if (compatible) return 'high';
  if (className === 'feature-gap') return 'high';
  return 'medium';
}

function resultRemediation({ compatible, className, converted, patchContent }) {
  if (compatible) {
    return converted && converted !== patchContent ? 'convert-and-apply' : null;
  }
  if (className === 'feature-gap') return 'skip';
  if (converted && converted !== patchContent) return 'convert-and-apply';
  return 'abort';
}

function validatePatchForRuntime(params) {
  const patchContent = String(params?.patchContent || '');
  const patchSourceRuntime = params?.patchSourceRuntime;
  const targetRuntime = params?.targetRuntime;
  const relPath = normalizeRelPath(params?.relPath);

  if (!patchContent || !patchSourceRuntime || !targetRuntime || !relPath) {
    return {
      compatible: false,
      class: 'format-drift',
      confidence: 'low',
      evidence: { reason: 'invalid-validator-input' },
      remediation: 'abort',
      low_confidence: true,
    };
  }

  const metadata = readFrontmatterMetadata(patchContent);
  const capabilityMatrixText = resolveCapabilityMatrixText({
    capabilityMatrixText: params.capabilityMatrixText,
    targetRuntime,
    targetRuntimeDir: params.targetRuntimeDir,
  });
  const patchSourceVersion = params.patchSourceVersion || metadata.version || null;
  const targetVersion = params.targetVersion || null;

  const runtimeResult = runtimeAxis({
    patchContent,
    targetRuntime,
    relPath,
    capabilityMatrixText,
  });
  const formatResult = formatAxis({
    patchContent,
    relPath,
    targetRuntime,
  });
  const versionResult = versionAxis({
    patchSourceVersion,
    targetVersion,
  });
  const conversionResult = conversionAxis({
    patchContent,
    patchSourceRuntime,
    targetRuntime,
    relPath,
  });

  const axisResults = [
    { axis: 'runtime', result: runtimeResult },
    { axis: 'format', result: formatResult },
    { axis: 'version', result: versionResult },
    { axis: 'conversion', result: conversionResult },
  ];
  const primaryFailure = axisResults.find(({ result }) => !result.compatible);
  const lowConfidence = axisResults.some(({ result }) => result.low_confidence);
  const converted = conversionResult.converted;

  if (primaryFailure) {
    const className = primaryFailure.result.class || 'format-drift';
    return {
      compatible: false,
      class: className,
      confidence: resultConfidence({ compatible: false, className, lowConfidence }),
      evidence: {
        axis: primaryFailure.axis,
        reason: primaryFailure.result.reason,
        relPath,
        source_runtime: patchSourceRuntime,
        target_runtime: targetRuntime,
        patch_source_version: patchSourceVersion,
        target_version: targetVersion,
        axes: {
          runtime: runtimeResult,
          format: formatResult,
          version: versionResult,
          conversion: conversionResult,
        },
      },
      remediation: resultRemediation({
        compatible: false,
        className,
        converted,
        patchContent,
      }),
      ...(lowConfidence ? { low_confidence: true } : {}),
      ...(converted ? { converted } : {}),
    };
  }

  const convertedPatch = converted || patchContent;
  const needsConversion = convertedPatch !== patchContent;
  const className = needsConversion ? 'format-drift' : undefined;

  return {
    compatible: true,
    ...(className ? { class: className } : {}),
    confidence: resultConfidence({ compatible: true, className, lowConfidence }),
    evidence: {
      reason: needsConversion ? conversionResult.reason : 'all-axes-passed',
      relPath,
      source_runtime: patchSourceRuntime,
      target_runtime: targetRuntime,
      patch_source_version: patchSourceVersion,
      target_version: targetVersion,
      axes: {
        runtime: runtimeResult,
        format: formatResult,
        version: versionResult,
        conversion: conversionResult,
      },
    },
    remediation: resultRemediation({
      compatible: true,
      className,
      converted: convertedPatch,
      patchContent,
    }),
    ...(lowConfidence ? { low_confidence: true } : {}),
    ...(needsConversion ? { converted: convertedPatch } : {}),
  };
}

module.exports = {
  validatePatchForRuntime,
  runtimeAxis,
  formatAxis,
  versionAxis,
  conversionAxis,
  detectFormat,
};
