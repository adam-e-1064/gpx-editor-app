# Workspace Conventions

## Agent Orchestration

This workspace uses a 3-tier agent hierarchy for JavaScript/TypeScript web development.

### Tiers
- **Tier 1 — Orchestrator**: Plans, delegates, validates. Never writes code directly.
- **Tier 2 — Architects/Leads**: Design solutions, delegate implementation to Tier 3, review results, create documentation.
- **Tier 3 — Workers**: Execute a single focused task, return the result, and terminate.

### Behavioral Rules (All Tiers)
1. **Never implement unrequested features** — ask if something seems needed before doing it.
2. **Single responsibility** — each agent does ONE task per invocation.
3. **Validate before reporting** — Tier 2 must verify Tier 3 output before returning to Tier 1.
4. **Document decisions** — Tier 2 agents create ADRs for non-trivial architectural choices.
5. **Parallelize when possible** — Tier 2 agents launch independent Tier 3 tasks concurrently.
6. **Iterate until clean** — Orchestrator re-delegates if quality is insufficient.
7. **Context hygiene** — Tier 3 receives only task-relevant instructions, not full history.

### Skills-Based Architecture
- Agents define **roles and behaviors** (what they do, how they delegate, what tools they use)
- Skills provide **domain-specific knowledge** (which framework, which patterns, which APIs)
- When starting a new project, create project-specific skills in `.github/skills/` to teach agents the project's stack
- Agents should read project skills before implementing to understand framework conventions

## Documentation Structure

All project documentation lives in `.context/`:

```
.context/
  adr/                    # Architecture Decision Records
    NNNN-title.md         # Numbered, kebab-case title
  progress/               # Task progress logs
    YYYY-MM-DD-task.md    # Date-prefixed by task
  handoff/                # Session context for continuity
    latest.md             # Always-current summary of project state
    YYYY-MM-DD.md         # Archived past sessions
```

### ADR Template
```markdown
# NNNN — Title

**Status**: Proposed | Accepted | Deprecated
**Date**: YYYY-MM-DD
**Context**: Why this decision was needed.
**Decision**: What was decided.
**Consequences**: What follows from this decision.
```

### Handoff Template
```markdown
# Session Handoff — YYYY-MM-DD

## What Was Done
- Summary of completed work

## Current State
- What's working, what's pending

## Open Questions
- Unresolved items

## Next Steps
- What should be tackled next
```

## Coding Standards

- Follow existing project conventions over introducing new patterns
- Use TypeScript when the project supports it
- Prefer composition over inheritance
- Keep components/modules small and focused
- Use meaningful names over comments

## Git Workflow

- **Branch naming**: `feat/`, `fix/`, `chore/`, `docs/`, `test/` prefixes
- **Commits**: Conventional Commits format — `type(scope): description`
- **PRs**: title follows conventional commit format, link related issues with `Closes #N`
- See `.github/instructions/git-workflow.instructions.md` for full conventions

## Testing Conventions

- Follow the testing pyramid: many unit > some integration > few E2E
- Use the project's chosen test framework (Jest, Vitest, Mocha, native test runner)
- Test files live next to source (`*.spec.ts`, `*.test.ts`) or in `test/` for E2E
- Use `data-testid` attributes for E2E selectors

## MCP Servers

This workspace has 5 MCP servers configured in `.vscode/mcp.json`:

| Server | Purpose |
|---|---|
| `github` | Issues, PRs, repo management, workflow status |
| `mongodb` | Query/inspect MongoDB collections |
| `postgres` | Query/inspect PostgreSQL databases |
| `playwright` | Browser automation, screenshots, E2E support |
| `docker` | Manage containers, images, compose services |

Secrets are prompted at runtime via VS Code input variables — never hardcoded.
