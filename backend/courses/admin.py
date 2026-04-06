from django.contrib import admin
from .models import Course, Lesson, LessonFile, PreAssessment, PostAssessment, Certification


@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ['display_name', 'course_id', 'status', 'compliance_taxonomy', 'tenant', 'created_at']
    list_filter = ['status', 'compliance_taxonomy', 'tenant']
    search_fields = ['display_name', 'course_id']


admin.site.register(Lesson)
admin.site.register(LessonFile)
admin.site.register(PreAssessment)
admin.site.register(PostAssessment)
admin.site.register(Certification)
