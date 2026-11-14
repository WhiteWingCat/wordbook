# SwiftDictionary session archive — 2026-11-13

## Session purpose

Continue Update 2.3.1 work, establish safe mock testing for the feature-branch preview, and agree a durable way to preserve SwiftDictionary development discussions across ChatGPT conversations.

## Owner decisions and requirements

### Isolated mock testing

The owner selected **Option B**: a preview-only mock testing mode that simulates multiple fictional users without using real accounts or production cloud data.

Requirements recorded:
- Provide fictional Test User A and Test User B, switchable from a separate mock panel.
- Activate only through an explicit preview-only entry; do not expose mock identities in the normal sign-in/account interface.
- Keep data separate by identity in a namespaced browser-only store, initially session-scoped.
- Route all mock-mode account and data operations through a mock adapter; changing only the displayed email is insufficient.
- Show a clear warning: **MOCK TEST MODE — no real account / no cloud sync**.
- Reset only the mock store; never clear browser-wide storage or real Supabase sessions.
- Disable Google sign-in while mock mode is active and provide a safe exit.
- Fail closed on production, GitHub Pages and unknown hosts. A query parameter alone is not a security boundary.
- Test production guard behaviour, absence of Supabase auth/network calls, identity isolation, and safe reset/exit.
- Recognise that mock mode cannot validate OAuth/JWT/RLS/SQL/functions/triggers or cross-device sync. Those require isolated Supabase staging or local Supabase.
- Do not change production Supabase settings, data or migrations.

### Documentation continuity

The owner approved establishing a permanent archive system:
- Archive every meaningful SwiftDictionary development conversation as a structured Markdown file on `docs/master-development-record`.
- Maintain a central archive index and keep the Master Development Record linked to the archives.
- Preserve exact owner decisions, progress, affected files, branches/commits/PRs, test evidence, failures/corrections, open issues and recovery instructions.
- Use structured summaries rather than unfiltered transcripts. Exclude hidden reasoning, secrets, credentials and unrelated personal details.
- Keep the documentation branch for project records; feature branches for implementation; `main` for production code.
- Update the Master Development Record and archive at the end of every meaningful development session.

## Repository and branch state

