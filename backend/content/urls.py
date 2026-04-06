from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ContentFileViewSet, TagViewSet

router = DefaultRouter()
router.register(r'files', ContentFileViewSet, basename='content-file')
router.register(r'tags', TagViewSet, basename='content-tag')

urlpatterns = [
    path('', include(router.urls)),
]
