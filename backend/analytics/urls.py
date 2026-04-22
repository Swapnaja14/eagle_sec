from django.urls import path
from . import views

urlpatterns = [
    path("employee/<int:employee_id>/", views.EmployeeProgressView.as_view(), name="analytics-employee"),
    path("trainer/<int:trainer_id>/", views.TrainerPerformanceView.as_view(), name="analytics-trainer"),
    path("summary/", views.OverallSummaryView.as_view(), name="analytics-summary"),
    path("report/", views.analytics_report, name="analytics-report"),
    path("gap-analysis/", views.GapAnalysisView.as_view(), name="analytics-gap"),
]
