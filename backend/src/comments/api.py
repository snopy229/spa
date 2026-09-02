from ninja import File, Form, Router, UploadedFile
from ninja.pagination import PageNumberPagination, paginate
from src.comments.container import comments_service
from src.comments.exceptions import (
    FileTooLargeException,
    InvalidCommentTextException,
    InvalidFileTypeException,
    InvalidHTMLTagsException,
    InvalidUsernameException,
    exception_responses,
)
from src.comments.schemas import SORT_OPTIONS, CommentCreateIn, CommentTreeOut

router = Router()


@router.get("/comments", response=list[CommentTreeOut])
@paginate(PageNumberPagination, page_size=25)
def get_comments(request, order_by: SORT_OPTIONS = "-created_at"):
    return comments_service.list_comments(order_by=order_by)


@router.post(
    "/comments",
    response=CommentTreeOut,
    openapi_extra=exception_responses(
        FileTooLargeException,
        InvalidFileTypeException,
        InvalidUsernameException,
        InvalidCommentTextException,
        InvalidHTMLTagsException,
    ),
)
def post_comment(
    request,
    payload: Form[CommentCreateIn],
    file: File[UploadedFile] | None = None,  # type: ignore
    avatar: File[UploadedFile] | None = None,  # type: ignore
):
    return comments_service.create_comment(payload, file, avatar)
