from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("dashboard", "0003_trainingsession_duration_minutes_trainingsession_status"),
    ]

    operations = [
        migrations.AddField(
            model_name="trainingsession",
            name="max_participants",
            field=models.PositiveIntegerField(default=30),
        ),
        migrations.AddField(
            model_name="trainingsession",
            name="meeting_link",
            field=models.URLField(blank=True),
        ),
        migrations.AddField(
            model_name="trainingsession",
            name="notes",
            field=models.TextField(blank=True),
        ),
        migrations.AddField(
            model_name="trainingsession",
            name="platform",
            field=models.CharField(blank=True, max_length=50),
        ),
        migrations.AddField(
            model_name="trainingsession",
            name="venue",
            field=models.CharField(blank=True, max_length=255),
        ),
    ]
