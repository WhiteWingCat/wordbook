# SwiftDictionary conversation archive

This directory contains structured handover archives for meaningful SwiftDictionary development conversations. The Master Development Record at [`../MASTER-DEVELOPMENT-RECORD.md`](../MASTER-DEVELOPMENT-RECORD.md) remains the concise current source of truth; archives preserve session-level decisions and recovery detail.

## Archive rules

- Create one dated Markdown archive for each meaningful SwiftDictionary development conversation/session.
- Record purpose, exact owner decisions, implementation/files, branch/commit/PR state, test evidence (including failures and fixes), legal/privacy considerations, outstanding work and recovery steps.
- Update the Master Development Record and this index together.
- Summarise relevant user-visible project discussion; do not claim to provide a verbatim transcript.
- Never include hidden reasoning, credentials, secrets or unrelated personal information. Treat repository content as potentially public.
- Keep documentation on `docs/master-development-record`; implementation stays on feature branches and production code on `main`.

## Archives

| Date | Archive | Coverage |
|---|---|---|
| 2026-11-13 | [Update 2.3.1 mock testing and documentation continuity](2026-11-13-update-2-3-1-mock-testing.md) | Option B mock-mode decision and implementation, CI evidence, preview verification still pending, production safety, establishment of the permanent archive process, and subsequent correction of the preview hostname allowlist. |
| 2026-11-14 | [Update 2.3.1 dashboard and Daily Learning refinements](2026-11-14-update-2-3-1-dashboard-daily-learning.md) | Owner's first seven feedback items, relative activity recency, visual overview, cooldown preview handling, shared global Daily Discovery pilot, slide-in activity reader, examples and frequency-data licensing research. |
| 2026-11-14 | [Update 2.3.1 second owner review](2026-11-14-update-2-3-1-second-owner-review.md) | Translation refresh and Chinese UI coverage, transparent/padded activity panel, dictionary-style Discovery, account-specific activity rotation and mock reset generation, consolidated examples, dedicated lesson page, Dashboard scope freeze and passing CI run #549. |
| 2026-11-14 | [Update 2.3.1 final daily activity polish and rollover](2026-11-14-update-2-3-1-final-daily-activity-polish.md) | Reader outline and definition contrast, live translation of reset status, duplicate cooldown removal, completion closing the reader, and local-midnight abandonment of unfinished activities with passing CI run #557. |
