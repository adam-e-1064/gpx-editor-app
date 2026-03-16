---
applyTo: "**/.github/agents/*.agent.md"
---

## Security Requirements (Shared)

All agents MUST follow these security rules:

- **Input validation** — always validate and sanitize user input at system boundaries
- **No secrets in code** — use environment variables for API keys, tokens, passwords, and connection strings
- **Parameterized queries** — never concatenate user input into SQL/NoSQL queries; use parameterized queries or ORM methods
- **No internal error exposure** — never expose stack traces, internal paths, or implementation details in API responses
- **Password handling** — hash passwords with bcrypt (minimum 10 salt rounds); never store or log plaintext passwords
- **Token security** — use httpOnly, secure, sameSite cookies; set reasonable JWT expiration times; validate token signatures
- **Dependency pinning** — pin package versions and Docker base image tags; never use `latest`
- **Least privilege** — request minimum permissions for CI tokens, API keys, and service accounts
