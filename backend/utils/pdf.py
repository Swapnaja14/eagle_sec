"""
PDF + PNG generation utilities using ReportLab and Pillow.
Used by the analytics and certificates apps.
"""
import os
from datetime import datetime
from typing import Any, Dict, List, Optional

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable, Image,
)

from django.conf import settings as django_settings

CERTIFICATES_DIR = str(getattr(django_settings, "CERTIFICATES_DIR", "certificates"))

# ── Theme colour palettes ─────────────────────────────────────────────────────
THEMES: Dict[str, Dict[str, str]] = {
    "corporate_blue": {
        "primary":    "#1a3c5e",
        "accent":     "#2563eb",
        "name_color": "#c0392b",
        "text":       "#333333",
        "muted":      "#888888",
        "rule":       "#1a3c5e",
    },
    "corporate_dark": {
        "primary":    "#0f172a",
        "accent":     "#38bdf8",
        "name_color": "#38bdf8",
        "text":       "#1e293b",
        "muted":      "#64748b",
        "rule":       "#0f172a",
    },
    "minimalist": {
        "primary":    "#111827",
        "accent":     "#6b7280",
        "name_color": "#111827",
        "text":       "#374151",
        "muted":      "#9ca3af",
        "rule":       "#d1d5db",
    },
    "academic_formal": {
        "primary":    "#1e3a5f",
        "accent":     "#7c3aed",
        "name_color": "#7c3aed",
        "text":       "#1e293b",
        "muted":      "#64748b",
        "rule":       "#1e3a5f",
    },
    "gold_elegant": {
        "primary":    "#78350f",
        "accent":     "#d97706",
        "name_color": "#92400e",
        "text":       "#1c1917",
        "muted":      "#78716c",
        "rule":       "#d97706",
    },
}


def _ensure_dir(path: str) -> None:
    os.makedirs(path, exist_ok=True)


def _hex(h: str):
    return colors.HexColor(h)


def _resolve_theme(theme_key: Optional[str]) -> Dict[str, str]:
    return THEMES.get(theme_key or "corporate_blue", THEMES["corporate_blue"])


# ---------------------------------------------------------------------------
# Certificate PDF (with optional template)
# ---------------------------------------------------------------------------

