#!/usr/bin/env python3
"""
Build a client-ready DOCX user manual from the markdown draft.
"""

from __future__ import annotations

import re
from pathlib import Path

from docx import Document
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Cm, Pt


ROOT = Path(__file__).resolve().parents[1]
INPUT_MD = ROOT / "docs" / "software-user-manual-wamo-chat-v1.0-android-zh-hans.md"
OUTPUT_DIR = ROOT / "output" / "doc"
OUTPUT_DOCX = OUTPUT_DIR / "software-user-manual-wamo-chat-v1.0-android-zh-hans.docx"


def set_east_asia_font(run, font_name: str = "宋体", size_pt: int = 11) -> None:
    run.font.name = font_name
    run.font.size = Pt(size_pt)
    run._r.get_or_add_rPr().rFonts.set(qn("w:eastAsia"), font_name)


def apply_global_styles(doc: Document) -> None:
    section = doc.sections[0]
    section.page_width = Cm(21.0)
    section.page_height = Cm(29.7)
    section.left_margin = Cm(2.8)
    section.right_margin = Cm(2.5)
    section.top_margin = Cm(2.5)
    section.bottom_margin = Cm(2.3)

    normal = doc.styles["Normal"]
    normal.font.name = "宋体"
    normal.font.size = Pt(11)
    normal.paragraph_format.line_spacing = 1.5
    normal.paragraph_format.space_before = Pt(0)
    normal.paragraph_format.space_after = Pt(6)
    normal._element.rPr.rFonts.set(qn("w:eastAsia"), "宋体")

    heading_fonts = {
        "Heading 1": (16, "黑体"),
        "Heading 2": (14, "黑体"),
        "Heading 3": (12, "黑体"),
    }
    for style_name, (size, font_name) in heading_fonts.items():
        style = doc.styles[style_name]
        style.font.name = font_name
        style.font.bold = True
        style.font.size = Pt(size)
        style.paragraph_format.line_spacing = 1.3
        style._element.rPr.rFonts.set(qn("w:eastAsia"), font_name)


def add_field(paragraph, field_code: str) -> None:
    begin = OxmlElement("w:fldChar")
    begin.set(qn("w:fldCharType"), "begin")

    instr = OxmlElement("w:instrText")
    instr.set(qn("xml:space"), "preserve")
    instr.text = field_code

    separate = OxmlElement("w:fldChar")
    separate.set(qn("w:fldCharType"), "separate")

    placeholder = OxmlElement("w:t")
    placeholder.text = "1"

    end = OxmlElement("w:fldChar")
    end.set(qn("w:fldCharType"), "end")

    run = paragraph.add_run()
    run._r.append(begin)
    run._r.append(instr)
    run._r.append(separate)
    run._r.append(placeholder)
    run._r.append(end)


def add_header_footer(doc: Document) -> None:
    section = doc.sections[0]

    header = section.header.paragraphs[0]
    header.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    header_run = header.add_run("Wamo Chat V1.0")
    set_east_asia_font(header_run, font_name="宋体", size_pt=10)

    footer = section.footer.paragraphs[0]
    footer.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run_prefix = footer.add_run("第 ")
    set_east_asia_font(run_prefix, font_name="宋体", size_pt=10)
    add_field(footer, "PAGE")
    run_suffix = footer.add_run(" 页")
    set_east_asia_font(run_suffix, font_name="宋体", size_pt=10)


def add_title_page(doc: Document) -> None:
    title = doc.add_paragraph()
    title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = title.add_run("Wamo Chat 软件使用说明书（Android 版）")
    set_east_asia_font(run, font_name="黑体", size_pt=24)
    run.bold = True

    doc.add_paragraph("")
    for text in [
        "软件名称：Wamo Chat",
        "软件版本：V1.0",
        "文档版本：V1.0",
        "编写日期：2026-03-09",
        "适用平台：Android",
    ]:
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        run = p.add_run(text)
        set_east_asia_font(run, font_name="宋体", size_pt=14)

    doc.add_page_break()


