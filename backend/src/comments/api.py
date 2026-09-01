from django.shortcuts import get_object_or_404
from ninja import File, Form, Router, UploadedFile
from src.comments.models import Comments
from src.comments.schemas import CommentCreateIn, CommentTreeOut

router = Router()


@router.post("/posts/{comment_id}/comments", response=CommentTreeOut)
def post_comment(
    request,
    comment_id: int,
    payload: Form[CommentCreateIn],
    avatar: UploadedFile | None = File(None),  # noqa: B008
    file: UploadedFile | None = File(None),  # noqa: B008
):
    parent_comment = None
    if payload.comment_id:
        parent_comment = get_object_or_404(Comments, id=payload.comment_id)

    comment = Comments.objects.create(
        username=payload.username,
        email=payload.email,
        text=payload.text,
        avatar=avatar,
        file=file,
        parent=parent_comment,
    )

    return comment
