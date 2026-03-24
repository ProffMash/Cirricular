from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('cirricular', '0006_backfill_and_require_regno'),
    ]

    operations = [
        migrations.AddField(
            model_name='registration',
            name='is_deleted',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='registration',
            name='deleted_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]
