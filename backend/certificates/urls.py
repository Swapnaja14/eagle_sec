from django.urls import path
from . import views

urlpatterns = [
    path("generate/", views.GenerateCertificateView.as_view(), name="certificate-generate"),
    path("<int:cert_id>/", views.CertificateDetailView.as_view(), name="certificate-detail"),
    path("<int:cert_id>/download/", views.download_certificate, name="certificate-download"),
    path("employee/<int:employee_id>/", views.employee_certificates, name="certificate-employee"),
]
