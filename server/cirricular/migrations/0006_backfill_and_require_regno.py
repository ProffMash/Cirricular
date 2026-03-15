from django.db import migrations, models


def backfill_reg_no(apps, schema_editor):
    User = apps.get_model('cirricular', 'User')

    # Fill only missing/blank values; use deterministic unique values based on user id.
    for user in User.objects.filter(regNo__isnull=True):
        user.regNo = f"REG-{user.id:06d}"
        user.save(update_fields=['regNo'])

    for user in User.objects.filter(regNo=''):
        user.regNo = f"REG-{user.id:06d}"
        user.save(update_fields=['regNo'])


class Migration(migrations.Migration):

    dependencies = [
        ('cirricular', '0005_user_school'),
    ]

    operations = [
        migrations.RunPython(backfill_reg_no, migrations.RunPython.noop),
        migrations.AlterField(
            model_name='user',
            name='regNo',
            field=models.CharField(max_length=50, unique=True),
        ),
    ]
