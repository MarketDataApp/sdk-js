# JavaScript SDK Release Process

This document defines the release process for `MarketDataApp/sdk-js`, including the pre-release gate we run before cutting a tag and publishing to npm.

## 1. Scope

Use this process for:
- patch releases (`vX.Y.Z`)
- minor releases (`vX.Y.0`)
- major releases (`vX.0.0`)

## 2. Release Inputs

Before starting, confirm:
- target release version `X.Y.Z`
- release tag format: `vX.Y.Z`
- release title format: `Version X.Y.Z`
- release owner
- included PRs/issues
- intended release date/time

## 3. Pre-Release Workflow

Required gate checks (record results in PR description or release notes):

1. **API contract gate**
   - Confirm intended public API/signature changes and migration impact.
   - Review every `src/index.ts` re-export and every resource module's exported types.
   - For breaking changes: write a migration block in `CHANGELOG.md`.

2. **Quality / test gate**
   - `pnpm install --frozen-lockfile`
   - `pnpm lint`
   - `pnpm typecheck`
   - `pnpm test` (full Vitest suite must pass)
   - `pnpm test:coverage` — verify no regressions in coverage
   - Optional: run examples (`cd examples && pnpm install && pnpm chart:lightweight` etc.) as smoke tests

3. **Compatibility gate**
   - Confirm GitHub Actions `CI` workflow is green on `main` (`.github/workflows/test.yml`)
   - Node matrix (20.x, 22.x) all green
   - Build artifacts present and importable:
     ```bash
     pnpm build
     node -e "console.log(Object.keys(require('./dist/index.cjs')))"
     node --input-type=module -e "import * as m from './dist/index.js'; console.log(Object.keys(m))"
     ```

4. **Security gate**
   - `pnpm audit --prod` — review any high/critical findings
   - Confirm token handling stays header-based (`Authorization: Bearer`); no token in query string or logs
   - Verify no secrets in `dist/` or `examples/` output

5. **Docs / DX gate**
   - `README.md` version header matches the target (`# Market Data JavaScript SDK vX.Y`)
   - `package.json` `version` field matches
   - `CHANGELOG.md` `## [Unreleased]` entries have been promoted to `## [X.Y.Z] - Released YYYY-MM-DD`
   - ADRs updated if architecture changed

6. **Release / rollback gate**
   - No open issues labeled `release-blocker`
   - npm publish credentials available (NPM_TOKEN secret in repo settings, or local `npm login` for manual publish)
   - Rollback plan: `npm deprecate @marketdata/sdk@X.Y.Z "reason"` is documented and tested

7. **Final decision** — `GO` / `NO-GO`. No tag is cut unless `GO` and all P0 blockers are empty.

## 4. Release Preparation

1. Ensure `main` is current and CI is green.

2. **Update version numbers** in the following files:

   | File | Location | Example |
   |------|----------|---------|
   | `package.json` | `version` field | `"version": "1.1.0"` |
   | `README.md` | Title header | `# Market Data JavaScript SDK v1.1` |

3. **Update CHANGELOG.md**:
   - Move entries from `## [Unreleased]` into a new `## [X.Y.Z] - Released YYYY-MM-DD` section
   - Add a fresh empty `## [Unreleased]` block at the top
   - Verify breaking changes have migration guides
   - Ensure highlights and migration notes are complete

4. Commit on a release branch (e.g., `release/v1.1.0`), open PR, get review, merge to `main`.

5. Confirm the target tag does not already exist:
   ```bash
   git fetch --tags && git tag -l "v1.1.0"
   ```

> **Important**: release notes are extracted from `CHANGELOG.md`. The `## [X.Y.Z]` section must be present and complete before tagging.

## 5. Publish Release

### Option A: GitHub Actions workflow dispatch (preferred, once configured)

1. Go to Actions → "Prepare and Publish Release"
2. Click "Run workflow" and fill in:
   - **version**: `X.Y.Z` (without `v` prefix)
   - **ref**: `main` (or specific commit SHA)
   - **prerelease**: `false` (unless prerelease)
   - **confirm**: `RELEASE` (exactly)
3. The workflow will:
   - Re-run lint, typecheck, full test matrix (Node 20.x, 22.x)
   - `pnpm build`
   - `pnpm publish --access public --no-git-checks`
   - Extract release notes from `CHANGELOG.md`
   - Create the tag `vX.Y.Z`
   - Create the GitHub Release titled "Version X.Y.Z"

### Option B: Manual publish (fallback)

```bash
git checkout main && git pull
pnpm install --frozen-lockfile
pnpm prepublishOnly         # runs lint + typecheck + tests + build
pnpm publish --access public
git tag -a v1.1.0 -m "Version 1.1.0"
git push origin v1.1.0
gh release create v1.1.0 \
  --title "Version 1.1.0" \
  --notes-file <(awk '/^## \[1\.1\.0\]/,/^## \[/{ if (!/^## \[1\.1\.0\]/ && /^## \[/) exit; print }' CHANGELOG.md)
```

## 6. Post-Release Checks

1. Verify the GitHub Release was created with correct notes from CHANGELOG.
2. Confirm the package is visible on npm:
   ```bash
   npm view @marketdata/sdk version
   ```
3. Smoke-test install in a clean project:
   ```bash
   mkdir /tmp/smoke && cd /tmp/smoke
   pnpm init -y
   pnpm add @marketdata/sdk@1.1.0
   node -e "const { MarketDataClient } = require('@marketdata/sdk'); console.log(typeof MarketDataClient)"
   ```
4. Verify both ESM and CJS entry points resolve in the smoke project.

## 7. Rollback and Hotfix

If release issues are discovered:

1. Stop promotion messaging.
2. **Deprecate** the bad version on npm (do not unpublish — npm policy strongly discourages it, and consumers may already have locked it):
   ```bash
   npm deprecate @marketdata/sdk@X.Y.Z "Use vX.Y.(Z+1); this release contains <reason>"
   ```
3. Publish a corrective note in the GitHub Release and `CHANGELOG.md`.
4. Ship a patch release (`vX.Y.(Z+1)`) from `main` with the targeted fix.
5. Document root cause and remediation in the next changelog entry.

> Within 72 hours of publish you may `npm unpublish @marketdata/sdk@X.Y.Z` as a last resort. After 72 hours, deprecate-and-replace is the only supported path.
