from datetime import datetime, timedelta, timezone as dt_timezone
from decimal import Decimal
from django.db.models import Avg, Count, Q
from django.db.models.functions import TruncMonth, TruncQuarter
from django.utils import timezone
from assessments.models import Submission
from .models import TrainingSession, ComplianceAlert


def _parse_date_range(params):
    now = timezone.now()
    date_from_raw = params.get("from")
    date_to_raw = params.get("to")

    if date_from_raw and date_to_raw:
        try:
            start = datetime.fromisoformat(date_from_raw)
            end = datetime.fromisoformat(date_to_raw)
            if timezone.is_naive(start):
                start = timezone.make_aware(start, dt_timezone.utc)
            if timezone.is_naive(end):
                end = timezone.make_aware(end, dt_timezone.utc)
            if end < start:
                start, end = end, start
            return start, end
        except ValueError:
            pass

    return now - timedelta(days=30), now


def _scope_submissions(user, params, start, end):
    qs = Submission.objects.select_related("user", "quiz", "quiz__tenant").filter(created_at__gte=start, created_at__lte=end)

    if user.role != "superadmin":
        qs = qs.filter(quiz__tenant=user.tenant)
    elif params.get("tenant"):
        qs = qs.filter(quiz__tenant_id=params.get("tenant"))

    if params.get("department"):
        qs = qs.filter(user__department__iexact=params.get("department"))

    # Site is currently optional and not modeled on submissions;
    # accepted as filter input for forward compatibility.
    return qs


def _scope_sessions(user, params):
    qs = TrainingSession.objects.select_related("trainer", "tenant").filter(is_active=True)
    if user.role != "superadmin":
        qs = qs.filter(tenant=user.tenant)
    elif params.get("tenant"):
        qs = qs.filter(tenant_id=params.get("tenant"))
    if params.get("department"):
        qs = qs.filter(department__iexact=params.get("department"))
    if params.get("site"):
        qs = qs.filter(site__iexact=params.get("site"))
    return qs


def _scope_alerts(user, params):
    qs = ComplianceAlert.objects.filter(is_active=True)
    if user.role != "superadmin":
        qs = qs.filter(tenant=user.tenant)
    elif params.get("tenant"):
        qs = qs.filter(tenant_id=params.get("tenant"))
    if params.get("department"):
        qs = qs.filter(department__iexact=params.get("department"))
    if params.get("site"):
        qs = qs.filter(site__iexact=params.get("site"))
    return qs


def _metric_values(qs):
    completed = qs.filter(status="completed")
    total_trained = completed.values("user_id").distinct().count()
    avg_score = float((completed.aggregate(v=Avg("percentage"))["v"] or 0.0))
    completed_count = completed.count()
    passed_count = completed.filter(passed=True).count()
    compliance_rate = (passed_count / completed_count * 100.0) if completed_count else 0.0
    pending_certifications = completed.filter(passed=False).values("user_id").distinct().count()
    return {
        "total_trained": total_trained,
        "avg_score": round(avg_score, 2),
        "compliance_rate": round(compliance_rate, 2),
        "pending_certifications": pending_certifications,
    }


def _delta_payload(current, previous, key, decrease_is_good=False):
    curr = Decimal(str(current[key]))
    prev = Decimal(str(previous[key]))
    if prev == 0:
        diff = Decimal("0")
    else:
        diff = ((curr - prev) / prev) * Decimal("100")
    trend_up = diff >= 0
    if decrease_is_good:
        trend_up = diff <= 0
    return {
        "value": float(curr),
        "delta": f"{diff:+.1f}%",
        "trend_up": trend_up,
    }


def get_dashboard_summary(user, params):
    start, end = _parse_date_range(params)
    qs = _scope_submissions(user, params, start, end)
    current = _metric_values(qs)

    duration = end - start
    prev_end = start
    prev_start = start - duration
    prev_qs = _scope_submissions(user, params, prev_start, prev_end)
    previous = _metric_values(prev_qs)

    return {
        "total_trained": _delta_payload(current, previous, "total_trained"),
        "avg_score": _delta_payload(current, previous, "avg_score"),
        "compliance_rate": _delta_payload(current, previous, "compliance_rate"),
        "pending_certifications": _delta_payload(current, previous, "pending_certifications", decrease_is_good=True),
        "filters": {
            "from": start.isoformat(),
            "to": end.isoformat(),
            "tenant": params.get("tenant"),
            "site": params.get("site"),
            "department": params.get("department"),
        },
    }


