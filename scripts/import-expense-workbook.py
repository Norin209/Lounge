#!/usr/bin/env python3
"""Convert the current expense workbook into dashboard-ready JSON.

Usage:
    python3 scripts/import-expense-workbook.py "/path/to/DAILY EXPENSE REPORT.xlsx"
"""

from __future__ import annotations

import json
import re
import sys
import zipfile
from datetime import datetime, timedelta
from pathlib import Path
from xml.etree import ElementTree as ET


MAIN_NAMESPACE = "http://schemas.openxmlformats.org/spreadsheetml/2006/main"
RELATIONSHIP_NAMESPACE = (
    "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
)
PACKAGE_RELATIONSHIP_NAMESPACE = (
    "http://schemas.openxmlformats.org/package/2006/relationships"
)
NAMESPACES = {"x": MAIN_NAMESPACE}

PROJECT_ROOT = Path(__file__).resolve().parents[1]
OUTPUT_PATH = PROJECT_ROOT / "app/admin/expenses/expense-data.json"

# These are the complete, current sheets exposed by the dashboard.
SHEETS_TO_IMPORT = ("July-2026", "June-2026", "May-2026")

CATEGORY_COLUMNS = (
    ("Salon", "B", "D", "E", "F", "G"),
    ("Coffee", "H", "J", "K", "L", "M"),
    ("Car Wash", "N", "P", "Q", "R", "S"),
    ("Utilities", "T", "V", "W", "X", "Y"),
    ("Advertisement", "Z", "AB", "AC", "AD", "AE"),
    ("Other", "AF", "AH", "AI", "AJ", "AK"),
)

MONTH_NUMBERS = {
    "jan": 1,
    "feb": 2,
    "mar": 3,
    "apr": 4,
    "may": 5,
    "june": 6,
    "july": 7,
    "aug": 8,
    "sep": 9,
    "oct": 10,
    "nov": 11,
    "dec": 12,
}


def workbook_month(sheet_name: str) -> tuple[int, int]:
    match = re.fullmatch(r"([A-Za-z]+)-(\d{4})", sheet_name)
    if not match:
        raise ValueError(f"Unsupported monthly sheet name: {sheet_name}")

    month = MONTH_NUMBERS.get(match.group(1).lower())
    if month is None:
        raise ValueError(f"Unsupported month in sheet name: {sheet_name}")

    return int(match.group(2)), month


def excel_date(serial: str) -> datetime:
    return datetime(1899, 12, 30) + timedelta(days=float(serial))


def numeric_value(value: str) -> float:
    return float(value or 0)


def read_shared_strings(archive: zipfile.ZipFile) -> list[str]:
    if "xl/sharedStrings.xml" not in archive.namelist():
        return []

    root = ET.fromstring(archive.read("xl/sharedStrings.xml"))
    return [
        "".join(text.text or "" for text in item.iter(f"{{{MAIN_NAMESPACE}}}t"))
        for item in root.findall("x:si", NAMESPACES)
    ]


def read_cells(
    archive: zipfile.ZipFile,
    sheet_path: str,
    shared_strings: list[str],
) -> dict[str, str]:
    root = ET.fromstring(archive.read(sheet_path))
    cells: dict[str, str] = {}

    for cell in root.findall(".//x:sheetData/x:row/x:c", NAMESPACES):
        reference = cell.attrib.get("r", "")
        value_node = cell.find("x:v", NAMESPACES)
        inline_node = cell.find("x:is", NAMESPACES)
        value = value_node.text if value_node is not None else ""

        if cell.attrib.get("t") == "s" and value:
            value = shared_strings[int(value)]
        elif cell.attrib.get("t") == "inlineStr" and inline_node is not None:
            value = "".join(
                text.text or ""
                for text in inline_node.iter(f"{{{MAIN_NAMESPACE}}}t")
            )

        cells[reference] = value

    return cells


