# SwiftDictionary

A static, mobile-friendly English vocabulary dictionary with definitions, examples, everyday conversations, category filters, alphabetical browsing, saved words, and a feedback page.

## Files
- `index.html` — main dictionary app and vocabulary data
- `feedback.html` — feedback form that prepares a GitHub issue; the visitor needs a GitHub account to submit it
- `banner.svg` — custom illustrated nature banner

## Publish on GitHub Pages
1. Open the repository that currently hosts your dictionary.
2. Upload/replace `index.html` and `README.md`, and add `feedback.html` and `banner.svg` at the same repository location.
3. Commit the changes. Keep the four files together in the same folder.
4. Refresh the published site after GitHub Pages finishes deploying. The existing website URL should remain the same.

## Notes
- Pronunciation guides are approximate General American IPA where available; pronunciations can vary by accent. A few uncommon words may not have an automatic pronunciation guide.
- Saved words are stored locally in the visitor’s browser and are not synced between devices.
- Since this is a static site with no backend, the feedback form opens a prefilled GitHub issue rather than storing submissions itself.
