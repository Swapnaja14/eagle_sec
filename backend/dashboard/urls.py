from django.urls import path
from .views import (
    DashboardSummaryView,
    DepartmentCompletionView,
    TrainingTrendView,
    UpcomingSessionsView,
    ComplianceAlertsView,
    ComplianceAlertNotifyView,
    RecentTrainingHistoryView,
    DashboardOverviewView,
    TraineeDashboardView,
)


urlpatterns = [
    path("dashboard/summary/", DashboardSummaryView.as_view(), name="dashboard-summary"),
    path("dashboard/department-completion/", DepartmentCompletionView.as_view(), name="dashboard-department-completion"),
    path("dashboard/training-trend/", TrainingTrendView.as_view(), name="dashboard-training-trend"),
    path("sessions/upcoming/", UpcomingSessionsView.as_view(), name="sessions-upcoming"),
    path("dashboard/compliance-alerts/", ComplianceAlertsView.as_view(), name="dashboard-compliance-alerts"),
    path("dashboard/compliance-alerts/<int:alert_id>/notify/", ComplianceAlertNotifyView.as_view(), name="dashboard-compliance-alert-notify"),
    path("training-history/recent/", RecentTrainingHistoryView.as_view(), name="training-history-recent"),
    path("dashboard/overview/", DashboardOverviewView.as_view(), name="dashboard-overview"),
    path("trainee/dashboard/", TraineeDashboardView.as_view(), name="trainee-dashboard"),
]
