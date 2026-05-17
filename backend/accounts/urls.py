from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    RegisterView,
    LoginView,
    logout_view,
    me_view,
    update_profile_view,

    SiteListCreateView,
    SiteDetailView,

    ClientListCreateView,
    ClientDetailView,

    employees_view,
    employee_history,
    departments_view,

    rbac_list_view,
    rbac_update_view,
    rbac_history_view,

    bulk_upload_preview,
    bulk_upload_create,
    bulk_upload_template,
)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='auth-register'),
    path('login/', LoginView.as_view(), name='auth-login'),
    path('logout/', logout_view, name='auth-logout'),
    path('refresh/', TokenRefreshView.as_view(), name='auth-refresh'),

    path('me/', me_view, name='auth-me'),
    path('me/update/', update_profile_view, name='auth-update'),

    # Sites
    path('sites/', SiteListCreateView.as_view(), name='sites-list-create'),
    path('sites/<int:pk>/', SiteDetailView.as_view(), name='site-detail'),

    # Clients
    path('clients/', ClientListCreateView.as_view(), name='clients-list-create'),
    path('clients/<int:pk>/', ClientDetailView.as_view(), name='client-detail'),

    # Employees
    path('employees/', employees_view, name='employees-list'),
    path(
        'employees/<int:employee_id>/history/',
        employee_history,
        name='employee-history'
    ),

    path('departments/', departments_view, name='departments-list'),

    # RBAC
    path('rbac/', rbac_list_view, name='rbac-list'),
    path('rbac/update/', rbac_update_view, name='rbac-update'),
    path('rbac/history/', rbac_history_view, name='rbac-history'),

    # Bulk Upload
    path(
        'bulk-upload/preview/',
        bulk_upload_preview,
        name='bulk-upload-preview'
    ),

    path(
        'bulk-upload/create/',
        bulk_upload_create,
        name='bulk-upload-create'
    ),

    path(
        'bulk-upload/template/',
        bulk_upload_template,
        name='bulk-upload-template'
    ),
]