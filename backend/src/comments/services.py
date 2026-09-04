from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from ninja.errors import HttpError
from src.comments.models import Comments
from src.comments.schemas import CommentTreeOut


class CommentsService:
    def _validate_files(self, file, avatar):
        if file and file.content_type not in [
            "text/plain",
            "image/jpeg",
            "image/gif",
            "image/png",
        ]:
            raise HttpError(400, "Разрешены только файлы формата TXT, JPG, GIF и PNG.")
        if file and file.content_type == "text/plain" and file.size > 100 * 1024:
            raise HttpError(400, "Размер файла TXT не должен превышать 100 KB.")

        if avatar and avatar.content_type not in [
            "image/jpeg",
            "image/gif",
            "image/png",
        ]:
            raise HttpError(400, "Разрешены только файлы формата JPG, GIF и PNG.")

    def _send_new_comment(self, comment):

        serialized_comment = CommentTreeOut.model_validate(comment).model_dump(
            mode="json"
        )

        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            "comments",
            {
                "type": "new_comment",
                "comment": serialized_comment,
            },
        )

    def list_comments(self, order_by: str):
        comments = (
            Comments.objects.filter(comment_id__isnull=True)
            .prefetch_related("replies")
            .order_by(order_by)
        )
        return comments

    def create_comment(self, payload, file, avatar):
        self._validate_files(file, avatar)

        parent_id = (
            payload.comment_id
            if payload.comment_id and payload.comment_id > 0
            else None
        )

        comment = Comments.objects.create(
            username=payload.username,
            email=payload.email,
            text=payload.text,
            avatar=avatar,
            file=file,
            comment_id=parent_id,
            home_page=payload.home_page,
        )
        self._send_new_comment(comment)

        return comment
