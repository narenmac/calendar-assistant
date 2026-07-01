---
name: code-review
description: Run a full code review on recent changes using the code-reviewer agent
argument-hint: "[file or area to focus on, optional]"
disable-model-invocation: false
context: fork
agent: code-reviewer
---

Run a code review on the current changes.

$ARGUMENTS

Use `git diff HEAD` to find what changed, then review for security, correctness, and style issues per your instructions.

Return a prioritized list of findings grouped by severity.
