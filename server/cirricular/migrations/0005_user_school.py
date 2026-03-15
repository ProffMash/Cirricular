from django.db import migrations, models


def set_default_school(apps, schema_editor):
	User = apps.get_model('cirricular', 'User')
	User.objects.filter(school__isnull=True).update(school='SPAS')


class Migration(migrations.Migration):

	dependencies = [
		('cirricular', '0004_user_regno'),
	]

	operations = [
		migrations.AddField(
			model_name='user',
			name='school',
			field=models.CharField(
				choices=[
					('SPAS', 'SPAS'),
					('Education', 'Education'),
					('Health Science', 'Health Science'),
					('Bussiness', 'Bussiness'),
					('Engineering', 'Engineering'),
				],
				default='SPAS',
				max_length=50,
			),
			preserve_default=False,
		),
		migrations.RunPython(set_default_school, migrations.RunPython.noop),
	]