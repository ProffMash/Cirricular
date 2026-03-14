from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('cirricular', '0001_initial'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='event',
            name='image_url',
        ),
    ]