def generate_certificate_pdf(
    employee_name: str,
    course_name: str,
    completion_date: datetime,
    certificate_id: int,
    template=None,          # CertificateTemplate ORM instance or None
) -> str:
    """
    Generate a course completion certificate PDF.
    If a CertificateTemplate is provided its fields are used; otherwise defaults apply.
    Returns the absolute file path.
    """
    _ensure_dir(CERTIFICATES_DIR)
    ts = int(completion_date.timestamp()) if hasattr(completion_date, "timestamp") else 0
    filename = f"certificate_{certificate_id}_{ts}.pdf"
    filepath = os.path.join(CERTIFICATES_DIR, filename)

    # ── resolve template fields ───────────────────────────────────────────────
    if template:
        theme_key      = template.theme
        heading_text   = template.heading_text or "Certificate of Completion"
        sub_heading    = template.sub_heading  or "This is to certify that"
        body_text      = (template.body_text or "has successfully completed the course")
        footer_text    = template.footer_text  or ""
        trainer_name   = template.trainer_name or ""
        trainer_title  = template.trainer_title or "Authorized Trainer"
        company_name   = template.company_name or ""
        use_landscape  = template.layout == "landscape"
        logo_path      = template.company_logo.path if template.company_logo else None
        sig_path       = template.trainer_signature.path if template.trainer_signature else None
    else:
        theme_key      = "corporate_blue"
        heading_text   = "Certificate of Completion"
        sub_heading    = "This is to certify that"
        body_text      = "has successfully completed the course"
        footer_text    = ""
        trainer_name   = ""
        trainer_title  = "Authorized Trainer"
        company_name   = ""
        use_landscape  = True
        logo_path      = None
        sig_path       = None

    palette = _resolve_theme(theme_key)
    pagesize = landscape(A4) if use_landscape else A4

    # Replace placeholders in body_text
    formatted_date = completion_date.strftime("%B %d, %Y") if hasattr(completion_date, "strftime") else str(completion_date)
    body_text = (
        body_text
        .replace("{{employee_name}}", employee_name)
        .replace("{{course_name}}", course_name)
        .replace("{{date}}", formatted_date)
    )

    doc = SimpleDocTemplate(
        filepath, pagesize=pagesize,
        rightMargin=2 * cm, leftMargin=2 * cm,
        topMargin=2 * cm, bottomMargin=2 * cm,
    )

    styles = getSampleStyleSheet()

    def _style(name, size, color_hex, bold=False, after=6):
        return ParagraphStyle(
            name, parent=styles["Normal"],
            fontSize=size,
            textColor=_hex(color_hex),
            alignment=TA_CENTER,
            spaceAfter=after,
            fontName="Helvetica-Bold" if bold else "Helvetica",
        )

    story = [Spacer(1, 0.6 * cm)]

    # Company logo
    if logo_path and os.path.exists(logo_path):
        story.append(Image(logo_path, width=4 * cm, height=2 * cm))
        story.append(Spacer(1, 0.3 * cm))

    # Company name
    if company_name:
        story.append(Paragraph(company_name, _style("Co", 13, palette["muted"])))
        story.append(Spacer(1, 0.2 * cm))

    # Heading
    story += [
        Paragraph(heading_text, _style("H", 34, palette["primary"], bold=True, after=10)),
        HRFlowable(width="80%", thickness=2, color=_hex(palette["rule"])),
        Spacer(1, 0.4 * cm),
        Paragraph(sub_heading, _style("Sub", 15, palette["muted"])),
        Spacer(1, 0.25 * cm),
        Paragraph(employee_name, _style("Name", 28, palette["name_color"], bold=True, after=10)),
        Spacer(1, 0.25 * cm),
        Paragraph(body_text, _style("Body", 13, palette["text"])),
        Spacer(1, 0.25 * cm),
        Paragraph(f"<b>{course_name}</b>", _style("Course", 15, palette["accent"])),
        Spacer(1, 0.4 * cm),
        Paragraph(f"Date of Completion: {formatted_date}", _style("Date", 12, palette["text"])),
        Spacer(1, 0.8 * cm),
    ]

    # Signature block
    if sig_path and os.path.exists(sig_path):
        story.append(Image(sig_path, width=3 * cm, height=1.2 * cm))
    else:
        story.append(HRFlowable(width="30%", thickness=1, color=_hex(palette["muted"])))

    story += [
        Spacer(1, 0.15 * cm),
        Paragraph(trainer_name or "Authorized Signatory", _style("Sig", 11, palette["text"])),
        Paragraph(trainer_title, _style("SigTitle", 9, palette["muted"])),
    ]

    if footer_text:
        story += [Spacer(1, 0.4 * cm), Paragraph(footer_text, _style("Footer", 9, palette["muted"]))]

    story += [
        Spacer(1, 0.3 * cm),
        Paragraph(f"Certificate ID: #{certificate_id}", _style("ID", 9, palette["muted"])),
    ]

    doc.build(story)
    return filepath


# ---------------------------------------------------------------------------
# Certificate PNG export (converts first page of PDF via Pillow)
# ---------------------------------------------------------------------------

