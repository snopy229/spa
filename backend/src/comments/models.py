# Create your models here.
from django.core.validators import FileExtensionValidator
from django.db import models


class Comments(models.Model):
    username = models.CharField(max_length=10)
    avatar = models.ImageField(upload_to="avatar/", null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    text = models.TextField()
    email = models.EmailField(null=True, blank=True)
    file = models.FileField(
        upload_to="documents/",
        validators=[
            FileExtensionValidator(
                allowed_extensions=["txt", "jpg", "gif", "png"],
                message="Разрешены только файлы формата TXT, JPG, GIF и PNG.",
            )
        ],
    )
    comment_id = models.ForeignKey(
        "self", on_delete=models.CASCADE, null=True, blank=True, related_name="replies"
    )
