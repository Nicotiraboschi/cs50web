# Generated by Django 4.2.3 on 2023-08-08 08:53

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('network', '0001_initial'),
    ]

    operations = [
        migrations.AlterUniqueTogether(
            name='follower',
            unique_together={('user', 'follower')},
        ),
    ]