def get_department_completion(user, params):
    range_value = params.get("range", "30d")
    end = timezone.now()
    if range_value == "quarter":
        start = end - timedelta(days=90)
    elif range_value == "ytd":
        start = datetime(end.year, 1, 1, tzinfo=end.tzinfo)
    else:
        start = end - timedelta(days=30)

    qs = _scope_submissions(user, params, start, end).filter(status="completed")
    grouped = qs.values("user__department").annotate(
        completed_count=Count("id"),
        passed_count=Count("id", filter=Q(passed=True)),
    )

    data = []
    target = 90.0
    for row in grouped:
        dept = row["user__department"] or "Unassigned"
        completed = row["completed_count"] or 0
        passed = row["passed_count"] or 0
        actual = (passed / completed * 100.0) if completed else 0.0
        data.append({
            "department": dept,
            "actual_percent": round(actual, 2),
            "target_percent": target,
        })
    return data


def get_training_trend(user, params):
    grouping = params.get("grouping", "month")
    start, end = _parse_date_range(params)
    qs = _scope_submissions(user, params, start, end)

    trunc = TruncQuarter("created_at") if grouping == "quarter" else TruncMonth("created_at")
    enrolled = qs.annotate(period=trunc).values("period").annotate(v=Count("id"))
    completed = qs.filter(status="completed").annotate(period=trunc).values("period").annotate(v=Count("id"))

    enrolled_map = {row["period"]: row["v"] for row in enrolled}
    completed_map = {row["period"]: row["v"] for row in completed}
    periods = sorted(set(enrolled_map.keys()) | set(completed_map.keys()))

    payload = []
    for p in periods:
        if grouping == "quarter":
            quarter = ((p.month - 1) // 3) + 1
            label = f"{p.year}-Q{quarter}"
        else:
            label = p.strftime("%b")
        payload.append({
            "month": label,
            "enrolled": enrolled_map.get(p, 0),
            "completed": completed_map.get(p, 0),
        })
    return payload


def get_upcoming_sessions(user, params):
    qs = _scope_sessions(user, params).filter(date_time__gte=timezone.now())
    ordering = params.get("ordering", "date_time")
    limit = int(params.get("limit", 10))
    if ordering not in {"date_time", "-date_time", "attendee_count", "-attendee_count"}:
        ordering = "date_time"
    limit = min(max(limit, 1), 100)

    qs = qs.order_by(ordering)[:limit]
    data = []
    for s in qs:
        trainer_name = ""
        if s.trainer:
            trainer_name = f"{s.trainer.first_name} {s.trainer.last_name}".strip() or s.trainer.username
        data.append({
            "id": s.id,
            "type": s.session_type,
            "topic": s.topic,
            "date_time": s.date_time.isoformat(),
            "trainer_name": trainer_name,
            "attendee_count": s.attendee_count,
        })
    return data


def get_compliance_alerts(user, params):
    qs = _scope_alerts(user, params).order_by("-behind_percent", "-created_at")
    data = []
    for a in qs:
        data.append({
            "id": a.id,
            "department": a.department,
            "site": a.site,
            "behind_percent": float(a.behind_percent),
            "severity": a.severity,
            "affected_count": a.affected_count,
            "notified_at": a.notified_at.isoformat() if a.notified_at else None,
        })
    return data


def get_recent_training_history(user, params):
    limit = int(params.get("limit", 5))
    limit = min(max(limit, 1), 100)

    start, end = _parse_date_range(params)
    qs = _scope_submissions(user, params, start, end).select_related("user", "quiz").order_by("-created_at")[:limit]
    rows = []
    for s in qs:
        rows.append({
            "employee_name": f"{s.user.first_name} {s.user.last_name}".strip() or s.user.username,
            "employee_id": s.user.username,
            "module_name": s.quiz.title,
            "session_date": (s.submitted_at or s.created_at).isoformat(),
            "score": s.percentage if s.status == "completed" else None,
            "status": "passed" if s.passed and s.status == "completed" else ("failed" if s.status == "completed" else s.status),
        })
    return rows


def get_dashboard_overview(user, params):
    return {
        "cards": get_dashboard_summary(user, params),
        "department_completion": get_department_completion(user, params),
        "monthly_trend": get_training_trend(user, params),
        "upcoming_sessions": get_upcoming_sessions(user, params),
        "compliance_alerts": get_compliance_alerts(user, params),
        "recent_history": get_recent_training_history(user, params),
    }
