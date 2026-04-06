from django.contrib import admin
from .models import ContentFile, Tag


@admin.register(ContentFile)
class ContentFileAdmin(admin.ModelAdmin):
    list_display = ['original_filename', 'file_type', 'status', 'version', 'subject', 'language', 'upload_date']
    list_filter = ['file_type', 'status', 'subject', 'language', 'difficulty']
    search_fields = ['original_filename', 'title', 'description']


@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    list_display = ['name', 'tenant']
    search_fields = ['name']
