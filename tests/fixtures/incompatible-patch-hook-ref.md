---
name: example-hook-user
description: Synthetic patch that references a Claude hook surface
allowed_tools: [Bash, Read]
---

<role>
I rely on settings.hooks.PreToolUse and a hook file to intercept tool calls.
</role>

<invocation>
Reference hook path: ~/.claude/hooks/pre-tool-use.json
Backup artifact: hooks/pre-tool-use.json
</invocation>
