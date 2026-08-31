# Create your models here.
from django.db import models


class Comments(models.Model):
    username = models.CharField(max_length=10)
    avatar = models.ImageField(upload_to="avatar/", null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    text = models.TextField()
    email = models.EmailField(null=True, blank=True)
    parent = models.ForeignKey(
        "self", on_delete=models.CASCADE, null=True, blank=True, related_name="replies"
    )
