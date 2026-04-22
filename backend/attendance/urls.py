from django.urls import path
from . import views

urlpatterns = [
    path("", views.AttendanceListCreateView.as_view(), name="attendance-list"),
    path("<int:pk>/", views.AttendanceDetailView.as_view(), name="attendance-detail"),
    path("summary/", views.attendance_summary, name="attendance-summary"),
]
