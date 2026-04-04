"""
Migration: Add SiteSettings model for payment deadline control.
"""

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('landing', '0002_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='SiteSettings',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('payment_deadline', models.DateField(
                    blank=True,
                    null=True,
                    verbose_name='Fecha límite de pago',
                    help_text=(
                        'Si hoy supera esta fecha y el sitio no está pagado, '
                        'se mostrará la página de mantenimiento automáticamente.'
                    ),
                )),
                ('is_manually_disabled', models.BooleanField(
                    default=False,
                    verbose_name='Deshabilitar manualmente',
                    help_text='Activa esta opción para deshabilitar el sitio de inmediato, sin importar la fecha.',
                )),
                ('maintenance_title', models.CharField(
                    default='Sitio temporalmente no disponible',
                    max_length=200,
                    verbose_name='Título de la página de mantenimiento',
                )),
                ('maintenance_message', models.TextField(
                    default=(
                        'Este sitio web se encuentra temporalmente fuera de servicio. '
                        'Si eres el titular, por favor comunícate con nosotros para regularizar '
                        'el servicio. Disculpa los inconvenientes.'
                    ),
                    verbose_name='Mensaje para los visitantes',
                    help_text='Texto que verán los visitantes cuando el sitio esté inhabilitado.',
                )),
                ('contact_email', models.EmailField(
                    blank=True,
                    verbose_name='Correo de contacto',
                    help_text='Correo que se mostrará en la página de mantenimiento.',
                )),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='Última actualización')),
            ],
            options={
                'verbose_name': 'Configuración del Sitio',
                'verbose_name_plural': 'Configuración del Sitio',
                'db_table': 'landing_site_settings',
            },
        ),
    ]