def generate_certificate_png(pdf_path: str, certificate_id: int) -> str:
    """
    Convert the certificate PDF to a PNG image using Pillow + pdf2image.
    Falls back to a plain Pillow-drawn PNG if pdf2image is unavailable.
    Returns the PNG file path.
    """
    _ensure_dir(CERTIFICATES_DIR)
    png_path = os.path.join(CERTIFICATES_DIR, f"certificate_{certificate_id}.png")

    try:
        from pdf2image import convert_from_path  # type: ignore
        pages = convert_from_path(pdf_path, dpi=150, first_page=1, last_page=1)
        if pages:
            pages[0].save(png_path, "PNG")
            return png_path
    except Exception:
        pass  # pdf2image not installed — fall back to Pillow

    # Fallback: create a simple PNG with Pillow
    try:
        from PIL import Image as PILImage, ImageDraw, ImageFont  # type: ignore
        W, H = 1122, 794  # A4 landscape at 96dpi approx
        img = PILImage.new("RGB", (W, H), color=(255, 255, 255))
        draw = ImageDraw.Draw(img)
        draw.rectangle([0, 0, W, H], fill=(255, 255, 255))
        draw.rectangle([20, 20, W - 20, H - 20], outline=(26, 60, 94), width=3)
        draw.text((W // 2, 80),  "Certificate of Completion", fill=(26, 60, 94), anchor="mm")
        draw.text((W // 2, 200), "See PDF for full certificate", fill=(100, 100, 100), anchor="mm")
        draw.text((W // 2, H - 40), f"Certificate ID: #{certificate_id}", fill=(150, 150, 150), anchor="mm")
        img.save(png_path, "PNG")
    except Exception:
        pass  # Pillow also unavailable — skip PNG

    return png_path


# ---------------------------------------------------------------------------
# Analytics Report PDF
# ---------------------------------------------------------------------------

def generate_analytics_report_pdf(
    summary: Dict[str, Any],
    employee_progress: List[Dict[str, Any]],
    trainer_performance: List[Dict[str, Any]],
) -> str:
    reports_dir = os.path.join(CERTIFICATES_DIR, "reports")
    _ensure_dir(reports_dir)
    timestamp = int(datetime.utcnow().timestamp())
    filepath = os.path.join(reports_dir, f"analytics_report_{timestamp}.pdf")

    doc = SimpleDocTemplate(
        filepath, pagesize=A4,
        rightMargin=2 * cm, leftMargin=2 * cm,
        topMargin=2 * cm, bottomMargin=2 * cm,
    )
    styles = getSampleStyleSheet()
    h1 = ParagraphStyle("H1", parent=styles["Heading1"], fontSize=20, textColor=_hex("#1a3c5e"), spaceAfter=12)
    h2 = ParagraphStyle("H2", parent=styles["Heading2"], fontSize=14, textColor=_hex("#2c3e50"), spaceAfter=8)
    normal = styles["Normal"]

    def make_table(headers, rows):
        t = Table([headers] + rows, repeatRows=1)
        t.setStyle(TableStyle([
            ("BACKGROUND",   (0, 0), (-1, 0), _hex("#1a3c5e")),
            ("TEXTCOLOR",    (0, 0), (-1, 0), colors.white),
            ("FONTNAME",     (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE",     (0, 0), (-1, 0), 10),
            ("ALIGN",        (0, 0), (-1, -1), "CENTER"),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, _hex("#f2f2f2")]),
            ("GRID",         (0, 0), (-1, -1), 0.5, _hex("#cccccc")),
            ("FONTSIZE",     (0, 1), (-1, -1), 9),
            ("TOPPADDING",   (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING",(0, 0), (-1, -1), 4),
        ]))
        return t

    story = [
        Paragraph("HR & Training Analytics Report", h1),
        Paragraph(f"Generated on: {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}", normal),
        Spacer(1, 0.5 * cm),
        Paragraph("Overall Summary", h2),
        make_table(
            ["Metric", "Value"],
            [
                ["Total Employees",    summary.get("total_employees", 0)],
                ["Total Trainings",    summary.get("total_trainings", 0)],
                ["Completed",          summary.get("completed_trainings", 0)],
                ["Pending",            summary.get("pending_trainings", 0)],
                ["Attendance %",       f"{summary.get('attendance_percentage', 0):.1f}%"],
            ],
        ),
        Spacer(1, 0.5 * cm),
        Paragraph("Employee Progress", h2),
    ]

    if employee_progress:
        story.append(make_table(
            ["Employee", "Assigned", "Completed", "Completion %", "Avg Score"],
            [[r.get("employee_name",""), r.get("total_assigned",0), r.get("total_completed",0),
              f"{r.get('completion_percentage',0):.1f}%", f"{r.get('average_assessment_score') or 0:.1f}"]
             for r in employee_progress],
        ))
    else:
        story.append(Paragraph("No employee data available.", normal))

    story += [Spacer(1, 0.5 * cm), Paragraph("Trainer Performance", h2)]

    if trainer_performance:
        story.append(make_table(
            ["Trainer", "Trainees", "Avg Score", "Avg Rating"],
            [[r.get("trainer_name",""), r.get("total_trainees",0),
              f"{r.get('average_trainee_score') or 0:.1f}", f"{r.get('average_feedback_rating') or 0:.1f}"]
             for r in trainer_performance],
        ))
    else:
        story.append(Paragraph("No trainer data available.", normal))

    doc.build(story)
    return filepath
