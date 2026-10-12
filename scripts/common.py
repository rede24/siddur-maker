from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE_DIR = ROOT / "source"
PLAN_PATH = ROOT / "plans" / "page-plan.json"
OUTPUT_DIR = ROOT / "output"
REVIEW_DIR = ROOT / "review"


def find_source_pdf() -> Path:
    pdfs = sorted(SOURCE_DIR.glob("*.pdf"))
    if len(pdfs) != 1:
        raise SystemExit(
            f"Expected exactly one PDF in {SOURCE_DIR}, found {len(pdfs)}."
        )
    return pdfs[0]


def load_plan() -> dict:
    if not PLAN_PATH.exists():
        raise SystemExit(
            f"Missing {PLAN_PATH}. Copy page-plan.example.json and complete it."
        )
    with PLAN_PATH.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def write_json(path: Path, value: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        json.dumps(value, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )

