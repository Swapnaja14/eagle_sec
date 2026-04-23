"""
Full reseed - trainees linked to sites, varied scores per site/dept.
Run: python seed_hrm_data.py
"""
import sys, os, random, django
from datetime import timedelta

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "learnsphere.settings")
django.setup()

from django.utils import timezone as tz
from django.db import connection
from accounts.models import User, Tenant, Client, Site
from courses.models import Course, PostAssessment, Certification
from assessments.models import Quiz, QuizQuestion, Submission
from questions.models import Question
from dashboard.models import TrainingSession, ComplianceAlert
from attendance.models import Attendance
from feedback.models import Feedback

random.seed(42)

def rpast(days):
    return tz.now() - timedelta(days=random.uniform(1, days))

def months_ago(n):
    return tz.now() - timedelta(days=n * 30 + random.randint(0, 8))

print("Clearing old data...")
Feedback.objects.all().delete()
Attendance.objects.all().delete()
Submission.objects.all().delete()
ComplianceAlert.objects.all().delete()
TrainingSession.objects.all().delete()
QuizQuestion.objects.all().delete()
Quiz.objects.all().delete()
Question.objects.all().delete()
PostAssessment.objects.all().delete()
Certification.objects.all().delete()
Course.objects.all().delete()
User.objects.exclude(role="superadmin").delete()
Site.objects.all().delete()
Client.objects.all().delete()

# Assign superadmin to tenant
tenant, _ = Tenant.objects.get_or_create(
    slug="secureguard",
    defaults={"name": "SecureGuard India", "is_active": True},
)
for su in User.objects.filter(role="superadmin"):
    su.tenant = tenant
    su.save()
    print("Superadmin '{}' -> tenant '{}'".format(su.username, tenant.name))

# Admin
admin = User.objects.create_user(
    username="admin", email="admin@secureguard.com", password="admin123",
    first_name="Admin", last_name="User", role="admin", tenant=tenant, is_staff=True,
)

# Instructors
INSTRUCTOR_DATA = [
    ("rajesh.kumar",  "Rajesh",  "Kumar",  "Security"),
    ("priya.sharma",  "Priya",   "Sharma", "Fire Safety"),
    ("amit.patel",    "Amit",    "Patel",  "Emergency Response"),
    ("sunita.rao",    "Sunita",  "Rao",    "Compliance"),
]
instructors = []
for uname, fn, ln, dept in INSTRUCTOR_DATA:
    u = User.objects.create_user(
        username=uname, email="{}@secureguard.com".format(uname), password="trainer123",
        first_name=fn, last_name=ln, role="instructor", department=dept, tenant=tenant,
    )
    instructors.append(u)
print("Instructors: {}".format(len(instructors)))

# Clients
CLIENT_DATA = [
    ("SecureGuard India",  "contact@secureguard.in",  "Security"),
    ("Sapphire Security",  "info@sapphiresec.com",    "Security"),
    ("RapidShield Corp",   "ops@rapidshield.com",     "Security"),
]
clients = []
for name, email, industry in CLIENT_DATA:
    c = Client.objects.create(tenant=tenant, name=name, contact_email=email, industry=industry, is_active=True)
    clients.append(c)

# Sites with distinct performance profiles
SITE_DATA = [
    # (client_idx, name, city, state, base_score_offset)
    (0, "Mumbai HQ",          "Mumbai",    "Maharashtra", +10),  # best performer
    (0, "Delhi Office",       "Delhi",     "Delhi",        +5),
    (0, "Pune Campus",        "Pune",      "Maharashtra",   0),
    (1, "Bangalore Tech Park","Bangalore", "Karnataka",    +8),
    (1, "Hyderabad Zone",     "Hyderabad", "Telangana",    -5),
    (2, "Chennai Hub",        "Chennai",   "Tamil Nadu",  -10),
    (2, "Kolkata Branch",     "Kolkata",   "West Bengal", -15),  # worst performer
]
sites = []
site_offsets = {}
for ci, name, city, state, offset in SITE_DATA:
    s = Site.objects.create(
        tenant=tenant, client=clients[ci], name=name,
        address="{}, {}".format(city, state), city=city, state=state,
        country="India", is_active=True,
    )
    sites.append(s)
    site_offsets[s.id] = offset
print("Clients: {}  Sites: {}".format(len(clients), len(sites)))

