# Siddur Maker — instructions for coding agents

Read this file completely before editing.

## Goal

Turn the PDF files placed in `source/` into a complete Hebrew RTL Siddur PWA.
The finished app must preserve the architecture, reader behavior, visual design,
offline support and recursive LEGO block model inherited from `rede24/siddur`.

The output is the repository's `public/` directory. **Do not deploy it, connect
hosting, create cloud resources, or add deployment credentials.** Publishing in
this workflow means preparing and committing the finished static publication.

## Architecture that must remain

- `public/block-engine.js`: generic primitives, groups, references and conditions.
- `public/block-catalog.js`: full-page primitives and reusable prayer groups.
- `public/prayer-recipes.js`: service recipes built only from catalog references.
- `public/calendar.js`: Hebrew calendar and daily facts.
- `public/prayer-blocks.js`: resolves the daily tree and reader assets.
- `public/book-reader.js`: RTL book reader, swipe, fold, zoom and lifecycle.
- `public/app.js`: home screen, daily plan, navigation and reader integration.
- `public/sw.js`: offline shell and page cache.

Do not replace this architecture with a generic gallery, PDF iframe, or a new
framework. Extend the existing modules.

## Source rules

1. Never edit the source PDF.
2. Never OCR-replace, rewrite, correct, translate or normalize prayer text.
3. Use complete source pages only. Never crop a mixed page to hide conditional
   text. Preserving every required word is more important than hiding extra text.
4. Remove only covers, blank scans, advertisements, duplicate scans and standalone
   instruction/note pages. Record every removal in `review/exclusions.md`.
5. Inspect every boundary at readable resolution. Thumbnails alone are not proof.
6. If the source is incomplete or the liturgical order is uncertain, document the
   gap in `review/open-questions.md` and ask the user. Do not invent content.
7. Keep all PDF files ignored by Git unless the user explicitly confirms they may
   be redistributed.

## Required workflow

### 1. Audit and extract

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python tools/inspect_pdf.py
```

- Confirm the number of source volumes and their order.
- Complete `review/source-audit.md`.
- Inspect the generated contact sheets and each proposed boundary page.
- Copy approved full-page JPEG assets into `public/pages/` using stable IDs.

### 2. Build the LEGO catalog

- Start with page primitives.
- Group primitives into the smallest reusable prayer sections.
- Group those sections into larger sequences.
- Define final service recipes last.
- Use stable semantic group IDs; page numbers belong only in page primitives.
- Reuse shared groups instead of copying page arrays.
- Keep declarative conditions serializable; do not place callback functions in
  recipes or catalog data.

Read `docs/building-blocks.md` before editing the catalog.

### 3. Adapt the application

- Update the Siddur name, nusach, subtitle, colors and icon references.
- Update home-screen prayer cards and quick-start anchors from the actual source.
- Adapt `calendar.js` only for verified customs of the requested nusach.
- Update `CACHE` in `sw.js` whenever published assets or code change.
- Preserve real Hebrew-book navigation: forward progress follows the existing
  Hebrew swipe contract.
- Do not add explanatory banner pages between prayer pages.

### 4. Verify religious continuity

For every recipe and conditional branch:

- inspect the final words before each join and the first words after it;
- verify no required ending is lost on a page that also begins optional text;
- compare against the source table of contents and internal headings;
- check weekday, Monday/Thursday, Rosh Chodesh, no-Tachanun, Hallel, Musaf,
  seasonal and relevant holiday branches;
- never treat HTTP success or a clean screenshot as liturgical correctness.

### 5. Test

```bash
npm install
npm test
npm run test:browser
```

- Add unit tests for each important calendar/recipe boundary.
- Adapt browser quick-start selectors to the new source page IDs.
- Test a narrow iPhone viewport and landscape.
- Test forward/back fold, slow drag, cancelled drag, keyboard, pinch/zoom,
  closing and reopening, refresh, missing assets and offline mode.
- Fix every failed request, blank page and stale service-worker cache issue.

### 6. Publish inside the repository

- Ensure `public/` contains only the finished static application and approved
  page assets.
- Commit code, tests, documentation and allowed assets.
- Do not run Wrangler, Pages, GitHub Pages or any other deployment command.
- Report what was included, excluded, still uncertain and how to preview locally.

## Required review files

- `review/source-audit.md`
- `review/exclusions.md`
- `review/open-questions.md`

Copy the corresponding `.example.md` files before starting a new Siddur.

## Definition of done

- The app uses the inherited Siddur UI and reader, not a substitute.
- Every displayed image is a complete source page.
- Every recipe resolves without missing references or cycles.
- Required prayer words are not lost at page or block boundaries.
- Unit and browser tests pass.
- The app works offline after its first complete load.
- No deployment was performed.

