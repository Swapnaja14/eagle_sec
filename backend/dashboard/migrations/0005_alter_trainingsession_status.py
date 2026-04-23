from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("dashboard", "0004_trainingsession_max_participants_trainingsession_meeting_link_and_more"),
    ]

    operations = [
        migrations.AlterField(
            model_name="trainingsession",
            name="status",
            field=models.CharField(
                choices=[("draft", "Draft"), ("scheduled", "Scheduled"), ("completed", "Completed"), ("cancelled", "Cancelled")],
                db_index=True,
                default="scheduled",
                max_length=20,
            ),
        ),
    ]