# Trainees - 8 per site = 56 trainees, each linked to a site
DEPARTMENTS = ["Security", "Housekeeping", "Facility Management", "IT", "Maintenance"]
DEPT_BASE = {
    "Security":            72,
    "Housekeeping":        55,
    "Facility Management": 68,
    "IT":                  85,
    "Maintenance":         50,
}
trainees = []
idx = 1
for site in sites:
    for j in range(8):
        dept = DEPARTMENTS[(idx - 1) % len(DEPARTMENTS)]
        u = User.objects.create_user(
            username="trainee{:02d}".format(idx),
            email="trainee{:02d}@secureguard.com".format(idx),
            password="trainee123",
            first_name="Employee", last_name="{:02d}".format(idx),
            role="trainee", department=dept, tenant=tenant,
        )
        # Store site on user via department field trick - use a custom attr
        u._site = site
        u._site_offset = site_offsets[site.id]
        trainees.append(u)
        idx += 1
print("Trainees: {}".format(len(trainees)))

# Courses + PostAssessments
COURSE_DATA = [
    ("PSARA Foundation Course",       85, instructors[0]),
    ("Fire Safety & Evacuation",      80, instructors[1]),
    ("Emergency Response Protocol",   88, instructors[2]),
    ("Access Control Procedures",     80, instructors[0]),
    ("First Aid & CPR Certification", 75, instructors[1]),
    ("Digital Security Awareness",    70, instructors[3]),
    ("Crowd Management Techniques",   82, instructors[2]),
    ("Customer Service Excellence",   70, instructors[3]),
]
courses = []
for title, passing, trainer in COURSE_DATA:
    c = Course.objects.create(
        display_name=title, tenant=tenant, created_by=admin,
        description="Comprehensive training on {}.".format(title),
        status="active",
    )
    PostAssessment.objects.create(course=c, passing_threshold=passing, is_active=True, question_count=10)
    Certification.objects.create(course=c, template="corporate_modern")
    courses.append((c, passing, trainer))
print("Courses: {}".format(len(courses)))

# Questions + Quizzes
quizzes = []
for (course, passing, trainer) in courses:
    q = Question.objects.create(
        tenant=tenant, created_by=admin,
        text="Sample question for {}?".format(course.display_name),
        question_type="mcq",
        options=["Option A", "Option B", "Option C", "Option D"],
        correct_answer="0", points=10,
    )
    quiz = Quiz.objects.create(
        title="{} -- Assessment".format(course.display_name),
        tenant=tenant, course=course, created_by=admin,
        passing_score=passing, time_limit_minutes=30,
        max_attempts=3, is_active=True,
    )
    QuizQuestion.objects.create(quiz=quiz, question=q, order=1, points=10)
    quizzes.append((quiz, passing))
print("Quizzes: {}".format(len(quizzes)))

# Training Sessions - one per site for completed, plus future ones
SESSION_TOPICS = [
    ("PSARA Foundation -- Batch A",   "classroom", instructors[0], "Security",            5),
    ("Fire Safety Drill",             "classroom", instructors[1], "Housekeeping",         4),
    ("Emergency Response Workshop",   "virtual",   instructors[2], "Facility Management",  3),
    ("Access Control Training",       "classroom", instructors[0], "Security",             2),
    ("First Aid Certification",       "classroom", instructors[1], "Maintenance",          1),
    ("Digital Security Webinar",      "virtual",   instructors[3], "IT",                   1),
    ("Crowd Management Seminar",      "classroom", instructors[2], "Security",             0),
    ("Customer Service Workshop",     "virtual",   instructors[3], "Housekeeping",        -1),
    ("PSARA Refresher -- Batch B",    "classroom", instructors[0], "Security",            -2),
    ("Fire Safety Advanced",          "classroom", instructors[1], "Facility Management", -3),
]
sessions = []
for topic, stype, trainer, dept, months_back in SESSION_TOPICS:
    if months_back >= 0:
        dt = months_ago(months_back)
        status = "completed"
    else:
        dt = tz.now() + timedelta(days=abs(months_back) * 14)
        status = "scheduled"
    s = TrainingSession.objects.create(
        topic=topic, tenant=tenant, trainer=trainer,
        session_type=stype, date_time=dt,
        duration_minutes=random.choice([60, 90, 120]),
        attendee_count=random.randint(15, 45),
        max_participants=50, status=status,
        department=dept, is_active=True,
    )
    sessions.append(s)
print("Sessions: {}".format(len(sessions)))

# Submissions - score varies by dept base + site offset
print("Creating submissions...")
submission_rows = []
for trainee in trainees:
    dept_base = DEPT_BASE.get(trainee.department, 65)
    site_offset = getattr(trainee, '_site_offset', 0)
    effective_base = dept_base + site_offset

    selected = random.sample(quizzes, random.randint(3, 5))
    for quiz, passing in selected:
        score_pct = max(10, min(100, effective_base + random.randint(-8, 12)))
        passed = score_pct >= passing
        total_pts = 10
        earned = round(total_pts * score_pct / 100)
        submitted_at = rpast(180)
        started_at = submitted_at - timedelta(minutes=random.randint(15, 45))

        sub = Submission(
            user=trainee, quiz=quiz, attempt_number=1,
            score=earned, total_points=total_pts,
            percentage=score_pct, passed=passed,
            status="completed",
            started_at=started_at,
            submitted_at=submitted_at,
            time_taken_seconds=random.randint(900, 2700),
        )
        sub.save()
        submission_rows.append((sub.id, submitted_at))

