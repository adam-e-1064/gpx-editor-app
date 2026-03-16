---
applyTo: "**"
---

## Git Workflow Conventions (Shared)

### Branch Naming
- `feat/<short-description>` — new features
- `fix/<short-description>` — bug fixes
- `chore/<short-description>` — maintenance, refactoring, tooling
- `docs/<short-description>` — documentation-only changes
- `test/<short-description>` — test additions or fixes

### Commit Messages (Conventional Commits)
Format: `type(scope): description`

Types: `feat`, `fix`, `chore`, `docs`, `test`, `refactor`, `style`, `perf`, `ci`

Examples:
- `feat(auth): add JWT refresh token rotation`
- `fix(api): handle null user in profile endpoint`
- `chore(deps): update mongoose to v8.2`

Rules:
- Use lowercase, imperative mood ("add" not "added")
- Keep the subject line under 72 characters
- Reference issue numbers when applicable: `feat(auth): add login endpoint (#42)`

### Pull Requests
- Title follows the same conventional commit format
- Description includes: what changed, why, and how to test
- Link related issues with `Closes #N` or `Relates to #N`

### Atomic Commits (Agent Workflow)
All code-producing agents MUST commit their work regularly using atomic commits.

**What is an atomic commit?**
A self-contained, meaningful unit of work that makes sense on its own — NOT necessarily a single line change. Examples: a completed component, a new API route, a test file, a style file, a database model.

Rules:
- Commit after completing each self-contained unit of work
- Max 70 characters for the commit subject line
- Stage only the files related to the completed unit: `git add <specific-files>`
- Do NOT bundle unrelated changes into a single commit
- Do NOT commit partial or broken work — each commit should be functional
- Follow Conventional Commits format (see above)

Examples:
- `feat(ui): add site header component`
- `feat(auth): add login POST endpoint`
- `test(geo): add geo-utils unit tests`
- `style(card): add responsive card layout`
- `docs(adr): add caching strategy decision`

Command pattern:
```sh
git add <specific-files>
git commit -m "type(scope): description"
```
