"""
PDF generation utilities using ReportLab.
Used by the analytics and certificates apps.
"""
import os
from datetime import datetime
from typing import Any, Dict, List

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib.enums import TA_CENTER
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    HRFlowable,
)

from django.conf import settings as django_settings

CERTIFICATES_DIR = getattr(django_settings, "CERTIFICATES_DIR", "certificates")


def _ensure_dir(path: str) -> None:
    os.makedirs(path, exist_ok=True)


# ---------------------------------------------------------------------------
# Certificate PDF
# ---------------------------------------------------------------------------

def generate_certificate_pdf(
    employee_name: str,
    course_name: str,
    completion_date: datetime,
    certificate_id: int,
) -> str:
    """
    Generate a course completion certificate PDF.
    Returns the absolute file path where the PDF is saved.
    """
    _ensure_dir(CERTIFICATES_DIR)
    ts = int(completion_date.timestamp()) if hasattr(completion_date, "timestamp") else 0
    filename = f"certificate_{certificate_id}_{ts}.pdf"
    filepath = os.path.join(CERTIFICATES_DIR, filename)

    doc = SimpleDocTemplate(
        filepath,
        pagesize=landscape(A4),
        rightMargin=2 * cm,
        leftMargin=2 * cm,
        topMargin=2 * cm,
        bottomMargin=2 * cm,
    )

    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        "CertTitle",
        parent=styles["Title"],
        fontSize=36,
        textColor=colors.HexColor("#1a3c5e"),
        alignment=TA_CENTER,
        spaceAfter=10,
    )
    subtitle_style = ParagraphStyle(
        "CertSubtitle",
        parent=styles["Normal"],
        fontSize=16,
        textColor=colors.HexColor("#555555"),
        alignment=TA_CENTER,
        spaceAfter=6,
    )
    name_style = ParagraphStyle(
        "CertName",
        parent=styles["Normal"],
        fontSize=28,
        textColor=colors.HexColor("#c0392b"),
        alignment=TA_CENTER,
        spaceAfter=10,
        fontName="Helvetica-Bold",
    )
    body_style = ParagraphStyle(
        "CertBody",
        parent=styles["Normal"],
        fontSize=14,
        textColor=colors.HexColor("#333333"),
        alignment=TA_CENTER,
        spaceAfter=6,
    )
    small_style = ParagraphStyle(
        "CertSmall",
        parent=styles["Normal"],
        fontSize=10,
        textColor=colors.HexColor("#888888"),
        alignment=TA_CENTER,
    )

    if hasattr(completion_date, "strftime"):
        formatted_date = completion_date.strftime("%B %d, %Y")
    else:
        formatted_date = str(completion_date)

    story = [
        Spacer(1, 1 * cm),
        Paragraph("Certificate of Completion", title_style),
        HRFlowable(width="80%", thickness=2, color=colors.HexColor("#1a3c5e")),
        Spacer(1, 0.5 * cm),
        Paragraph("This is to certify that", subtitle_style),
        Spacer(1, 0.3 * cm),
        Paragraph(employee_name, name_style),
        Spacer(1, 0.3 * cm),
        Paragraph("has successfully completed the course", body_style),
        Spacer(1, 0.3 * cm),
        Paragraph(f"<b>{course_name}</b>", body_style),
        Spacer(1, 0.5 * cm),
        Paragraph(f"Date of Completion: {formatted_date}", body_style),
        Spacer(1, 1 * cm),
        HRFlowable(width="40%", thickness=1, color=colors.HexColor("#aaaaaa")),
        Spacer(1, 0.2 * cm),
        Paragraph("Authorized Signature", small_style),
        Spacer(1, 0.5 * cm),
        Paragraph(f"Certificate ID: #{certificate_id}", small_style),
    ]

    doc.build(story)
    return filepath


# ---------------------------------------------------------------------------
# Analytics Report PDF
# ---------------------------------------------------------------------------

def generate_analytics_report_pdf(
    summary: Dict[str, Any],
    employee_progress: List[Dict[str, Any]],
    trainer_performance: List[Dict[str, Any]],
) -> str:
    """
    Generate a full analytics report PDF.
    Returns the absolute file path.
    """
    reports_dir = os.path.join(CERTIFICATES_DIR, "reports")
    _ensure_dir(reports_dir)
    timestamp = int(datetime.utcnow().timestamp())
    filename = f"analytics_report_{timestamp}.pdf"
    filepath = os.path.join(reports_dir, filename)

    doc = SimpleDocTemplate(
        filepath,
        pagesize=A4,
        rightMargin=2 * cm,
        leftMargin=2 * cm,
        topMargin=2 * cm,
        bottomMargin=2 * cm,
    )

    styles = getSampleStyleSheet()
    h1 = ParagraphStyle(
        "H1", parent=styles["Heading1"],
        fontSize=20, textColor=colors.HexColor("#1a3c5e"), spaceAfter=12,
    )
    h2 = ParagraphStyle(
        "H2", parent=styles["Heading2"],
        fontSize=14, textColor=colors.HexColor("#2c3e50"), spaceAfter=8,
    )
    normal = styles["Normal"]

    def make_table(headers: List[str], rows: List[List[Any]]) -> Table:
        data = [headers] + rows
        t = Table(data, repeatRows=1)
        t.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1a3c5e")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, 0), 10),
            ("ALIGN", (0, 0), (-1, -1), "CENTER"),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f2f2f2")]),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#cccccc")),
            ("FONTSIZE", (0, 1), (-1, -1), 9),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
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
                ["Total Employees", summary.get("total_employees", 0)],
                ["Total Trainings", summary.get("total_trainings", 0)],
                ["Completed Trainings", summary.get("completed_trainings", 0)],
                ["Pending Trainings", summary.get("pending_trainings", 0)],
                ["Attendance %", f"{summary.get('attendance_percentage', 0):.1f}%"],
            ],
        ),
        Spacer(1, 0.5 * cm),
        Paragraph("Employee Progress", h2),
    ]

    if employee_progress:
        ep_rows = [
            [
                r.get("employee_name", ""),
                r.get("total_assigned", 0),
                r.get("total_completed", 0),
                f"{r.get('completion_percentage', 0):.1f}%",
                f"{r.get('average_assessment_score') or 0:.1f}",
            ]
            for r in employee_progress
        ]
        story.append(
            make_table(
                ["Employee", "Assigned", "Completed", "Completion %", "Avg Score"],
                ep_rows,
            )
        )
    else:
        story.append(Paragraph("No employee data available.", normal))

    story += [
        Spacer(1, 0.5 * cm),
        Paragraph("Trainer Performance", h2),
    ]

    if trainer_performance:
        tp_rows = [
            [
                r.get("trainer_name", ""),
                r.get("total_trainees", 0),
                f"{r.get('average_trainee_score') or 0:.1f}",
                f"{r.get('average_feedback_rating') or 0:.1f}",
            ]
            for r in trainer_performance
        ]
        story.append(
            make_table(
                ["Trainer", "Trainees", "Avg Score", "Avg Rating"],
                tp_rows,
            )
        )
    else:
        story.append(Paragraph("No trainer data available.", normal))

    doc.build(story)
    return filepath
