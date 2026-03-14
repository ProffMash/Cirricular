from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('cirricular', '0002_remove_event_image_url'),
    ]

    operations = [
        migrations.AlterField(
            model_name='user',
            name='avatar',
            field=models.URLField(blank=True, max_length=500, null=True),
        ),
    ]
