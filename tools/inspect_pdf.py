from __future__ import annotations

import argparse
import math
from pathlib import Path

import fitz
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "source"
REVIEW = ROOT / "review"


def main() -> None:
    parser = argparse.ArgumentParser(description="Extract source PDFs for review.")
    parser.add_argument("--dpi", type=int, default=120)
    parser.add_argument("--columns", type=int, default=4)
    parser.add_argument("--per-sheet", type=int, default=20)
    args = parser.parse_args()

    pdfs = sorted(SOURCE.glob("*.pdf"))
    if not pdfs:
        raise SystemExit(f"No PDF files found in {SOURCE}")

    pages_root = REVIEW / "pages"
    sheets_root = REVIEW / "contact-sheets"
    scale = args.dpi / 72

    for volume_index, pdf_path in enumerate(pdfs, start=1):
        volume = f"volume-{volume_index:02d}"
        pages_dir = pages_root / volume
        sheets_dir = sheets_root / volume
        pages_dir.mkdir(parents=True, exist_ok=True)
        sheets_dir.mkdir(parents=True, exist_ok=True)
        thumbnails: list[Image.Image] = []

        with fitz.open(pdf_path) as document:
            for index, page in enumerate(document, start=1):
                pixmap = page.get_pixmap(matrix=fitz.Matrix(scale, scale), alpha=False)
                destination = pages_dir / f"page-{index:04d}.jpg"
                pixmap.save(destination)
                with Image.open(destination) as source:
                    image = source.convert("RGB")
                    image.thumbnail((260, 360))
                    tile = Image.new("RGB", (280, 400), "white")
                    tile.paste(image, ((280 - image.width) // 2, 18))
                ImageDraw.Draw(tile).text((10, 378), f"PDF page {index}", fill="black")
                thumbnails.append(tile)

        rows = math.ceil(args.per_sheet / args.columns)
        for start in range(0, len(thumbnails), args.per_sheet):
            subset = thumbnails[start : start + args.per_sheet]
            sheet = Image.new("RGB", (args.columns * 280, rows * 400), "#dddddd")
            for offset, thumbnail in enumerate(subset):
                sheet.paste(
                    thumbnail,
                    ((offset % args.columns) * 280, (offset // args.columns) * 400),
                )
            end = min(start + args.per_sheet, len(thumbnails))
            sheet.save(sheets_dir / f"pages-{start + 1:04d}-{end:04d}.jpg", quality=88)

        print(f"{pdf_path.name}: {len(thumbnails)} pages -> {pages_dir}")


if __name__ == "__main__":
    main()

