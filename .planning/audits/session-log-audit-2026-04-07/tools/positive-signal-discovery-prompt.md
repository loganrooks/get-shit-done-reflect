# Positive Signal Discovery — Session Log Audit

You are a discovery agent looking for POSITIVE signals in session logs — moments where things worked well, workflows that produced good outcomes, emergent practices worth formalizing, and deviations from standard process that turned out to be improvements.

The primary audit focused entirely on negative signals (failures, frustrations, gaps). This pass corrects that bias by looking for what went RIGHT.

## Your Assignment

Read your assignment at `/scratch/audit-staging/agent-{N}-assignment.json`. It contains your allocated sessions with pre-extracted structural fingerprints.

## What You're Looking For

### Workflows that worked well
- Moments where a GSDR workflow (discuss, plan, execute, verify, collect-signals, deliberate) produced notably good output
- Smooth multi-phase execution with no interruptions or corrections
- Effective delegation patterns (agent spawning, background tasks)

### Productive deviations
- Places where the user or agent deviated from the standard GSDR workflow and the deviation produced better results than the standard process would have
- Ad-hoc practices that emerged organically and should be considered for formalization
- Workarounds that were more effective than the formal process they replaced

### Cross-model review success
- Sessions where one model reviewed another model's work and caught real issues
- The quality of the review output — what made it effective?
- How the reviewed agent responded — did it pushback, accept uncritically, or engage substantively?
- Structured back-and-forth that produced better outcomes than single-model work

### Effective user-agent collaboration patterns
- Moments where the user's input and the agent's capabilities combined to produce something neither could alone
- Good handoff patterns between sessions
- Effective use of context (CONTEXT.md, KB, deliberations) that demonstrably improved outcomes

### Signal system working as designed
- Cases where a previously logged signal actually prevented a repeat mistake
- KB surfacing that informed a decision
- Reflection output that was consumed and changed behavior

### Token/efficiency wins
- Sessions that accomplished a lot with relatively low token usage
- Effective use of delegation to keep main context clean
- Smart caching or context management patterns

## Method

Use the same progressive deepening approach as the negative signal agents, but with different structural markers:

**Interesting for positive signals:**
- Sessions with LOW interruption/direction-change counts but HIGH tool call counts (productive work)
- Sessions with high token efficiency (lots accomplished per token)
- Sessions where the user said something positive, affirming, or expressed satisfaction
- Sessions with effective agent spawning patterns
- Long sessions with few gaps (sustained productive flow)

**Structural scan keywords (Tier 2 equivalent):**
```bash
# Satisfaction/affirmation language
grep -c -i -E '\b(perfect|exactly|nice|great|good (job|work|call)|well done|that.s (right|correct|it|what I wanted)|yes exactly|love (it|this|that)|impressive|excellent|nailed it)\b' "$SESSION_FILE" || echo 0

# Effective workflow invocations
grep -c -i -E '(/gsdr:(deliberate|collect-signals|reflect|verify-work|plan-phase|discuss-phase)|/gsdr:signal)' "$SESSION_FILE" || echo 0

# Cross-model review
grep -c -i -E '(codex (exec|review)|cross.model|independent review|second opinion|GPT.*(review|audit)|review.*(GPT|codex))' "$SESSION_FILE" || echo 0

# Delegation patterns
grep -c '"name": "Agent"' "$SESSION_FILE" || echo 0
```

For sessions that look productive, read conversation windows to understand WHAT worked and WHY.

## Output

Write your report to the designated output path:

```markdown
# Positive Signal Discovery: Agent {N}

**Sessions analyzed:** X
**Positive patterns found:** X

## Findings

### Finding 1: [Title]
**Session:** [id] | **Project:** [project] | **Machine:** [machine]
**Type:** [workflow-success / productive-deviation / cross-model-review / collaboration-pattern / signal-system-working / efficiency-win]

**What worked:**
[Description with conversation evidence]

**Why it worked:**
[Analysis of what made this effective]

**Formalization potential:**
[Could this be built into a GSDR workflow? How?]

---

## Cross-Session Patterns
[Positive patterns visible across multiple sessions]

## Recommendations for Formalization
[Which positive patterns are most worth building into the workflow]
```
