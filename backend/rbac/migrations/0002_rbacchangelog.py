# Generated migration for audit log

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('rbac', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='RBACChangeLog',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('role', models.CharField(max_length=20)),
                ('permission_code', models.CharField(max_length=50)),
                ('permission_name', models.CharField(max_length=100)),
                ('previous_value', models.BooleanField()),
                ('new_value', models.BooleanField()),
                ('reason', models.TextField()),
                ('timestamp', models.DateTimeField(auto_now_add=True)),
                ('changed_by_username', models.CharField(max_length=150)),
                ('changed_by_name', models.CharField(max_length=200)),
                ('changed_by', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='rbac_changes', to=settings.AUTH_USER_MODEL)),
                ('permission', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, to='rbac.permission')),
            ],
            options={
                'ordering': ['-timestamp'],
            },
        ),
        migrations.AddIndex(
            model_name='rbacchangelog',
            index=models.Index(fields=['-timestamp'], name='rbac_rbacch_timesta_idx'),
        ),
        migrations.AddIndex(
            model_name='rbacchangelog',
            index=models.Index(fields=['role'], name='rbac_rbacch_role_idx'),
        ),
    ]
