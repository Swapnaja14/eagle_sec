from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    RegisterView, LoginView, logout_view, me_view, update_profile_view,
    SiteListCreateView, ClientListCreateView, employees_view,
    employee_history, departments_view,
)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='auth-register'),
    path('login/', LoginView.as_view(), name='auth-login'),
    path('logout/', logout_view, name='auth-logout'),
    path('refresh/', TokenRefreshView.as_view(), name='auth-refresh'),
    path('me/', me_view, name='auth-me'),
    path('me/update/', update_profile_view, name='auth-update'),
    path('sites/', SiteListCreateView.as_view(), name='sites-list-create'),
    path('clients/', ClientListCreateView.as_view(), name='clients-list-create'),
    path('employees/', employees_view, name='employees-list'),
    path('employees/<int:employee_id>/history/', employee_history, name='employee-history'),
    path('departments/', departments_view, name='departments-list'),
]
