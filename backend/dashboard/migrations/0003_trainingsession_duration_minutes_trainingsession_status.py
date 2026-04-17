from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("dashboard", "0002_rename_dashboard_co_tenant__ce78cb_idx_dashboard_c_tenant__dcdc69_idx_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="trainingsession",
            name="duration_minutes",
            field=models.PositiveIntegerField(default=60),
        ),
        migrations.AddField(
            model_name="trainingsession",
            name="status",
            field=models.CharField(
                choices=[("scheduled", "Scheduled"), ("completed", "Completed"), ("cancelled", "Cancelled")],
                db_index=True,
                default="scheduled",
                max_length=20,
            ),
        ),
    ]
