from __future__ import annotations

import html
import os
import re
from pathlib import Path
from typing import Iterable, List, Sequence

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import (
    Image,
    KeepTogether,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "output" / "pdf"
SCREEN_DIR = ROOT / "output" / "playwright"


def make_styles():
    base = getSampleStyleSheet()
    styles = {
        "title": ParagraphStyle(
            "ManualTitle",
            parent=base["Title"],
            fontName="Helvetica-Bold",
            fontSize=27,
            leading=32,
            textColor=colors.HexColor("#111827"),
            alignment=TA_CENTER,
            spaceAfter=16,
        ),
        "subtitle": ParagraphStyle(
            "ManualSubtitle",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=10,
            leading=14,
            textColor=colors.HexColor("#4b5563"),
            alignment=TA_CENTER,
            spaceAfter=8,
        ),
        "h1": ParagraphStyle(
            "H1",
            parent=base["Heading1"],
            fontName="Helvetica-Bold",
            fontSize=20,
            leading=25,
            textColor=colors.HexColor("#111827"),
            spaceBefore=12,
            spaceAfter=8,
        ),
        "h2": ParagraphStyle(
            "H2",
            parent=base["Heading2"],
            fontName="Helvetica-Bold",
            fontSize=15,
            leading=20,
            textColor=colors.HexColor("#1f2937"),
            spaceBefore=10,
            spaceAfter=6,
        ),
        "h3": ParagraphStyle(
            "H3",
            parent=base["Heading3"],
            fontName="Helvetica-Bold",
            fontSize=12.5,
            leading=16,
            textColor=colors.HexColor("#374151"),
            spaceBefore=8,
            spaceAfter=5,
        ),
        "body": ParagraphStyle(
            "Body",
            parent=base["BodyText"],
            fontName="Helvetica",
            fontSize=9.2,
            leading=12.8,
            textColor=colors.HexColor("#111827"),
            alignment=TA_LEFT,
            spaceAfter=5,
        ),
        "bullet": ParagraphStyle(
            "Bullet",
            parent=base["BodyText"],
            fontName="Helvetica",
            fontSize=9.1,
            leading=12.5,
            leftIndent=16,
            firstLineIndent=-8,
            spaceAfter=3,
        ),
        "caption": ParagraphStyle(
            "Caption",
            parent=base["BodyText"],
            fontName="Helvetica-Oblique",
            fontSize=8,
            leading=10,
            textColor=colors.HexColor("#6b7280"),
            alignment=TA_CENTER,
            spaceBefore=4,
            spaceAfter=12,
        ),
        "table": ParagraphStyle(
            "TableCell",
            parent=base["BodyText"],
            fontName="Helvetica",
            fontSize=7.1,
            leading=9,
            textColor=colors.HexColor("#111827"),
        ),
        "table_header": ParagraphStyle(
            "TableHeader",
            parent=base["BodyText"],
            fontName="Helvetica-Bold",
            fontSize=7.1,
            leading=9,
            textColor=colors.white,
        ),
    }
    return styles


def inline_markup(text: str) -> str:
    text = html.escape(text.strip())
    text = re.sub(r"`([^`]+)`", r'<font name="Courier">\1</font>', text)
    text = re.sub(r"\*\*([^*]+)\*\*", r"<b>\1</b>", text)
    return text


def is_table_separator(line: str) -> bool:
    clean = line.replace("|", "").strip()
    return bool(clean) and all(ch in "-: " for ch in clean)


def split_table_line(line: str) -> List[str]:
    line = line.strip()
    if line.startswith("|"):
        line = line[1:]
    if line.endswith("|"):
        line = line[:-1]
    return [cell.strip() for cell in line.split("|")]


def flush_table(rows: List[List[str]], story: list, doc_width: float, styles: dict) -> None:
    if not rows:
        return
    normalized = [row for row in rows if not (len(row) == 1 and not row[0])]
    if not normalized:
        return
    col_count = max(len(row) for row in normalized)
    table_data = []
    for index, row in enumerate(normalized):
        padded = row + [""] * (col_count - len(row))
        style_name = "table_header" if index == 0 else "table"
        table_data.append([Paragraph(inline_markup(cell), styles[style_name]) for cell in padded])
    widths = [doc_width / col_count] * col_count
    table = Table(table_data, colWidths=widths, repeatRows=1, hAlign="LEFT")
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#111827")),
                ("GRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#d1d5db")),
                ("BACKGROUND", (0, 1), (-1, -1), colors.HexColor("#f9fafb")),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 4),
                ("RIGHTPADDING", (0, 0), (-1, -1), 4),
                ("TOPPADDING", (0, 0), (-1, -1), 4),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ]
        )
    )
    story.extend([Spacer(1, 4), table, Spacer(1, 8)])


