from ninja import File, Form, Router, UploadedFile
from src.comments.models import Comments
from src.comments.schemas import CommentCreateIn, CommentTreeOut

router = Router()


@router.get("/comments", response=list[CommentTreeOut])
def get_comments(request):
    comments = (
        Comments.objects.filter(comment_id__isnull=True)
        .prefetch_related("replies")
        .order_by("-created_at")
    )

    return comments


@router.post("/comments", response=CommentTreeOut)
def post_comment(
    request,
    payload: Form[CommentCreateIn],
    file: File[UploadedFile] = None,  # type: ignore
    avatar: File[UploadedFile] = None,
):  # type: ignore

    if file and file.content_type not in [
        "text/plain",
        "image/jpeg",
        "image/gif",
        "image/png",
    ]:
        raise ValueError("Разрешены только файлы формата TXT, JPG, GIF и PNG.")
    if file.content_type == "text/plain" and file.size > 100 * 1024:
        raise ValueError("Размер файла TXT не должен превышать 100 KB.")

    if avatar and avatar.content_type not in ["image/jpeg", "image/gif", "image/png"]:
        raise ValueError("Разрешены только файлы формата JPG, GIF и PNG.")

    parent_id = (
        payload.comment_id if payload.comment_id and payload.comment_id > 0 else None
    )

    comment = Comments.objects.create(
        username=payload.username,
        email=payload.email,
        text=payload.text,
        avatar=avatar,
        file=file,
        comment_id_id=parent_id,
    )

    return comment
