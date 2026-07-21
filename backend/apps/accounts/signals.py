"""Signals de accounts (revoga API Keys ao inativar usuário)."""
from django.contrib.auth import get_user_model
from django.db.models.signals import pre_save
from django.dispatch import receiver
from django.utils import timezone

from .models import ApiKeyPerm

User = get_user_model()


@receiver(pre_save, sender=User)
def revogar_api_keys_ao_inativar(sender, instance, **kwargs):
    """Se o usuário passar a inativo, revoga API Keys permanentes vinculadas."""
    if not instance.pk:
        return
    try:
        anterior = sender.objects.get(pk=instance.pk)
    except sender.DoesNotExist:
        return
    if anterior.is_active and not instance.is_active:
        ApiKeyPerm.objects.filter(
            usuario_id=instance.pk,
            revogado_em__isnull=True,
        ).update(revogado_em=timezone.now())
