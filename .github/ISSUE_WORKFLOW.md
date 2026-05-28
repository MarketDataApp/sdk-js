# Issue Workflow

This document defines the process for triaging and resolving bug reports against the Market Data JavaScript SDK. It is designed to be followed by maintainers (human or automated).

## Overview

```
Verify Permissions → New Issue → Validate → [Valid] → Accept → Fix → Close
                                          → [Needs Info] → Request Info → Wait 7 days → Close
                                          → [Not a Bug] → Explain → Close
```

---

## Step 0: Verify Permissions

Before processing issues, verify you have maintainer/contributor access.

```bash
gh api repos/MarketDataApp/sdk-js/collaborators/$( gh api user --jq '.login' )/permission --jq '.permission'
```

**Expected output for issue management:** `admin`, `maintain`, `write`, or `triage`.

| Result | Meaning | Action |
|--------|---------|--------|
| `admin`, `maintain`, `write`, or `triage` | Sufficient permissions | Proceed to Step 1 |
| `read` | Read-only access | Stop — request elevated permissions |
| `404 Not Found` | Not a collaborator | Stop |
| `401 Unauthorized` | Not authenticated | Run `gh auth login` first |

Quick verification:

```bash
gh api repos/MarketDataApp/sdk-js/collaborators/$(gh api user --jq '.login')/permission --jq '.permission' | grep -qE '^(admin|maintain|write|triage)$'
```

---

## Step 1: Validate the Bug Report

Run through this checklist for every new bug report. All "Required" items must pass.

### Required Criteria

| # | Criterion | How to Check | Pass | Fail |
|---|-----------|--------------|------|------|
| 1 | **API docs verified** | "API Documentation Verification" checkboxes | Both checked | One or both unchecked |
| 2 | **Has reproduction code** | "Reproduction Code" field | Contains runnable TS/JS | Empty / pseudocode |
| 3 | **Code is complete** | Imports and client init present | Has `import { MarketDataClient }` (or `require`) AND creates a client | Missing setup |
| 4 | **Specifies SDK version** | "SDK Version" field | Concrete version (e.g., `1.0.0`) | Empty or "latest" |
| 5 | **Specifies Node version** | "Node Version" field | Concrete version (e.g., `20.11.0`) | Empty or vague |
| 6 | **Describes expected behavior** | "Expected Behavior" field | Clear | Empty / unclear |
| 7 | **Describes actual behavior** | "Actual Behavior" field | Clear, with error message | Empty / unclear |

### Validation Decision

- **All 7 pass** → Step 2 (Reproduce)
- **Any fail** → Step 4 (Request More Information)

---

## Step 2: Reproduce the Bug

1. Create a new TS/JS file with the reproduction code.
2. Pin the reported SDK version: `pnpm add marketdata-sdk@X.Y.Z`
3. Use the reported Node version (`nvm use 20.x` etc.).
4. Run the code.
5. Compare output to reported "Actual Behavior".

### Reproduction Decision

| Outcome | Next Step |
|---------|-----------|
| **Reproduces** | → Step 3A (Accept) |
| **Does not reproduce** | → Step 3B (Cannot Reproduce) |
| **Different error** | → Step 4 (Request Info) |
| **API error, not SDK** | → Step 3C (Not an SDK Bug) |
| **Expected API behavior** | → Step 3C (Not an SDK Bug) |
| **User error in code** | → Step 3C (Not an SDK Bug) |

---

## Step 3A: Accept as Bug

1. **Add label**: `accepted`
2. **Comment** (template below)
3. **Proceed to Step 5 (Fix)**

### Comment Template: Accepted

```markdown
Thanks for the detailed report. I've reproduced this issue.

**Reproduction confirmed:**
- SDK version: [version]
- Node version: [version]
- Behavior: [brief description of what you observed]

Working on a fix.
```

---

## Step 3B: Cannot Reproduce

1. **Add label**: `needs-info`
2. **Comment** (template below)

### Comment Template: Cannot Reproduce

```markdown
I wasn't able to reproduce this issue with the information provided.

**My environment:**
- SDK version: [version]
- Node version: [version]
- OS: [os]

**What I observed:**
[Describe what happened — worked correctly, different output, etc.]

Could you provide:
- [ ] Any additional configuration (custom settings, environment variables)
- [ ] The complete error output including stack trace
- [ ] Confirmation of your exact SDK and Node versions (`pnpm list marketdata-sdk` and `node -v`)
- [ ] Package manager and lockfile in use (pnpm/npm/yarn)

I'll keep this open for 7 days for additional information.
```

---

## Step 3C: Not an SDK Bug

1. **Add label**: `wontfix`
2. **Comment** (template below)
3. **Close issue**

### Comment Template: API Issue (Not SDK)

```markdown
Thanks for the report. After investigation, this appears to be related to the Market Data API itself rather than the JavaScript SDK.

**What's happening:**
[Explain the API behavior]

**Suggested next steps:**
- Check the [API documentation](https://www.marketdata.app/docs/api) for this endpoint
- Contact Market Data support if you believe the API behavior is incorrect
- Join the [Discord](https://discord.com/invite/GmdeAVRtnT) for community help

Closing this as it's outside the SDK's scope. Feel free to open a new issue if you find an SDK-specific problem.
```

### Comment Template: Expected API Behavior

```markdown
Thanks for the report. After checking the [API documentation](https://www.marketdata.app/docs/api), this behavior is consistent with how the API is designed to work.

**What you're seeing:**
[Describe the behavior]

**API documentation reference:**
[Link or quote relevant docs]

The SDK returns data exactly as the API provides it. If you believe the API documentation is incorrect or the API should behave differently, please contact Market Data support or join the [Discord](https://discord.com/invite/GmdeAVRtnT).

Closing this as working-as-designed.
```

