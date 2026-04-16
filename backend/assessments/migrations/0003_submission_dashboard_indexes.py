from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("assessments", "0002_quiz_assigned_trainers"),
    ]

    operations = [
        migrations.AlterField(
            model_name="submission",
            name="status",
            field=models.CharField(
                choices=[("in_progress", "In Progress"), ("completed", "Completed"), ("expired", "Expired")],
                db_index=True,
                default="in_progress",
                max_length=20,
            ),
        ),
        migrations.AlterField(
            model_name="submission",
            name="created_at",
            field=models.DateTimeField(auto_now_add=True, db_index=True),
        ),
        migrations.AlterField(
            model_name="submission",
            name="submitted_at",
            field=models.DateTimeField(blank=True, db_index=True, null=True),
        ),
        migrations.AddIndex(
            model_name="submission",
            index=models.Index(fields=["quiz", "created_at"], name="assessments_q_created_371e72_idx"),
        ),
        migrations.AddIndex(
            model_name="submission",
            index=models.Index(fields=["quiz", "status"], name="assessments_q_status_7c9e34_idx"),
        ),
        migrations.AddIndex(
            model_name="submission",
            index=models.Index(fields=["user", "status"], name="assessments_u_status_55d935_idx"),
        ),
    ]
