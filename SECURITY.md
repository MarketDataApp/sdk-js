# Security Policy

## Reporting a Vulnerability

**This is a public repository. Do not open a public GitHub issue for a security
vulnerability** — that discloses it to everyone before a fix is available.

Instead, report privately through GitHub's **Private Vulnerability Reporting**:

1. Go to the **Security** tab of this repository.
2. Click **Report a vulnerability**.
3. Describe the problem, including steps to reproduce, affected version(s), and
   the impact.

We will acknowledge the report, keep you informed as we investigate, and
coordinate the disclosure timeline and a fixed release with you. Please give us
a reasonable window to ship a fix before any public disclosure.

## Scope

This repo is the **MarketData JavaScript/TypeScript SDK** (`@marketdata/sdk`) —
a client library published to npm and pulled into consumers' applications. It
runs on the consumer's machine (or their servers), not on MarketData
infrastructure. The security concerns that matter here are therefore about how
the library treats *its consumers*:

- **Credential handling** — the caller's API token must never be logged
  verbatim, leaked in error messages, or written to disk. The token is sent
  only in the `Authorization` header, never in URLs or query strings, and must
  never appear in log output or thrown errors. Regressions here are in scope.
- **Transport security** — TLS is validated by default and the SDK exposes no
  option to disable certificate verification. Anything that weakens this is in
  scope.
- **Injection into outbound requests** — request-building that lets caller
  input smuggle headers, path segments, or query parameters it shouldn't.
- **Parsing safety** — the Zod-based response decoding path handling hostile
  or malformed API responses without prototype pollution, resource exhaustion,
  or crashes that a consumer can't defend against.
- **Supply-chain integrity of the published package** — the build and npm
  publish pipeline (`test.yml`, `publish.yml`, Trusted Publishing OIDC with
  provenance), and the dependency tree of the shipped package.

Out of scope:

- **The MarketData API backend** itself. Report API/server vulnerabilities
  through the API's own channel, not here.
- **Third-party dependencies.** Vulnerabilities in npm-resolved dependencies
  are tracked by Dependabot (see `.github/dependabot.yml`); report them
  upstream. We will bump the affected dependency here once a fixed version
  exists.

## Security Fix Policy

This policy governs how security fixes are applied to this repository, including
fixes made by automated agents (e.g. Claude Code) working in the repo. It sorts
every security fix into one of two tiers.

The dividing line for a **library** is *consumer compatibility*. A fix that any
consumer can pick up by upgrading, with no source or behavior change on their
side, is low-risk. A fix that forces consumers to change their code, adapt to a
changed API surface or type definitions, or adapt to changed runtime behavior
is a breaking change and follows SemVer — those get the maintainer gate.

### Tier 1 — Fix immediately (no approval needed)

Security fixes that are **API- and behavior-compatible for legitimate
consumers**. Existing callers keep type-checking and keep working the same way
after upgrading; only the vulnerability is closed.

These may be fixed, tested, and committed right away. Every Tier 1 fix must be
called out in its commit message, in `CHANGELOG.md`, and in the summary reported
to the maintainer, so nothing ships silently.

Typical Tier 1 fixes:

- Tightening credential redaction, or plugging a token/secret/PII leak into
  logs or error messages
- Fixing injection in request building (header/path/query smuggling) where
  valid caller input is unaffected
- Hardening the response-parsing path against malformed or hostile API
  responses (bounds, resource limits, null handling, prototype-pollution
  defenses)
- Correcting a logic flaw in an existing security check without changing its
  public contract
- Patching a vulnerable dependency by bumping to a compatible version — no
  public API or behavior change for consumers
- Hardening internal, non-exported code paths (internal modules: transport,
  retry, rate-limit handling, API-status cache) that consumers cannot observe
  or depend on
- Fixing the build/publish pipeline (CI workflows, npm provenance/Trusted
  Publishing configuration)

### Tier 2 — Requires maintainer approval first

Any security fix that **breaks consumer compatibility or changes observable
runtime behavior**. These must NOT be applied unilaterally. The agent or
contributor stops, writes up the issue, the proposed fix, and the specific
consumer impact, and waits for the maintainer's approval before proceeding.

A fix is **Tier 2** if it does any of the following:

- Removes, renames, or changes the signature or exported types of any
  **public** class, function, or parameter (a source-incompatible change —
  SemVer major)
- Tightens input validation so that requests the SDK previously accepted are
  now rejected (could break existing callers)
- Changes a user-visible default (request timeouts, retry counts or backoff,
  rate-limit behavior, base URL, API version, startup validation)
- Changes an API/response contract — the shape of response objects, the error
  classes thrown, or the `MarketDataClientError` hierarchy — that consumers
  type against or `instanceof`-check
- Raises the minimum Node.js version (`engines`), changes the published package
  name, entry points, or `exports` map, or otherwise forces a consumer to
  change their build to keep using the SDK
- Adds a new required runtime dependency to the published package, or moves
  code between bundled and external dependencies

### Classification rules

- **When in doubt, it's Tier 2.** If it is unclear which tier a fix falls into,
  treat it as Tier 2 and ask for approval.
- **No urgency exception.** Even for a critical, actively-exploitable
  vulnerability, a compatibility-breaking (Tier 2) fix waits for maintainer
  approval. Flag the urgency loudly, propose the fix, and wait. The maintainer
  is always the gate for changes that break consumers. (If a break is genuinely
  unavoidable to close a critical hole, that's a maintainer decision about
  cutting a major version — not an agent's.)

### Release of security fixes

Tiering governs *what* may be changed; the repo's normal release rules govern
*what ships to consumers* (see `.github/RELEASE_PROCESS.md`). A Tier 1 fix may
be committed to a branch and merged via the usual PR flow. **Publishing a
release to npm** — cutting the GitHub release that triggers the publish
pipeline (`publish.yml`) — requires explicit maintainer confirmation, exactly
like every other release. Automated agents never cut or publish a release on
their own.