### Comment Template: User Error

~~~markdown
Thanks for the report. After reviewing the reproduction code, I found an issue with the implementation rather than a bug in the SDK.

**The issue:**
[Explain what's wrong]

**Suggested fix:**
```ts
// Show corrected code
```

**Documentation reference:**
[Link to relevant README/ADR if applicable]

Closing this issue, but you're welcome to reopen if you believe there's still an SDK bug.
~~~

### Comment Template: Works as Designed

```markdown
Thanks for the report. After investigation, the SDK is behaving as designed here.

**Expected behavior:**
[Explain why the current behavior is correct]

**Documentation reference:**
[Link to README/ADR]

If you'd like to suggest a change, please open a feature request via [GitHub Issues](https://github.com/MarketDataApp/sdk-js/issues/new).
```

---

## Step 4: Request More Information

1. **Add label**: `needs-info`
2. **Comment** specifying exactly what's needed
3. **Set reminder**: check back in 7 days

### Comment Template: Needs Information

```markdown
Thanks for the report. To investigate this issue, I need some additional information:

- [ ] **API documentation verification**: Please confirm you've checked the [API documentation](https://www.marketdata.app/docs/api) and that the behavior you're seeing differs from what's documented
- [ ] **Complete reproduction code**: A full, runnable TypeScript or JavaScript snippet including the import and client initialization
- [ ] **SDK version**: `pnpm list marketdata-sdk` (or `npm ls marketdata-sdk`)
- [ ] **Node version**: `node -v`
- [ ] **Package manager**: pnpm / npm / yarn (and the lockfile in use)
- [ ] **Expected behavior**: What did you expect to happen?
- [ ] **Actual behavior**: What actually happened? Include the complete error and stack trace
- [ ] **Additional context**: [Specify]

I'll keep this open for 7 days. If there's no response, I'll close it — but you're always welcome to reopen with the additional details.
```

### 7-Day Follow-up

If no response after 7 days, comment and close:

```markdown
Closing this issue due to inactivity. If you're able to provide the requested information, feel free to reopen or create a new issue.
```

---

## Step 5: Fix the Bug

### Fixing Checklist

1. [ ] **Create failing test**: write a Vitest case that reproduces the bug and verify it fails
2. [ ] **Implement fix**: minimal change
3. [ ] **Verify test passes**: re-run the new test
4. [ ] **Run full suite**: `pnpm lint && pnpm typecheck && pnpm test` — no regressions
5. [ ] **Update CHANGELOG.md**: add an entry under `## [Unreleased]`
6. [ ] **Commit**: `fix: Description (closes #NNN)`
7. [ ] **Open PR** against `main`

### Commit Message Format

```
fix: Brief description of what was fixed (closes #123)
```

Examples:
- `fix: handle null response in candles endpoint (closes #45)`
- `fix: correct date parsing for earnings with timezone (closes #67)`

---

## Step 6: Close the Issue

After the fix is merged:

1. **Verify auto-close**: GitHub auto-closes from `closes #NNN` in the commit/PR.
2. **If not auto-closed**: manually close with the comment below.

### Comment Template: Fixed

~~~markdown
Fixed in [commit hash or PR link].

This will be available in the next release. If you need the fix immediately:
```bash
pnpm add github:MarketDataApp/sdk-js#main
```
~~~

---

## Labels Reference

| Label | Meaning | When to Apply |
|-------|---------|---------------|
| `bug` | Default label from template | Applied automatically on new issues |
| `accepted` | Bug validated and reproduced | After successful reproduction |
| `needs-info` | Waiting for reporter input | Report incomplete or cannot reproduce |
| `wontfix` | Not a bug / won't be fixed | When closing as not-a-bug |
| `dependencies` | Dependency-related (set by Dependabot) | Automatic |

---

## CLI Commands Reference

```bash
# Add a label
gh issue edit NUMBER --add-label "accepted"
gh issue edit NUMBER --add-label "needs-info"

# Remove a label
gh issue edit NUMBER --remove-label "bug"

# Close / reopen
gh issue close NUMBER
gh issue reopen NUMBER

# Comment
gh issue comment NUMBER --body "Comment text"

# View / list
gh issue view NUMBER
gh issue list --label "bug"
gh issue list --label "needs-info"
```

---

## Examples

### Example A: Valid Bug Report

**Issue #42:**
- Endpoint: `stocks`
- Method: `candles`
- Reproduction code: complete TS script with import + client
- Expected: returns candle data
- Actual: `TypeError: Cannot read properties of undefined`
- SDK Version: 1.0.0
- Node Version: 20.11.0

**Action**: Passes all criteria → reproduce → if confirmed, accept and fix.

### Example B: Incomplete Report

**Issue #43:**
- Endpoint: `options`
- Method: `chain`
- Reproduction code: "I called the chain method and it broke"
- Expected: "It should work"
- Actual: "It doesn't work"
- SDK Version: (empty)
- Node Version: 20.x

**Action**: Fails criteria 2, 3, 4, 5, 6, 7 → request info.

### Example C: Not a Bug (API Behavior)

**Issue #44:**
- Endpoint: `stocks`
- Method: `quote`
- Expected: after-hours price
- Actual: regular-session price

**After investigation**: the API returns regular-session prices by default.

**Action**: close as "Not an SDK Bug" with pointer to API docs.

### Example D: Expected API Behavior

**Issue #45:**
- Endpoint: `stocks`
- Method: `earnings`
- Expected: percentages as `5.2` for 5.2%
- Actual: `0.052`

**After investigation**: the API documents percentages as decimals; SDK passes through unchanged.

**Action**: close as "Expected API Behavior" with link to API docs.
