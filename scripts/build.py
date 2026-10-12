from __future__ import annotations

import argparse
import shutil

import fitz
from PIL import Image

from common import OUTPUT_DIR, ROOT, find_source_pdf, load_plan, write_json
from validate_plan import validate


def main() -> None:
    parser = argparse.ArgumentParser(description="Build the static siddur publication.")
    parser.add_argument("--clean", action="store_true", help="Remove output first")
    args = parser.parse_args()

    pdf_path = find_source_pdf()
    plan = load_plan()
    render = plan.get("render", {})
    dpi = int(render.get("dpi", 180))
    image_format = str(render.get("format", "webp")).lower()
    quality = int(render.get("quality", 86))
    if image_format not in {"webp", "jpg", "jpeg", "png"}:
        raise SystemExit("render.format must be webp, jpg, jpeg, or png")

    if args.clean and OUTPUT_DIR.exists():
        shutil.rmtree(OUTPUT_DIR)
    assets_dir = OUTPUT_DIR / "assets" / "pages"
    assets_dir.mkdir(parents=True, exist_ok=True)

    with fitz.open(pdf_path) as doc:
        errors = validate(plan, len(doc))
        if errors:
            raise SystemExit("Invalid plan:\n- " + "\n- ".join(errors))

        required_pages = sorted(
            {page for block in plan["blocks"] for page in block["pages"]}
        )
        scale = dpi / 72
        extension = "jpg" if image_format == "jpeg" else image_format
        for page_number in required_pages:
            destination = assets_dir / f"page-{page_number:04d}.{extension}"
            pix = doc[page_number - 1].get_pixmap(
                matrix=fitz.Matrix(scale, scale), alpha=False
            )
            temporary = assets_dir / f".page-{page_number:04d}.png"
            pix.save(temporary)
            with Image.open(temporary) as image:
                save_args = {}
                if extension in {"webp", "jpg"}:
                    save_args["quality"] = quality
                image.save(destination, format=extension.upper(), **save_args)
            temporary.unlink()

    block_map = {block["id"]: block for block in plan["blocks"]}
    publications = []
    for publication in plan["publications"]:
        pages = []
        for block_id in publication["blocks"]:
            for page_number in block_map[block_id]["pages"]:
                pages.append(
                    {
                        "number": page_number,
                        "blockId": block_id,
                        "src": f"assets/pages/page-{page_number:04d}.{extension}",
                    }
                )
        publications.append({**publication, "pages": pages})

    manifest = {
        "siddur": plan.get("siddur", {}),
        "blocks": plan["blocks"],
        "publications": publications,
    }
    write_json(OUTPUT_DIR / "siddur.json", manifest)

    reader_dir = ROOT / "reader"
    for source in reader_dir.iterdir():
        if source.is_file():
            shutil.copy2(source, OUTPUT_DIR / source.name)

    print(f"Built {len(publications)} publication(s) in {OUTPUT_DIR}")


if __name__ == "__main__":
    main()

