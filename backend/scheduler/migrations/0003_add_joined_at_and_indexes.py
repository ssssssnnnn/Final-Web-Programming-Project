
from django.db import migrations, models
import django.utils.timezone


class Migration(migrations.Migration):

    dependencies = [
        ('scheduler', '0002_remove_meetingparticipant_joined_at_and_more'),
    ]

    operations = [

        migrations.AddField(
            model_name='meetingparticipant',
            name='joined_at',
            field=models.DateTimeField(auto_now_add=True, default=django.utils.timezone.now),
            preserve_default=False,
        ),
        

        migrations.AddField(
            model_name='room',
            name='created_at',
            field=models.DateTimeField(auto_now_add=True, default=django.utils.timezone.now),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='room',
            name='updated_at',
            field=models.DateTimeField(auto_now=True),
        ),
        

        migrations.AddField(
            model_name='participant',
            name='created_at',
            field=models.DateTimeField(auto_now_add=True, default=django.utils.timezone.now),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='participant',
            name='updated_at',
            field=models.DateTimeField(auto_now=True),
        ),
        

        migrations.AddField(
            model_name='meeting',
            name='created_at',
            field=models.DateTimeField(auto_now_add=True, default=django.utils.timezone.now),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='meeting',
            name='updated_at',
            field=models.DateTimeField(auto_now=True),
        ),
        

        migrations.AlterField(
            model_name='room',
            name='name',
            field=models.CharField(max_length=100, unique=True),
        ),
        

        migrations.AlterUniqueTogether(
            name='room',
            unique_together={('building', 'room_number')},
        ),
        

        migrations.AddIndex(
            model_name='meeting',
            index=models.Index(fields=['date', 'status'], name='scheduler_m_date_613e7a_idx'),
        ),
        migrations.AddIndex(
            model_name='meeting',
            index=models.Index(fields=['room', 'date'], name='scheduler_m_room_id_09d574_idx'),
        ),
        

        migrations.AlterModelOptions(
            name='meeting',
            options={'ordering': ['-date', '-start_time']},
        ),
        migrations.AlterModelOptions(
            name='participant',
            options={'ordering': ['name']},
        ),
        migrations.AlterModelOptions(
            name='room',
            options={'ordering': ['building', 'name']},
        ),
        migrations.AlterModelOptions(
            name='meetingparticipant',
            options={'ordering': ['participant__name']},
        ),
    ]
