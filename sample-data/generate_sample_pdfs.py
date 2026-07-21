"""
Generate BNZ-style statement PDFs from the sample CSVs, so the Textract
ingest path can be tested with the same data as the CSV path. Produces a
Date / Description / Amount / Balance table with "DD Mon YYYY" dates and
signed amounts (debit negative, credit positive) plus a running balance.

Usage:
    python3 generate_sample_pdfs.py
Generates sample_statement_2.pdf and sample_statement_3.pdf next to the CSVs.
"""
import csv
import datetime
import os

from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib import colors
from reportlab.lib.units import mm

HERE = os.path.dirname(os.path.abspath(__file__))


def build_pdf(csv_name, pdf_name, opening_balance, period):
    rows = [["Date", "Description", "Amount", "Balance"]]
    balance = opening_balance
    account_ref = "****0000"

    with open(os.path.join(HERE, csv_name), newline="") as f:
        for r in csv.DictReader(f):
            account_ref = r["accountRef"]
            dt = datetime.date.fromisoformat(r["date"])
            date_str = f"{dt.day} {dt:%b %Y}"          # e.g. "15 May 2026"
            amount = float(r["amount"])
            if r["direction"] == "credit":
                balance += amount
                amount_str = f"+{amount:.2f}"
            else:
                balance -= amount
                amount_str = f"-{amount:.2f}"
            rows.append([date_str, r["merchant"], amount_str, f"{balance:.2f}"])

    doc = SimpleDocTemplate(os.path.join(HERE, pdf_name), pagesize=A4,
                            topMargin=20 * mm, bottomMargin=20 * mm)
    styles = getSampleStyleSheet()
    story = [
        Paragraph("BNZ Bank Statement (Sample / Mock Data)", styles["Title"]),
        Paragraph(f"Account: {account_ref} &nbsp;&nbsp; Period: {period}", styles["Normal"]),
        Spacer(1, 12),
    ]
    table = Table(rows, colWidths=[70 * mm, 70 * mm, 30 * mm, 30 * mm])
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#003DA5")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F2F2F2")]),
        ("ALIGN", (2, 0), (3, -1), "RIGHT"),
    ]))
    story.append(table)
    doc.build(story)
    print(f"Generated {pdf_name}")


if __name__ == "__main__":
    build_pdf("sample_statement_2.csv", "sample_statement_2.pdf", 4200.00, "1 May 2026 to 31 May 2026")
    build_pdf("sample_statement_3.csv", "sample_statement_3.pdf", 9000.00, "1 Apr 2026 to 30 Apr 2026")