def markdown_to_flowables(markdown_path: Path, doc_width: float, styles: dict) -> list:
    lines = markdown_path.read_text(encoding="utf-8").splitlines()
    story: list = []
    table_rows: List[List[str]] = []
    in_fence = False
    fence_lines: List[str] = []

    def close_table() -> None:
        nonlocal table_rows
        flush_table(table_rows, story, doc_width, styles)
        table_rows = []

    for raw in lines:
        line = raw.rstrip()

        if line.strip().startswith("```"):
            close_table()
            if in_fence:
                code = "<br/>".join(html.escape(item) for item in fence_lines)
                story.append(
                    Paragraph(
                        f'<font name="Courier" size="7">{code}</font>',
                        styles["body"],
                    )
                )
                fence_lines = []
                in_fence = False
            else:
                in_fence = True
            continue

        if in_fence:
            fence_lines.append(line)
            continue

        if not line.strip():
            close_table()
            story.append(Spacer(1, 4))
            continue

        if line.strip() == "---":
            close_table()
            story.append(Spacer(1, 10))
            continue

        if "|" in line and line.strip().startswith("|"):
            if is_table_separator(line):
                continue
            table_rows.append(split_table_line(line))
            continue

        close_table()

        if line.startswith("# "):
            story.append(Paragraph(inline_markup(line[2:]), styles["h1"]))
        elif line.startswith("## "):
            story.append(Paragraph(inline_markup(line[3:]), styles["h2"]))
        elif line.startswith("### "):
            story.append(Paragraph(inline_markup(line[4:]), styles["h3"]))
        elif line.startswith("- "):
            story.append(Paragraph(inline_markup(line[2:]), styles["bullet"], bulletText="-"))
        elif re.match(r"^\d+\.\s+", line):
            match = re.match(r"^(\d+)\.\s+(.*)", line)
            assert match is not None
            story.append(
                Paragraph(
                    inline_markup(match.group(2)),
                    styles["bullet"],
                    bulletText=f"{match.group(1)}.",
                )
            )
        else:
            story.append(Paragraph(inline_markup(line), styles["body"]))

    close_table()
    return story


def image_block(image_path: Path, caption: str, doc_width: float, max_height: float = 4.8 * inch):
    if not image_path.exists():
        return []
    img = Image(str(image_path))
    ratio = img.imageHeight / float(img.imageWidth)
    width = doc_width
    height = width * ratio
    if height > max_height:
        height = max_height
        width = height / ratio
    img.drawWidth = width
    img.drawHeight = height
    return [
        Spacer(1, 8),
        KeepTogether([img, Paragraph(inline_markup(caption), make_styles()["caption"])]),
    ]


def footer(canvas, doc):
    canvas.saveState()
    canvas.setFont("Helvetica", 7.5)
    canvas.setFillColor(colors.HexColor("#6b7280"))
    canvas.drawString(doc.leftMargin, 0.38 * inch, "Bullenhaus internal operating manual")
    canvas.drawRightString(A4[0] - doc.rightMargin, 0.38 * inch, f"Page {doc.page}")
    canvas.restoreState()


def build_pdf(
    markdown_path: Path,
    output_path: Path,
    title: str,
    subtitle: str,
    screenshots: Sequence[tuple[str, str]],
) -> None:
    styles = make_styles()
    doc = SimpleDocTemplate(
        str(output_path),
        pagesize=A4,
        rightMargin=0.62 * inch,
        leftMargin=0.62 * inch,
        topMargin=0.62 * inch,
        bottomMargin=0.66 * inch,
        title=title,
        author="Bullenhaus",
    )
    story: list = [
        Spacer(1, 0.6 * inch),
        Paragraph(inline_markup(title), styles["title"]),
        Paragraph(inline_markup(subtitle), styles["subtitle"]),
        Paragraph("Generated from the current local Bullenhaus application workspace.", styles["subtitle"]),
        Spacer(1, 0.25 * inch),
    ]

    for filename, caption in screenshots:
        story.extend(image_block(SCREEN_DIR / filename, caption, doc.width, max_height=3.7 * inch))

    story.append(PageBreak())
    story.extend(markdown_to_flowables(markdown_path, doc.width, styles))
    doc.build(story, onFirstPage=footer, onLaterPages=footer)


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    build_pdf(
        ROOT / "docs" / "crm-manual.md",
        OUT_DIR / "bullenhaus-crm-manual.pdf",
        "Bullenhaus CRM Manual",
        "Detailed English operating manual for CRM roles and related workflows.",
        [
            ("crm-agent-dashboard.png", "CRM dashboard screenshot from a local mock agent session."),
            ("trading-login-panel.png", "Unified login panel used by trading and CRM roles."),
        ],
    )
    build_pdf(
        ROOT / "docs" / "trading-platform-manual.md",
        OUT_DIR / "bullenhaus-trading-platform-manual.pdf",
        "Bullenhaus Trading Platform Manual",
        "Detailed English operating manual for clients, trade admins, admins, finance, compliance, support, and technical roles.",
        [
            ("trading-client-dashboard.png", "Client trading dashboard screenshot from a local mock client session."),
            ("trading-admin-dashboard.png", "Trading administration overview screenshot from a local mock admin session."),
            ("trading-login-panel.png", "Public platform login panel and market preview."),
        ],
    )


if __name__ == "__main__":
    main()
