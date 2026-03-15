from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('cirricular', '0003_alter_user_avatar'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='regNo',
            field=models.CharField(blank=True, max_length=50, null=True, unique=True),
        ),
    ]