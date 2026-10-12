from __future__ import annotations

import argparse
import math

import fitz
from PIL import Image, ImageDraw

from common import REVIEW_DIR, find_source_pdf


def main() -> None:
    parser = argparse.ArgumentParser(description="Render review pages and contact sheets.")
    parser.add_argument("--dpi", type=int, default=96)
    parser.add_argument("--columns", type=int, default=4)
    parser.add_argument("--per-sheet", type=int, default=20)
    args = parser.parse_args()

    pdf_path = find_source_pdf()
    pages_dir = REVIEW_DIR / "pages"
    sheets_dir = REVIEW_DIR / "contact-sheets"
    pages_dir.mkdir(parents=True, exist_ok=True)
    sheets_dir.mkdir(parents=True, exist_ok=True)

    doc = fitz.open(pdf_path)
    scale = args.dpi / 72
    thumbnails: list[Image.Image] = []

    for index, page in enumerate(doc):
        pix = page.get_pixmap(matrix=fitz.Matrix(scale, scale), alpha=False)
        path = pages_dir / f"page-{index + 1:04d}.jpg"
        pix.save(path)
        image = Image.open(path).convert("RGB")
        image.thumbnail((260, 360))
        tile = Image.new("RGB", (280, 400), "white")
        tile.paste(image, ((280 - image.width) // 2, 24))
        ImageDraw.Draw(tile).text((10, 378), f"PDF page {index + 1}", fill="black")
        thumbnails.append(tile)

    rows = math.ceil(args.per_sheet / args.columns)
    for start in range(0, len(thumbnails), args.per_sheet):
        subset = thumbnails[start : start + args.per_sheet]
        sheet = Image.new("RGB", (args.columns * 280, rows * 400), "#dddddd")
        for offset, thumb in enumerate(subset):
            x = (offset % args.columns) * 280
            y = (offset // args.columns) * 400
            sheet.paste(thumb, (x, y))
        end = min(start + args.per_sheet, len(thumbnails))
        sheet.save(sheets_dir / f"pages-{start + 1:04d}-{end:04d}.jpg", quality=88)

    print(f"Inspected {len(doc)} pages from {pdf_path.name}")
    print(f"Review files: {REVIEW_DIR}")


if __name__ == "__main__":
    main()