- Repository: [WhiteWingCat/wordbook](https://github.com/WhiteWingCat/wordbook).
- Documentation branch: `docs/master-development-record`.
- Feature branch: `feature/update-2-3-1-bug-fix-and-changes`.
- PR #5: [SwiftDictionary Update 2.3.1](https://github.com/WhiteWingCat/wordbook/pull/5), targeting `main`, open and unmerged at the latest recorded check.
- Latest recorded feature commit: `c55d05fe196811903f2c358f090eebed6893b3ff`.
- No merge to `main`, production deployment or production Supabase modification was authorised or performed in this session.

## Mock implementation progress

Files added/changed on the feature branch:
- `mock-testing.js`: isolated mock adapter.
- `index.html`: loads the adapter after `supabase-config.js` and before app initialisation.
- `tests/update-2-3-1/mock-testing.test.mjs`: mock adapter unit coverage.
- `.github/workflows/update-2-3-0-allowance-test.yml`: CI checks.
- `tests/browser/update-2-3-0-smoke.spec.js`: local-host fail-closed browser check.

Recorded implementation details:
- Activation requires the exact expected preview hostname `feature-update-2-3-1-bug-fix-and-changes.swiftdictionary-testing.pages.dev` plus `?swiftMock=1`.
- Fictional Test User A and B have separate `sessionStorage` namespaces under `swiftDictionaryMock:v1:`.
- Separate mock fixtures cover saved words, preferences and learning progress.
- Mock client handles supported table operations and a subset of learning RPCs; unsupported RPCs explicitly fail.
- Google OAuth is disabled in mock mode.
- Legacy saved-word/avatar localStorage keys are intercepted to prevent mock data leaking into real browser-local state.
- A visible mock panel supports identity switching, scoped reset and exit.
- Capability flags explicitly distinguish frontend simulation from unavailable real auth/RLS/database/cross-device validation.
- Some Supabase query/response shapes were inferred and still require a full call-site audit and actual preview testing.

## CI evidence

GitHub Actions run [#456](https://github.com/WhiteWingCat/wordbook/actions/runs/43413625418) passed:
- Mock adapter syntax check and five unit tests.
- PostgreSQL 17 migration/allowance job.
- Chromium browser regression job, including local-host mock fail-closed check.
- Disposable local Supabase Auth compatibility job.

Earlier CI failures included cross-realm array assertions and a headless test document missing `getElementById`; these were corrected. The passing CI run is not proof that the deployed Cloudflare preview hostname or every real app data path has been manually verified.

## Preview URL instructions and outstanding verification

The Cloudflare Pages project is `swiftdictionary-testing`, with `main` as production branch and branch previews for non-production branches. The expected feature preview hostname is:

`https://feature-update-2-3-1-bug-fix-and-changes.swiftdictionary-testing.pages.dev/`

The mock query is manually appended:

`https://feature-update-2-3-1-bug-fix-and-changes.swiftdictionary-testing.pages.dev/?swiftMock=1`

If the actual deployment URL differs, use the actual URL and inspect the exact-host guard before proceeding. If a URL already has a query string, append `&swiftMock=1`.

Manual preview checks still pending:
1. Confirm the deployed hostname matches the allowlisted host.
2. Confirm the visible mock-mode warning appears only with the explicit query on that preview host.
3. Switch between Test User A and B and confirm saved words/preferences/progress remain isolated.
4. Reset one mock identity and confirm the other identity and real browser state are untouched.
5. Exit mock mode and confirm normal mode is restored without clearing real sessions.
6. Verify no Supabase Auth, database or RPC network calls are made while mock mode is active.
7. Verify production, GitHub Pages and unknown hosts fail closed even if the query parameter is present.

Important backend finding: both main and feature-branch `supabase-config.js` reference the same production Supabase project. Cloudflare preview is a separate frontend deployment, not a separate backend. Do not use real-account/data-changing tests on preview until backend isolation is confirmed.

## Safety, privacy and legal notes

- Use fictional test data only; never put real personal information into mock fixtures.
- Keep mock state session-scoped and clearly marked as simulation.
- Do not expose service-role credentials or OAuth secrets.
- The mock mode is a test harness, not a security boundary for production and not a replacement for backend staging.
- The existing SwiftDictionary standing rule remains: new features/expansions require Malaysia-specific and general legal/privacy planning, including PDPA applicability and international user considerations where relevant.
- No production database or account data was changed.

## Next recovery steps

1. Read `docs/MASTER-DEVELOPMENT-RECORD.md` and this archive before continuing.
2. Check current branch, PR #5, latest commit and CI status; do not assume recorded state is still current.
3. Obtain/confirm the actual Cloudflare Pages preview URL and compare its hostname to the mock guard.
4. Complete manual preview checks listed above; do not use a real account as a workaround.
5. Audit all direct Supabase table, RPC and auth call shapes in `index.html` and `daily-learning.js`; extend mock support only from verified app call sites.
6. Keep all implementation on the existing feature branch. Do not merge PR #5, deploy or modify production Supabase without explicit owner approval.
7. At the end of the next meaningful session, update the Master Development Record, this archive if corrections are needed, and the archive index.

## Source conversation

ChatGPT conversation dated 2026-11-13 covering Update 2.3.1 mock-mode design/implementation, CI corrections, preview-host testing safeguards, repository documentation organisation, and the owner's approval of a permanent conversation archive system.


## Follow-up: actual preview hostname identified and guard corrected

The owner provided the actual preview URL: `https://feature-update-2-3-1-bug-fix.swiftdictionary-testing.pages.dev/#dictionary`. The hostname did not match the earlier hardcoded allowlist, which expected `feature-update-2-3-1-bug-fix-and-changes.swiftdictionary-testing.pages.dev`. The query parameter format was not the cause.

On the Update 2.3.1 feature branch:
- `mock-testing.js` now allowlists only `feature-update-2-3-1-bug-fix.swiftdictionary-testing.pages.dev` and still requires `?swiftMock=1`.
- `tests/update-2-3-1/mock-testing.test.mjs` now uses the actual host for positive activation cases and checks that the former hostname fails closed.
- Adapter commit: `ca30d3394dcde2057d11b698f2e66bb15b1e55b4`.
- Test commit: `54c11c221fb3199a655d849444182077e4b53e95`.
- CI for these commits is not yet confirmed; the previous passing run #456 predates this correction.

Owner test URL after the updated preview is deployed:
`https://feature-update-2-3-1-bug-fix.swiftdictionary-testing.pages.dev/?swiftMock=1`

If the URL already has a query string, append `&swiftMock=1`. Confirm the visible mock-mode warning before interacting. Never use a real account as a workaround. The preview frontend still points to the production Supabase project, so ensure mock mode is active and verify it makes no Supabase requests before any interaction that could modify data.
