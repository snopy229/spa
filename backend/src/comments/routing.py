from django.urls import path
from src.comments.consumers import CommentsConsumer

ws_urlpatterns = [path("ws/comments/", CommentsConsumer.as_asgi())]
