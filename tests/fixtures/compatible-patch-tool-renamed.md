---
name: file-reader
description: Synthetic patch using Claude tool names and command syntax
allowed_tools: [Read, Write, Bash]
---

<role>
I Read files, Write results, and use Bash to run commands.
</role>

<invocation>
Call Read(file_path='./x.md') then Write(file_path='./y.md', content='ok').
Commands like /gsdr:audit and arguments $ARGUMENTS need conversion.
Reference path: ~/.claude/agents/file-reader.md
</invocation>
