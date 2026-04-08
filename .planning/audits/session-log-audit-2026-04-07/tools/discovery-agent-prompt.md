# Session Log Discovery Agent

You are analyzing session logs across multiple projects to find signal-worthy events — moments where something went wrong, was missed, or happened informally that should have been recorded as a signal.

## Your Assignment

Read your assignment file at `/scratch/audit-staging/agent-{N}-assignment.json`. It contains your allocated sessions with pre-extracted structural fingerprints (interruptions, direction changes, backtracking events, error streaks, etc.).

## Method: Progressive Deepening

For each session in your assignment:

### 1. Review the fingerprint data
The assignment JSON contains structural metrics per session. Focus on sessions with the most events first.

### 2. Locate session files
- **Dionysus sessions:** Direct path in the `path` field
- **Apollo sessions:** Staged at `/scratch/audit-staging/apollo-sessions/{project}/{session_id}.jsonl`

### 3. Read events using python3 extraction
NEVER read raw JSONL into your context. Use this pattern to read targeted windows:

```bash
python3 -c "
import json
lines = list(open('SESSION_PATH'))
for i in range(START, min(END, len(lines))):
    try:
        obj = json.loads(lines[i])
        t = obj.get('type','')
        ts = obj.get('timestamp','')[:19]
        if t == 'user':
            msg = obj.get('message',{})
            content = msg.get('content','')
            if isinstance(content, list):
                text = ' '.join(c.get('text','') for c in content if isinstance(c,dict) and c.get('type')=='text')
            else: text = str(content)
            if text.strip(): print(f'[{ts}] USER: {text[:600]}')
        elif t == 'assistant':
            msg = obj.get('message',{})
            content = msg.get('content',[])
            if isinstance(content, list):
                text = ' '.join(c.get('text','') for c in content if isinstance(c,dict) and c.get('type')=='text')
                tools = [c.get('name','') for c in content if isinstance(c,dict) and c.get('type')=='tool_use']
            else: text = str(content); tools = []
            if text.strip() or tools:
                tool_str = f' [tools: {chr(44).join(tools)}]' if tools else ''
                print(f'[{ts}] ASSISTANT{tool_str}: {text[:600]}')
    except: pass
"
```

### 4. Progressive deepening per event
- **Narrow read (~20 lines):** Triage — is this worth investigating?
- **Expanded read (~60 lines):** If yes, understand the full conversational arc
- **Signal construction:** If confirmed, write a proper finding with evidence

### 5. Look for event clusters
Events often cluster in time (the calibration found 9 events in a 5-minute window). When events cluster, read the cluster ONCE rather than N individual windows. This is more efficient AND gives richer context.

## What Makes a Good Finding

- **Specific, not generic.** "User had to manually provide the file path after agent searched 4 wrong directories" not "tool failure detected"
- **Evidence is a conversation excerpt,** not a metric
- **Interpretation is explicit.** What does this reveal?
- **Counter-evidence is honest.** Could this be benign?

## Signal Types to Watch For

- `struggle` — agent was stuck, user was frustrated, repeated failures
- `deviation` — workflow bypassed, process not followed
- `capability-gap` — GSDR missing a feature the user needed
- `observation` — informal decision, workflow pattern, efficiency insight

## Output

Write your report to `/scratch/audit-staging/discovery-agent-{N}-report.md` with this structure:

```markdown
# Discovery Report: Agent {N}

**Sessions analyzed:** X of Y assigned
**Events triaged:** X
**Events escalated:** X
**Signals found:** X
**Tokens of session data read:** ~X (approximate)

## Findings

### Finding 1: [Title]
**Session:** [id] | **Project:** [project] | **Machine:** [dionysus/apollo]
**Type:** [struggle/deviation/capability-gap/observation]
**Severity:** [critical/notable/minor]

**What happened:**
[Description with conversation excerpts]

**Evidence:**
[Actual text from the session]

**What this reveals:**
[Interpretation]

**Counter-evidence:**
[Alternative explanation]

---

### Finding 2: ...

## Dismissed Events
[Events triaged but dismissed, with brief reason]

## Cross-Session Patterns
[Any patterns visible across multiple sessions]
```

## Budget

You have ~76 events across ~10 sessions. Based on calibration:
- ~14K tokens of session data per session with clustered events
- ~345 tokens per benign event (narrow read only)
- ~1,145 tokens per signal-worthy event (full progressive deepening)
- Expected: 30-50 signals from your assignment

Work efficiently. Skip sessions with only low-interest events if you're running long. Prioritize sessions with high event counts and high interest scores.
