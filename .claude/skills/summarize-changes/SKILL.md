---
name: summarize-changes
description: Summarize current git changes for a commit message or PR description
context: fork
agent: Explore
allowed-tools: Bash(git *)
---

Run `git diff HEAD` and `git status`.

Summarize the changes in:
1. One-line title (imperative mood, 72 chars max)
2. 3-5 bullet points of what changed and why

If diff is empty, say so.
