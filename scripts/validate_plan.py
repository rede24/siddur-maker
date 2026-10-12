from __future__ import annotations

import re

import fitz

from common import find_source_pdf, load_plan

ID_PATTERN = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")


def validate(plan: dict, page_count: int) -> list[str]:
    errors: list[str] = []
    blocks = plan.get("blocks")
    publications = plan.get("publications")
    if not isinstance(blocks, list) or not blocks:
        errors.append("blocks must be a non-empty array")
        blocks = []
    if not isinstance(publications, list) or not publications:
        errors.append("publications must be a non-empty array")
        publications = []

    ids: set[str] = set()
    for position, block in enumerate(blocks, start=1):
        block_id = block.get("id")
        if not isinstance(block_id, str) or not ID_PATTERN.fullmatch(block_id):
            errors.append(f"block #{position} has an invalid id")
            continue
        if block_id in ids:
            errors.append(f"duplicate block id: {block_id}")
        ids.add(block_id)
        pages = block.get("pages")
        if not isinstance(pages, list) or not pages:
            errors.append(f"block {block_id} has no pages")
            continue
        for page in pages:
            if not isinstance(page, int) or isinstance(page, bool):
                errors.append(f"block {block_id} contains a non-integer page")
            elif page < 1 or page > page_count:
                errors.append(
                    f"block {block_id} references page {page}; PDF has {page_count} pages"
                )

    publication_ids: set[str] = set()
    for position, publication in enumerate(publications, start=1):
        publication_id = publication.get("id")
        if not isinstance(publication_id, str) or not ID_PATTERN.fullmatch(publication_id):
            errors.append(f"publication #{position} has an invalid id")
            continue
        if publication_id in publication_ids:
            errors.append(f"duplicate publication id: {publication_id}")
        publication_ids.add(publication_id)
        used = publication.get("blocks")
        if not isinstance(used, list) or not used:
            errors.append(f"publication {publication_id} has no blocks")
            continue
        for block_id in used:
            if block_id not in ids:
                errors.append(
                    f"publication {publication_id} references unknown block {block_id!r}"
                )
    return errors


def main() -> None:
    pdf = find_source_pdf()
    plan = load_plan()
    with fitz.open(pdf) as doc:
        errors = validate(plan, len(doc))
    if errors:
        print("Plan validation failed:")
        for error in errors:
            print(f"- {error}")
        raise SystemExit(1)
    print("Plan is valid.")


if __name__ == "__main__":
    main()