def extract_month(sheet_name: str, cells: dict[str, str]) -> dict[str, object]:
    year, month = workbook_month(sheet_name)
    records: list[dict[str, object]] = []

    for category_index, columns in enumerate(CATEGORY_COLUMNS):
        category, date_column, item_column, quantity_column, price_column, total_column = (
            columns
        )
        current_date: datetime | None = None
        category_total = 0.0

        for row in range(9, 121):
            raw_date = cells.get(f"{date_column}{row}", "").strip()
            if raw_date:
                current_date = excel_date(raw_date)

            description = cells.get(f"{item_column}{row}", "").strip()
            if not description:
                continue

            if current_date is None:
                raise ValueError(
                    f"{sheet_name} {category} row {row} has an expense but no date"
                )
            if (current_date.year, current_date.month) != (year, month):
                raise ValueError(
                    f"{sheet_name} {category} row {row} has an out-of-month date: "
                    f"{current_date.date().isoformat()}"
                )

            quantity = numeric_value(cells.get(f"{quantity_column}{row}", ""))
            unit_price = numeric_value(cells.get(f"{price_column}{row}", ""))
            total = numeric_value(cells.get(f"{total_column}{row}", ""))
            category_total += total

            category_id = category.lower().replace(" ", "-")
            records.append(
                {
                    "id": f"{year}-{month:02d}-{category_id}-{row}",
                    "date": current_date.date().isoformat(),
                    "category": category,
                    "description": description,
                    "quantity": quantity,
                    "unitPrice": unit_price,
                    "total": total,
                    "_sort": category_index * 1000 + row,
                }
            )

        workbook_total = numeric_value(cells.get(f"{total_column}5", ""))
        if abs(category_total - workbook_total) > 0.02:
            raise ValueError(
                f"{sheet_name} {category} total mismatch: "
                f"rows={category_total:.2f}, workbook={workbook_total:.2f}"
            )

    records.sort(key=lambda record: (record["date"], -int(record["_sort"])), reverse=True)
    for record in records:
        del record["_sort"]

    month_date = datetime(year, month, 1)
    return {
        "key": month_date.strftime("%Y-%m"),
        "label": month_date.strftime("%B %Y"),
        "expenses": records,
    }


def convert_workbook(workbook_path: Path) -> dict[str, object]:
    with zipfile.ZipFile(workbook_path) as archive:
        shared_strings = read_shared_strings(archive)
        workbook = ET.fromstring(archive.read("xl/workbook.xml"))
        relationships = ET.fromstring(archive.read("xl/_rels/workbook.xml.rels"))
        targets = {
            relationship.attrib["Id"]: relationship.attrib["Target"]
            for relationship in relationships.findall(
                f"{{{PACKAGE_RELATIONSHIP_NAMESPACE}}}Relationship"
            )
        }
        sheets = {
            sheet.attrib["name"]: sheet
            for sheet in workbook.findall("x:sheets/x:sheet", NAMESPACES)
        }

        months = []
        for sheet_name in SHEETS_TO_IMPORT:
            sheet = sheets.get(sheet_name)
            if sheet is None:
                raise ValueError(f"Workbook is missing required sheet: {sheet_name}")

            relationship_id = sheet.attrib[f"{{{RELATIONSHIP_NAMESPACE}}}id"]
            target = targets[relationship_id].lstrip("/")
            sheet_path = target if target.startswith("xl/") else f"xl/{target}"
            cells = read_cells(archive, sheet_path, shared_strings)
            months.append(extract_month(sheet_name, cells))

    return {
        "source": workbook_path.name,
        "months": months,
    }


def main() -> None:
    if len(sys.argv) != 2:
        raise SystemExit("Provide the path to the .xlsx expense workbook")

    workbook_path = Path(sys.argv[1]).expanduser().resolve()
    if not workbook_path.is_file():
        raise SystemExit(f"Workbook not found: {workbook_path}")

    data = convert_workbook(workbook_path)
    OUTPUT_PATH.write_text(
        json.dumps(data, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )

    expense_count = sum(len(month["expenses"]) for month in data["months"])
    print(f"Imported {expense_count} expenses into {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