def add_toc(doc: Document) -> None:
    heading = doc.add_heading("目录", level=1)
    heading.alignment = WD_ALIGN_PARAGRAPH.CENTER

    p = doc.add_paragraph()
    add_field(p, 'TOC \\o "1-3" \\h \\z \\u')
    hint = doc.add_paragraph("提示：在 Word 中右键目录并选择“更新域”，可刷新页码。")
    hint.alignment = WD_ALIGN_PARAGRAPH.LEFT
    hint_run = hint.runs[0]
    set_east_asia_font(hint_run, font_name="宋体", size_pt=10)

    doc.add_page_break()


def add_markdown_heading(doc: Document, line: str) -> None:
    if line.startswith("### "):
        doc.add_heading(line[4:].strip(), level=3)
    elif line.startswith("## "):
        doc.add_heading(line[3:].strip(), level=2)
    elif line.startswith("# "):
        h = doc.add_heading(line[2:].strip(), level=1)
        h.alignment = WD_ALIGN_PARAGRAPH.CENTER


def add_code_block(doc: Document, block_lines: list[str]) -> None:
    for block_line in block_lines:
        p = doc.add_paragraph(style="No Spacing")
        run = p.add_run(block_line.rstrip("\n"))
        run.font.name = "Consolas"
        run._r.get_or_add_rPr().rFonts.set(qn("w:eastAsia"), "Consolas")
        run.font.size = Pt(10)
        p.paragraph_format.left_indent = Cm(0.8)
        p.paragraph_format.space_after = Pt(2)


def add_image(doc: Document, image_path: Path, caption: str = "") -> None:
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = p.add_run()
    run.add_picture(str(image_path), width=Cm(15.5))
    if caption:
        cap = doc.add_paragraph(caption)
        cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
        set_east_asia_font(cap.runs[0], font_name="宋体", size_pt=10)


def clean_inline_text(text: str) -> str:
    # Keep inline code readable in docx text.
    text = text.replace("`", "")
    return text


def build_docx(md_path: Path, out_path: Path) -> None:
    doc = Document()
    apply_global_styles(doc)
    add_header_footer(doc)
    add_title_page(doc)
    add_toc(doc)

    lines = md_path.read_text(encoding="utf-8").splitlines()
    in_code = False
    code_lines: list[str] = []

    for raw in lines:
        line = raw.rstrip("\n")
        stripped = line.strip()

        if stripped.startswith("```"):
            if not in_code:
                in_code = True
                code_lines = []
            else:
                add_code_block(doc, code_lines)
                in_code = False
            continue

        if in_code:
            code_lines.append(line)
            continue

        if not stripped:
            doc.add_paragraph("")
            continue

        if stripped == "---":
            # Use visual separator instead of hard page break for smoother flow.
            sep = doc.add_paragraph("")
            sep.paragraph_format.space_after = Pt(6)
            continue

        if stripped.startswith("!"):
            m = re.match(r"!\[(.*?)\]\((.*?)\)", stripped)
            if m:
                alt, rel = m.groups()
                image_path = (md_path.parent / rel).resolve()
                if image_path.exists():
                    add_image(doc, image_path, caption=f"图：{alt}")
            continue

        if stripped.startswith("#"):
            add_markdown_heading(doc, stripped)
            continue

        if re.match(r"^\d+\.\s+", stripped):
            text = re.sub(r"^\d+\.\s+", "", stripped)
            p = doc.add_paragraph(clean_inline_text(text), style="List Number")
            for run in p.runs:
                set_east_asia_font(run)
            continue

        if stripped.startswith("- "):
            text = stripped[2:].strip()
            p = doc.add_paragraph(clean_inline_text(text), style="List Bullet")
            for run in p.runs:
                set_east_asia_font(run)
            continue

        p = doc.add_paragraph(clean_inline_text(stripped))
        for run in p.runs:
            set_east_asia_font(run)

        if "截图占位" in stripped:
            tip = doc.add_paragraph("提示：请在此处替换为 Android 端真实功能截图。")
            if tip.runs:
                set_east_asia_font(tip.runs[0], font_name="宋体", size_pt=10)

    out_path.parent.mkdir(parents=True, exist_ok=True)
    doc.save(str(out_path))


def main() -> None:
    build_docx(INPUT_MD, OUTPUT_DOCX)
    print(f"DOCX generated: {OUTPUT_DOCX}")


if __name__ == "__main__":
    main()
