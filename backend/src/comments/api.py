from ninja import Form, Router
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
def post_comment(request, payload: Form[CommentCreateIn]):
    comment = Comments.objects.create(
        username=payload.username,
        email=payload.email,
        text=payload.text,
        avatar=payload.avatar,
        file=payload.file,
        comment_id=payload.comment_id,
    )

    return comment
