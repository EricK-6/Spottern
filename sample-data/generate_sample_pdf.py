"""
Generates a mock BNZ-style bank statement PDF for testing the Textract
ingestion path. Mirrors sample_statement.csv so both paths can be tested
against equivalent data.
"""
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib import colors
from reportlab.lib.units import mm

rows = [
    ["Date", "Description", "Amount", "Balance"],
    ["15 Jun 2026", "COUNTDOWN AUCKLAND CBD", "-87.42", "3120.58"],
    ["15 Jun 2026", "SPARK NZ MOBILE", "-49.99", "3070.59"],
    ["16 Jun 2026", "UBER TRIP", "-18.50", "3052.09"],
    ["17 Jun 2026", "PAK N SAVE MT ALBERT", "-102.10", "2949.99"],
    ["18 Jun 2026", "NETFLIX.COM", "-22.99", "2927.00"],
    ["19 Jun 2026", "MCDONALDS QUEEN ST", "-14.20", "2912.80"],
    ["20 Jun 2026", "SALARY PAYMENT ACME LTD", "+2450.00", "5362.80"],
    ["21 Jun 2026", "CONTACT ENERGY", "-145.30", "5217.50"],
    ["22 Jun 2026", "BUNNINGS WAREHOUSE", "-63.75", "5153.75"],
    ["23 Jun 2026", "SPOTIFY", "-14.99", "5138.76"],
    ["24 Jun 2026", "ELECTRONICS WORLD HK", "-1850.00", "3288.76"],
    ["25 Jun 2026", "GLORIA JEANS COFFEE", "-6.50", "3282.26"],
    ["26 Jun 2026", "PAK N SAVE MT ALBERT", "-95.20", "3187.06"],
    ["27 Jun 2026", "MCDONALDS QUEEN ST", "-14.20", "3172.86"],
    ["27 Jun 2026", "MCDONALDS QUEEN ST", "-14.20", "3158.66"],
    ["28 Jun 2026", "UNKNOWN MERCHANT OVERSEAS", "-499.00", "2659.66"],
    ["29 Jun 2026", "COUNTDOWN AUCKLAND CBD", "-91.30", "2568.36"],
    ["30 Jun 2026", "RENT PAYMENT", "-650.00", "1918.36"],
]

doc = SimpleDocTemplate("sample_statement.pdf", pagesize=A4,
                         topMargin=20*mm, bottomMargin=20*mm)
styles = getSampleStyleSheet()
story = []

story.append(Paragraph("BNZ Bank Statement (Sample / Mock Data)", styles["Title"]))
story.append(Paragraph("Account: ****4821 &nbsp;&nbsp; Period: 1 Jun 2026 to 30 Jun 2026", styles["Normal"]))
story.append(Spacer(1, 12))

table = Table(rows, colWidths=[70*mm, 70*mm, 30*mm, 30*mm])
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
print("Generated sample_statement.pdf")
