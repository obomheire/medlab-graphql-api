import fitz  # PyMuPDF
from markdownify import markdownify as md
import sys
import io
import re


def pdf_to_markdown_from_stream(input_stream):
    pdf_bytes = input_stream.read()
    pdf_stream = io.BytesIO(pdf_bytes)
    doc = fitz.open(stream=pdf_stream, filetype="pdf")

    html = ""
    for page in doc:
        html += page.get_text("html")

    markdown = md(html)

    # Optional post-processing: Promote bold lines to headers
    markdown = promote_bold_to_headers(markdown)

    return markdown


def promote_bold_to_headers(markdown: str) -> str:
    lines = markdown.split("\n")
    processed = []

    for line in lines:
        # If a line is just bold text, promote it to a header
        # E.g. "**1. Introduction**" => "# 1. Introduction"
        bold_header_match = re.fullmatch(r"\*\*(.+?)\*\*", line.strip())
        if bold_header_match:
            title = bold_header_match.group(1).strip()
            # Decide heading level based on context (simple default: h2)
            if title.lower().startswith("examiner") or title.lower().startswith(
                "question"
            ):
                processed.append(f"### {title}")
            elif re.match(r"^\d+\.", title):
                processed.append(f"## {title}")
            else:
                processed.append(f"# {title}")
        else:
            processed.append(line)

    return "\n".join(processed)


if __name__ == "__main__":
    try:
        markdown = pdf_to_markdown_from_stream(sys.stdin.buffer)
        print(markdown)
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)
