---
phase: quick-23
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - bin/install.js
  - tests/unit/install.test.js
autonomous: true
must_haves:
  truths:
    - "extractFrontmatterAndBody() and extractFrontmatterField() exist and are exported"
    - "All 6 ad-hoc frontmatter parsing sites use the shared helpers"
    - "All existing converter and injectVersionScope tests still pass unchanged"
    - "New unit tests cover both helper functions"
  artifacts:
    - path: "bin/install.js"
      provides: "extractFrontmatterAndBody and extractFrontmatterField functions"
      exports: ["extractFrontmatterAndBody", "extractFrontmatterField"]
    - path: "tests/unit/install.test.js"
      provides: "Unit tests for both helper functions"
  key_links:
    - from: "convertClaudeToGeminiAgent"
      to: "extractFrontmatterAndBody"
      via: "function call for frontmatter/body split"
    - from: "convertClaudeToGeminiToml"
      to: "extractFrontmatterField"
      via: "function call for description extraction"
    - from: "module.exports"
      to: "extractFrontmatterAndBody, extractFrontmatterField"
      via: "export declaration"
---

<objective>
Add two shared frontmatter helper functions matching upstream's signatures, refactor all 6 ad-hoc
frontmatter parsing sites to use them, and add unit tests for the helpers.

Purpose: Eliminate duplicated frontmatter parsing logic across 6 converter functions, aligning with
upstream's helper pattern and reducing maintenance surface.

Output: Updated bin/install.js with helpers + refactored call sites, updated tests/unit/install.test.js
with helper tests.
</objective>

<execution_context>
@./.claude/get-shit-done-reflect/workflows/execute-plan.md
@./.claude/get-shit-done-reflect/templates/summary-standard.md
</execution_context>

<context>
@bin/install.js
@tests/unit/install.test.js
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add helper functions, refactor all 6 call sites, export</name>
  <files>bin/install.js</files>
  <action>
Add two functions immediately before `convertClaudeToGeminiAgent()` (before the JSDoc comment at ~line 645):

```javascript
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
```

Then refactor each of the 6 call sites:

**Site 1 - convertClaudeToGeminiAgent() (~line 652):**
Replace the 7-line preamble (startsWith check, indexOf, substring x2) with:
```javascript
const { frontmatter, body } = extractFrontmatterAndBody(content);
if (!frontmatter) return content;
```
Keep the `frontmatter.split('\n')` loop and everything after -- only the extraction changes.
The variable `body` replaces `content.substring(endIndex + 3)`.

**Site 2 - convertClaudeToOpencodeFrontmatter() (~line 738-750):**
Replace the 9-line block (startsWith check through substring) with:
```javascript
const { frontmatter: fm, body } = extractFrontmatterAndBody(convertedContent);
if (!fm) return convertedContent;
```
Use `fm` (not `frontmatter`) to avoid shadowing or rename the existing variable.
Keep the `fm.split('\n')` loop. The early return changes from `return convertedContent` to the
same -- just cleaner entry.

**Site 3 - convertClaudeToGeminiToml() (~line 837-859):**
Replace the entire extraction block (startsWith check, indexOf, substring, description loop) with:
```javascript
const { frontmatter, body: rawBody } = extractFrontmatterAndBody(content);
if (!frontmatter) {
  return `prompt = ${JSON.stringify(content)}\n`;
}
const body = rawBody.trim();
const description = extractFrontmatterField(frontmatter, 'description') || '';
```
Delete the `const lines = frontmatter.split('\n')` loop entirely -- `extractFrontmatterField`
replaces it completely.

**Site 4 - convertClaudeToCodexAgentToml() (~line 879-901):**
Replace the entire frontmatter parsing block with:
```javascript
const { frontmatter, body: rawBody } = extractFrontmatterAndBody(content);
if (frontmatter) {
  body = rawBody.trim();
  description = extractFrontmatterField(frontmatter, 'description') || '';
  name = extractFrontmatterField(frontmatter, 'name') || '';
}
```
Keep the `let description = ''`, `let name = ''`, `let body = content` declarations above.
Delete the `if (content.startsWith('---'))` block and its nested loop entirely.

**Site 5 - convertClaudeToCodexSkill() (~line 951-958):**
Replace the 7-line preamble (startsWith check, indexOf, substring x2) with:
```javascript
const { frontmatter, body } = extractFrontmatterAndBody(converted);
if (!frontmatter) {
  return `---\nname: ${commandName}\ndescription: GSD command: ${commandName}\n---\n\n${converted}`;
}
```
Note: operates on `converted` (not `content`) since tool name replacements happen first.
Keep the `frontmatter.split('\n')` loop for field filtering.

**Site 6 - injectVersionScope() (~line 1247-1258):**
IMPORTANT: This function needs the raw delimiters for its regex replace. Use extractFrontmatterAndBody
for the null check, but reconstruct the delimited frontmatter for the regex:
```javascript
function injectVersionScope(content, version, _scope) {
  const { frontmatter, body } = extractFrontmatterAndBody(content);
  if (!frontmatter) return content;
  const delimited = `---\n${frontmatter}\n---`;
  const modified = delimited.replace(
    /^(description:\s*)(.+?)(\s*\(v[\d.]+(?:\+\w+)?(?:\s+(?:local|global))?\))?$/m,
    `$1$2 (v${version})`
  );
  return modified + body;
}
```

