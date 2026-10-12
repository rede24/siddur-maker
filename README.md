# Siddur Maker

Template repository for turning a scanned siddur PDF into a clean, modular,
offline-friendly static publication with the help of a coding agent.

This repository **builds publication files only**. It does not deploy them.

## Quick start

1. Create a new repository from this template.
2. Put one siddur PDF in `source/`.
3. Ask your coding agent:

   > Read AGENTS.md completely. Process the PDF in source/, create the page
   > plan, validate it, and build the siddur publication. Do not deploy it.

4. Review `output/` locally:

   ```bash
   python -m http.server 8080 --directory output
   ```

5. Open <http://localhost:8080>.

## How it works

The PDF stays the source of truth. The agent inspects it and writes
`plans/page-plan.json`, which defines reusable page blocks and publications
assembled from those blocks. `scripts/build.py` renders the required full PDF
pages and creates a dependency-free static reader in `output/`.

```text
source/*.pdf
    -> agent inspection
    -> plans/page-plan.json
    -> scripts/build.py
    -> output/ (publishable static files)
```

## Commands

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python scripts/inspect_pdf.py
python scripts/validate_plan.py
python scripts/build.py
```

Use `--help` on every script for options.

## Core rules

- PDF page numbers in the plan are 1-based.
- Never crop prayers or remove a page because only part of it is conditional.
- A block is reusable; a publication is an ordered list of block IDs.
- Generated files belong in `output/` and are not committed by default.
- Building is allowed. Deployment requires a separate explicit request.