# Backdate created_at via raw SQL
with connection.cursor() as cursor:
    for sub_id, dt in submission_rows:
        cursor.execute(
            "UPDATE assessments_submission SET created_at=%s, updated_at=%s WHERE id=%s",
            [dt, dt, sub_id],
        )
print("Submissions: {} (backdated 6 months)".format(len(submission_rows)))

# Attendance - link trainees to sessions via their site
att_count = 0
completed_sessions = [s for s in sessions if s.status == "completed"]
for session in completed_sessions:
    pool = random.sample(trainees, min(random.randint(10, 18), len(trainees)))
    for trainee in pool:
        status = random.choices(
            [Attendance.STATUS_PRESENT, Attendance.STATUS_ABSENT, Attendance.STATUS_LATE],
            weights=[78, 12, 10],
        )[0]
        att_date = session.date_time.date()
        Attendance.objects.get_or_create(
            employee=trainee, session=session, date=att_date,
            defaults={"tenant": tenant, "status": status},
        )
        att_count += 1
print("Attendance: {}".format(att_count))

# Feedback
fb_count = 0
COMMENTS = [
    "Very informative session.",
    "Trainer explained concepts clearly.",
    "Good practical examples.",
    "Could use more hands-on exercises.",
    "Excellent delivery and pace.",
    "Needs more real-world scenarios.",
]
for session in completed_sessions:
    attendees = Attendance.objects.filter(
        session=session, status=Attendance.STATUS_PRESENT
    ).select_related("employee")[:8]
    for att in attendees:
        if not Feedback.objects.filter(trainee=att.employee, session=session).exists():
            Feedback.objects.create(
                tenant=tenant, trainee=att.employee,
                trainer=session.trainer, session=session,
                rating=random.randint(3, 5),
                comments=random.choice(COMMENTS),
            )
            fb_count += 1
print("Feedback: {}".format(fb_count))

# Compliance Alerts - per site with varied severity
ALERTS = [
    ("Housekeeping",        "Kolkata Branch",    "42.00", 14, "high"),
    ("Maintenance",         "Chennai Hub",        "38.00",  9, "high"),
    ("Security",            "Mumbai HQ",          "8.50",   3, "low"),
    ("Facility Management", "Hyderabad Zone",     "25.00",  8, "high"),
    ("IT",                  "Bangalore Tech Park", "5.00",  2, "low"),
    ("Security",            "Pune Campus",        "18.00",  5, "medium"),
    ("Housekeeping",        "Delhi Office",       "12.00",  4, "medium"),
]
for dept, site, behind, affected, severity in ALERTS:
    ComplianceAlert.objects.create(
        tenant=tenant, department=dept, site=site,
        behind_percent=behind, affected_count=affected,
        severity=severity, is_active=True,
    )
print("Compliance Alerts: {}".format(len(ALERTS)))

# Final summary
print("\n" + "=" * 55)
print("SEED COMPLETE")
print("=" * 55)
print("  Users:       {}".format(User.objects.count()))
print("  Clients:     {}".format(Client.objects.count()))
print("  Sites:       {}".format(Site.objects.count()))
print("  Courses:     {}".format(Course.objects.filter(status="active").count()))
print("  Quizzes:     {}".format(Quiz.objects.count()))
print("  Submissions: {}".format(Submission.objects.count()))
print("  Sessions:    {}".format(TrainingSession.objects.count()))
print("  Attendance:  {}".format(Attendance.objects.count()))
print("  Feedback:    {}".format(Feedback.objects.count()))
print("  Alerts:      {}".format(ComplianceAlert.objects.count()))

# Quick verify
from dashboard.services import get_department_completion
from django.http import QueryDict
superadmin = User.objects.filter(role="superadmin").first()
params = QueryDict("from=2025-10-01&to=2026-04-30")
dept = get_department_completion(superadmin, params)
print("\nDept completion (all sites):")
for d in dept:
    print("  {:<25} {:.1f}%".format(d["department"], d["actual_percent"]))

print("\nLogin credentials:")
print("  Admin:   admin        / admin123")
print("  Trainer: rajesh.kumar / trainer123")
print("  Trainee: trainee01    / trainee123")