**Exports (line ~2834):**
Add `extractFrontmatterAndBody` and `extractFrontmatterField` to the `module.exports` object.
  </action>
  <verify>
Run the full test suite: `npm test`. All 145+ existing tests must pass -- zero regressions.
Grep to confirm no remaining ad-hoc patterns: `grep -n "content.indexOf('---', 3)\|convertedContent.indexOf('---', 3)\|converted.indexOf('---', 3)" bin/install.js` should return zero matches (all sites refactored).
  </verify>
  <done>
Both helper functions exist before convertClaudeToGeminiAgent(). All 6 call sites use
extractFrontmatterAndBody(). Sites 3 and 4 additionally use extractFrontmatterField().
Both functions appear in module.exports. All existing tests pass.
  </done>
</task>

<task type="auto">
  <name>Task 2: Add unit tests for both helper functions</name>
  <files>tests/unit/install.test.js</files>
  <action>
Add `extractFrontmatterAndBody` and `extractFrontmatterField` to the destructured require at line 13.

Add a new describe block immediately before the `injectVersionScope unit tests` block (before ~line 515):

```javascript
describe('extractFrontmatterAndBody unit tests', () => {
  it('extracts frontmatter and body from valid content', () => {
    const input = '---\nname: test\ndescription: A test\n---\nBody here'
    const result = extractFrontmatterAndBody(input)
    expect(result.frontmatter).toBe('name: test\ndescription: A test')
    expect(result.body).toBe('\nBody here')
  })

  it('returns null frontmatter when content has no frontmatter', () => {
    const input = 'Just plain content'
    const result = extractFrontmatterAndBody(input)
    expect(result.frontmatter).toBeNull()
    expect(result.body).toBe('Just plain content')
  })

  it('returns null frontmatter when end delimiter is missing', () => {
    const input = '---\nname: test\nno end delimiter'
    const result = extractFrontmatterAndBody(input)
    expect(result.frontmatter).toBeNull()
    expect(result.body).toBe('---\nname: test\nno end delimiter')
  })

  it('handles empty frontmatter', () => {
    const input = '---\n---\nBody only'
    const result = extractFrontmatterAndBody(input)
    expect(result.frontmatter).toBe('')
    expect(result.body).toBe('\nBody only')
  })

  it('handles content with only frontmatter and no body', () => {
    const input = '---\nname: test\n---'
    const result = extractFrontmatterAndBody(input)
    expect(result.frontmatter).toBe('name: test')
    expect(result.body).toBe('')
  })
})

describe('extractFrontmatterField unit tests', () => {
  const fm = 'name: my-command\ndescription: Does something\ncolor: blue'

  it('extracts an existing field', () => {
    expect(extractFrontmatterField(fm, 'description')).toBe('Does something')
  })

  it('returns null for a missing field', () => {
    expect(extractFrontmatterField(fm, 'missing')).toBeNull()
  })

  it('strips surrounding quotes from field value', () => {
    const quoted = "description: 'A quoted value'"
    expect(extractFrontmatterField(quoted, 'description')).toBe('A quoted value')
  })

  it('strips double quotes from field value', () => {
    const quoted = 'description: "A double-quoted value"'
    expect(extractFrontmatterField(quoted, 'description')).toBe('A double-quoted value')
  })

  it('trims leading and trailing whitespace from value', () => {
    const spaced = 'description:   lots of space   '
    expect(extractFrontmatterField(spaced, 'description')).toBe('lots of space')
  })

  it('extracts first field when multiple lines match prefix', () => {
    const multi = 'name: first\nnamespace: second'
    // 'name' regex is anchored to `^name:\s*` so it matches 'name:' not 'namespace:'
    expect(extractFrontmatterField(multi, 'name')).toBe('first')
  })
})
```

These tests exercise: valid content, no frontmatter, missing end delimiter, empty frontmatter,
no body, existing field, missing field, single-quoted, double-quoted, whitespace trimming,
and field name boundary (name vs namespace).
  </action>
  <verify>
Run: `npm test`. All tests pass including the new ones. Verify new test count is 145 + 11 = 156+
(exact count may vary if upstream added tests).
  </verify>
  <done>
11 new test cases cover extractFrontmatterAndBody (5 cases) and extractFrontmatterField (6 cases).
Both functions are imported in the test file. All tests pass.
  </done>
</task>

</tasks>

<verification>
1. `npm test` -- all tests pass (zero regressions + new helper tests)
2. `grep -c "content.indexOf('---', 3)" bin/install.js` returns 0 (no remaining ad-hoc patterns)
3. `grep -c "extractFrontmatterAndBody" bin/install.js` returns 8+ (2 definition + 6 call sites)
4. `grep "extractFrontmatterAndBody\|extractFrontmatterField" bin/install.js | tail -1` shows both in module.exports
</verification>

<success_criteria>
- Both helper functions match upstream's signatures exactly
- All 6 ad-hoc parsing sites refactored to use helpers
- extractFrontmatterField used at sites 3 (GeminiToml) and 4 (CodexAgentToml) where only description/name needed
- extractFrontmatterAndBody used at all 6 sites for the frontmatter/body split
- All existing tests pass unchanged (behavioral equivalence)
- 11 new unit tests cover both helper functions
- Both functions exported in module.exports
</success_criteria>

<output>
After completion, create `.planning/quick/23-shared-frontmatter-helpers-extractfrontm/23-SUMMARY.md`
</output>
