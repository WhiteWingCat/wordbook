# SwiftDictionary v7 — Character-first Chinese learning

A static, GitHub Pages-compatible English and Simplified Chinese vocabulary dictionary.

## What's updated
- Removed multi-character Chinese terms from the Chinese grid: each Chinese grid tile is exactly one Han character.
- Multi-character vocabulary is attached to related-word lists for characters it contains.
- Expanded the Chinese single-character collection and added more English vocabulary.
- Increased expanded-detail typography and retained vertical scrolling for longer entries.
- Added pinyin lines beneath Chinese examples, related terms, and Chinese definitions where character readings are available.
- Chinese search accepts tone-marked or unmarked pinyin (for example, `shuǐ` or `shui`).
- Reframed character breakdowns around a learner-friendly method: identify the radical/semantic component, look for a possible phonetic component, then learn the character in words. Components are clues, not guaranteed definitions or exact pronunciation rules.

## Quality-and-structure update (v8)
- Corrected Chinese character tiles to use true grid-based centering; saved-star indicators sit in the corner and no longer push characters off-center.
- Hidden the English parts-of-speech filter row while the Simplified Chinese course is active. The filter remains available for English.
- Chinese filtering now explicitly ignores the English category state, preventing stale category selections from affecting Chinese results.
- Kept the Chinese grid character-first: only single Han characters are shown as tiles, while multi-character vocabulary stays in related-word content.

## Important learning note
Pinyin coverage in multi-character example text is based on the site's single-character pronunciation data and may be incomplete or incorrect for polyphonic characters and context-dependent readings. This release improves layout and course-filter behavior; it is not a complete expert linguistic audit. Verify pronunciations, definitions, example naturalness, and character-component explanations with trusted dictionaries or a qualified Mandarin reviewer before treating every entry as authoritative. Character etymology and component explanations are concise learner aids, not exhaustive historical claims.

## Publish on GitHub Pages
Keep `index.html`, `feedback.html`, `banner.svg`, and `README.md` in the same repository directory. Upload/replace the files and commit the changes. The site uses relative asset links and does not require a server.
