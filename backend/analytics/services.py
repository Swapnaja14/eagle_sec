"""
Analytics service layer.
All SQL aggregation queries (COUNT, AVG) live here.
Uses Django ORM against the existing models.
"""
from typing import Any, Dict, List, Optional

from django.contrib.auth import get_user_model
from django.db.models import Avg, Count, Q

from assessments.models import Submission
from attendance.models import Attendance
from courses.models import Course
from dashboard.models import TrainingSession

User = get_user_model()


# ---------------------------------------------------------------------------
# Employee Progress
# ---------------------------------------------------------------------------

def get_employee_progress(employee_id: int, tenant=None) -> Optional[Dict[str, Any]]:
    """
    Returns training completion stats and average assessment score
    for a single employee.
    """
    try:
        qs = User.objects.filter(id=employee_id, role="trainee")
        if tenant:
            qs = qs.filter(tenant=tenant)
        employee = qs.get()
    except User.DoesNotExist:
        return None

    submissions = Submission.objects.filter(user=employee)
    total_assigned = submissions.count()
    total_completed = submissions.filter(status="completed").count()
    completion_pct = (total_completed / total_assigned * 100) if total_assigned else 0.0

    avg_score = (
        submissions.filter(status="completed")
        .aggregate(avg=Avg("percentage"))["avg"]
    )

    return {
        "employee_id": employee.id,
        "employee_name": f"{employee.first_name} {employee.last_name}".strip() or employee.username,
        "department": employee.department,
        "total_assigned": total_assigned,
        "total_completed": total_completed,
        "completion_percentage": round(completion_pct, 2),
        "average_assessment_score": round(avg_score, 2) if avg_score is not None else None,
    }


# ---------------------------------------------------------------------------
# Trainer Performance
# ---------------------------------------------------------------------------

def get_trainer_performance(trainer_id: int, tenant=None) -> Optional[Dict[str, Any]]:
    """
    Returns average trainee scores and feedback ratings for a trainer.
    """
    try:
        qs = User.objects.filter(id=trainer_id, role="instructor")
        if tenant:
            qs = qs.filter(tenant=tenant)
        trainer = qs.get()
    except User.DoesNotExist:
        return None

    # Sessions led by this trainer
    sessions = TrainingSession.objects.filter(trainer=trainer, is_active=True)
    if tenant:
        sessions = sessions.filter(tenant=tenant)

    session_ids = list(sessions.values_list("id", flat=True))

    # Unique trainees who attended those sessions
    total_trainees = (
        Attendance.objects.filter(session_id__in=session_ids)
        .values("employee_id")
        .distinct()
        .count()
    )

    # Average assessment score of trainees in those sessions
    trainee_ids = (
        Attendance.objects.filter(session_id__in=session_ids)
        .values_list("employee_id", flat=True)
        .distinct()
    )
    avg_score = (
        Submission.objects.filter(user_id__in=trainee_ids, status="completed")
        .aggregate(avg=Avg("percentage"))["avg"]
    )

    # Average feedback rating
    from feedback.models import Feedback
    avg_rating = (
        Feedback.objects.filter(trainer=trainer)
        .aggregate(avg=Avg("rating"))["avg"]
    )

    return {
        "trainer_id": trainer.id,
        "trainer_name": f"{trainer.first_name} {trainer.last_name}".strip() or trainer.username,
        "total_trainees": total_trainees,
        "average_trainee_score": round(avg_score, 2) if avg_score is not None else None,
        "average_feedback_rating": round(avg_rating, 2) if avg_rating is not None else None,
    }


# ---------------------------------------------------------------------------
# Overall Summary
# ---------------------------------------------------------------------------

def get_overall_summary(tenant=None) -> Dict[str, Any]:
    """Platform-wide aggregated stats."""
    user_qs = User.objects.filter(role="trainee", is_active=True)
    if tenant:
        user_qs = user_qs.filter(tenant=tenant)
    total_employees = user_qs.count()

    session_qs = TrainingSession.objects.filter(is_active=True)
    if tenant:
        session_qs = session_qs.filter(tenant=tenant)
    total_trainings = session_qs.count()
    completed_trainings = session_qs.filter(status="completed").count()
    pending_trainings = session_qs.filter(status__in=["scheduled", "draft"]).count()

    att_qs = Attendance.objects.all()
    if tenant:
        att_qs = att_qs.filter(tenant=tenant)
    total_att = att_qs.count()
    present_att = att_qs.filter(status=Attendance.STATUS_PRESENT).count()
    attendance_pct = (present_att / total_att * 100) if total_att else 0.0

    return {
        "total_employees": total_employees,
        "total_trainings": total_trainings,
        "completed_trainings": completed_trainings,
        "pending_trainings": pending_trainings,
        "attendance_percentage": round(attendance_pct, 2),
    }


