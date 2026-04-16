from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        ("accounts", "0002_alter_user_role"),
    ]

    operations = [
        migrations.CreateModel(
            name="ComplianceAlert",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("department", models.CharField(blank=True, db_index=True, max_length=100)),
                ("site", models.CharField(blank=True, db_index=True, max_length=120)),
                ("behind_percent", models.DecimalField(decimal_places=2, max_digits=5)),
                ("affected_count", models.PositiveIntegerField(default=0)),
                ("severity", models.CharField(choices=[("low", "Low"), ("medium", "Medium"), ("high", "High")], db_index=True, default="medium", max_length=20)),
                ("is_active", models.BooleanField(db_index=True, default=True)),
                ("notified_at", models.DateTimeField(blank=True, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("tenant", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="compliance_alerts", to="accounts.tenant")),
            ],
            options={
                "ordering": ["-behind_percent", "-created_at"],
            },
        ),
        migrations.CreateModel(
            name="TrainingSession",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("topic", models.CharField(max_length=255)),
                ("session_type", models.CharField(choices=[("classroom", "Classroom"), ("virtual", "Virtual")], default="classroom", max_length=20)),
                ("date_time", models.DateTimeField(db_index=True)),
                ("attendee_count", models.PositiveIntegerField(default=0)),
                ("department", models.CharField(blank=True, db_index=True, max_length=100)),
                ("site", models.CharField(blank=True, db_index=True, max_length=120)),
                ("is_active", models.BooleanField(db_index=True, default=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("tenant", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="training_sessions", to="accounts.tenant")),
                ("trainer", models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="training_sessions", to="accounts.user")),
            ],
            options={
                "ordering": ["date_time"],
            },
        ),
        migrations.AddIndex(
            model_name="compliancealert",
            index=models.Index(fields=["tenant", "is_active"], name="dashboard_co_tenant__ce78cb_idx"),
        ),
        migrations.AddIndex(
            model_name="compliancealert",
            index=models.Index(fields=["tenant", "department"], name="dashboard_co_tenant__ca5de4_idx"),
        ),
        migrations.AddIndex(
            model_name="compliancealert",
            index=models.Index(fields=["tenant", "site"], name="dashboard_co_tenant__d10ea8_idx"),
        ),
        migrations.AddIndex(
            model_name="trainingsession",
            index=models.Index(fields=["tenant", "date_time"], name="dashboard_tr_tenant__66f1f6_idx"),
        ),
        migrations.AddIndex(
            model_name="trainingsession",
            index=models.Index(fields=["tenant", "department"], name="dashboard_tr_tenant__97511f_idx"),
        ),
        migrations.AddIndex(
            model_name="trainingsession",
            index=models.Index(fields=["tenant", "site"], name="dashboard_tr_tenant__2f7728_idx"),
        ),
    ]
