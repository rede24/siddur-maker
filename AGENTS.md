# Agent Instructions — Siddur Maker

Read this file completely before changing the repository.

## Mission

Convert the siddur PDF placed in `source/` into a modular static publication.
The user should be able to review the result locally and publish it later by
their own chosen method.

**Do not deploy, configure hosting, create cloud resources, or publish to a
third-party service unless the user explicitly requests that separate action.**

## Non-negotiable content rules

1. Treat prayer text as sensitive source material: do not rewrite, OCR-replace,
   normalize, translate, or correct it silently.
2. Preserve full source pages. Never crop out a prayer, concluding line, header,
   or mixed-use page merely because part of the page is not needed.
3. Page numbers in `plans/page-plan.json` are 1-based PDF page numbers.
4. Do not guess page boundaries from thumbnails alone. Inspect the first and
   last page of every proposed block at readable resolution.
5. Decorative covers, publisher ads, blank scanner pages, and duplicate scans
   may be excluded, but record each exclusion in `review/exclusions.md` with a
   reason.
6. If a boundary or liturgical order is uncertain, record it in
   `review/open-questions.md`; do not conceal uncertainty.
7. Keep the reader RTL-first. Forward navigation for Hebrew content must feel
   like progressing through a Hebrew book.

## Required workflow

### 1. Discover and inspect

- Confirm there is exactly one PDF in `source/`, unless the user explicitly
  describes a multi-volume siddur.
- Run `python scripts/inspect_pdf.py`.
- Inspect `review/contact-sheets/` and then inspect boundary pages individually.
- Record the PDF filename, page count, and any scan anomalies in
  `review/source-audit.md`.

### 2. Create the page plan

- Copy `plans/page-plan.example.json` to `plans/page-plan.json`.
- Define small reusable blocks first (the LEGO pieces).
- Define publications second by ordering block IDs.
- Use stable lowercase IDs with hyphens. Do not encode page numbers in IDs.
- A block can be reused by multiple publications without duplicating assets.
- Include a short Hebrew title for each user-facing block and publication.

### 3. Verify liturgical order

- Compare every publication against the source siddur's own table of contents
  and internal headings.
- Check joins between blocks: the final words of the prior block and the first
  words of the next block must form a valid continuous order.
- Ensure no required words disappear at boundaries.
- Do not make date/holiday logic unless the plan explicitly models it.

### 4. Validate and build

```bash
python scripts/validate_plan.py
python scripts/build.py
```

- Fix every validation error.
- Serve `output/` locally and test desktop plus a narrow mobile viewport.
- Test menu, forward/back, swipe, keyboard navigation, zoom, refresh, and
  opening a second publication after returning to the menu.
- Confirm there are no blank flashes or missing image requests.

### 5. Report

Tell the user:

- what publications were created;
- what pages were excluded and why;
- any open questions requiring human judgment;
- the exact local preview command.

Do not claim deployment or public availability.

## File ownership

- Human/source input: `source/`
- Agent-authored semantic plan: `plans/page-plan.json`
- Review evidence and uncertainties: `review/`
- Generated publication: `output/`
- Generator implementation: `scripts/` and `reader/`

Do not modify the source PDF.