# ---------------------------------------------------------------------------
# Bulk helpers for report generation
# ---------------------------------------------------------------------------

def get_all_employee_progress(tenant=None) -> List[Dict[str, Any]]:
    qs = User.objects.filter(role="trainee", is_active=True)
    if tenant:
        qs = qs.filter(tenant=tenant)
    result = []
    for emp in qs:
        data = get_employee_progress(emp.id, tenant=tenant)
        if data:
            result.append(data)
    return result


def get_all_trainer_performance(tenant=None) -> List[Dict[str, Any]]:
    qs = User.objects.filter(role="instructor", is_active=True)
    if tenant:
        qs = qs.filter(tenant=tenant)
    result = []
    for trainer in qs:
        data = get_trainer_performance(trainer.id, tenant=tenant)
        if data:
            result.append(data)
    return result


# ---------------------------------------------------------------------------
# Gap Analysis
# ---------------------------------------------------------------------------

def get_gap_analysis(tenant=None, department: str = "") -> Dict[str, Any]:
    """
    Computes skill/course gap analysis:
    - Per course: passing_threshold (required) vs avg actual score (current)
    - Per department: average gap score
    Returns structured data for the frontend gap analysis page.
    """
    from courses.models import Course, PostAssessment

    course_qs = Course.objects.filter(status="active")
    if tenant:
        course_qs = course_qs.filter(tenant=tenant)

    skill_gaps = []
    for course in course_qs.select_related("post_assessment"):
        # Required threshold from PostAssessment, default 85
        try:
            required = course.post_assessment.passing_threshold
        except Exception:
            required = 85

        # Actual average score from completed submissions for this course
        sub_qs = Submission.objects.filter(
            quiz__course=course,
            status="completed",
        )
        if department:
            sub_qs = sub_qs.filter(user__department__iexact=department)

        avg = sub_qs.aggregate(avg=Avg("percentage"))["avg"]
        current = round(float(avg), 1) if avg is not None else 0.0
        gap = max(0.0, round(required - current, 1))

        skill_gaps.append({
            "skill": course.display_name,
            "course_id": course.id,
            "required": required,
            "current": current,
            "gap": gap,
        })

    # Department gap: avg gap per department
    dept_qs = (
        Submission.objects.filter(status="completed")
    )
    if tenant:
        dept_qs = dept_qs.filter(quiz__tenant=tenant)
    if department:
        dept_qs = dept_qs.filter(user__department__iexact=department)

    dept_rows = dept_qs.values("user__department").annotate(
        avg_score=Avg("percentage"),
        total=Count("id"),
    )

    dept_gaps = []
    for row in dept_rows:
        dept_name = row["user__department"] or "Unassigned"
        avg_score = float(row["avg_score"] or 0)
        # Gap = how far below 85% target
        gap = max(0.0, round(85.0 - avg_score, 1))
        dept_gaps.append({
            "dept": dept_name,
            "avg_score": round(avg_score, 1),
            "gap": gap,
        })

    # Radar data: current score per skill (capped at 100)
    radar_data = [
        {
            "subject": sg["skill"][:12],  # truncate for radar label
            "current": sg["current"],
            "required": sg["required"],
            "fullMark": 100,
        }
        for sg in skill_gaps
    ]

    critical_gaps = [s for s in skill_gaps if s["gap"] >= 20]
    avg_gap = round(
        sum(s["gap"] for s in skill_gaps) / len(skill_gaps), 1
    ) if skill_gaps else 0.0

    return {
        "skill_gaps": skill_gaps,
        "dept_gaps": dept_gaps,
        "radar_data": radar_data,
        "summary": {
            "avg_gap": avg_gap,
            "critical_gaps": len(critical_gaps),
            "skills_assessed": len(skill_gaps),
            "depts_at_risk": len([d for d in dept_gaps if d["gap"] >= 20]),
        },
    }
