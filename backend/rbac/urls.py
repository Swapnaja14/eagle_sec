from django.urls import path
from . import views

urlpatterns = [
    path('matrix/', views.get_permissions_matrix, name='rbac-matrix'),
    path('update/', views.update_permission, name='rbac-update'),
    path('history/', views.get_change_history, name='rbac-history'),
]
