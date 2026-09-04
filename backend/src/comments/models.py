# Create your models here.
import logging

from django.db import models
from PIL import Image

logger = logging.getLogger(__name__)


class Comments(models.Model):
    username = models.CharField(max_length=10)
    avatar = models.ImageField(upload_to="avatar/", null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    text = models.TextField()
    email = models.EmailField(null=True, blank=True)
    home_page = models.URLField(null=True, blank=True)
    file = models.FileField(
        upload_to="file/",
        blank=True,
        null=True,
    )
    comment = models.ForeignKey(
        "self", on_delete=models.CASCADE, null=True, blank=True, related_name="replies"
    )

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)

        if self.file or self.avatar:
            try:
                with Image.open(self.file.path) as img:
                    if img.width > 320 or img.height > 240:
                        img.thumbnail((320, 240))
                        img.save(self.file.path)
            except Exception:
                logger.exception("Error occurred while processing image")
