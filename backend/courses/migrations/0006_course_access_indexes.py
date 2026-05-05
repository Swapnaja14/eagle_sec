from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('courses', '0005_course_department'),
    ]

    operations = [
        migrations.AddIndex(
            model_name='course',
            index=models.Index(fields=['tenant', 'department'], name='courses_cou_tenant__5f4b2c_idx'),
        ),
        migrations.AddIndex(
            model_name='course',
            index=models.Index(fields=['tenant', 'department', 'status'], name='courses_cou_tenant__2c8dd1_idx'),
        ),
    ]
