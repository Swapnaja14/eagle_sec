from django.urls import path
from . import views

urlpatterns = [
    path("templates/",          views.TemplateListCreateView.as_view(), name="cert-template-list"),
    path("templates/<int:pk>/", views.TemplateDetailView.as_view(),     name="cert-template-detail"),
    path("generate/",           views.GenerateCertificateView.as_view(),name="certificate-generate"),
    path("my/",                 views.my_certificates,                  name="certificate-my"),
    path("<int:cert_id>/",      views.CertificateDetailView.as_view(),  name="certificate-detail"),
    path("<int:cert_id>/download/",     views.download_certificate,     name="certificate-download"),
    path("<int:cert_id>/download/pdf/", views.download_certificate_pdf, name="certificate-download-pdf"),
    path("<int:cert_id>/download/png/", views.download_certificate_png, name="certificate-download-png"),
    path("employee/<int:employee_id>/", views.employee_certificates,    name="certificate-employee"),
]
