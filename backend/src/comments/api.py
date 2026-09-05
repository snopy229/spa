from ninja import File, Form, Router
from ninja.files import UploadedFile
from ninja.pagination import PageNumberPagination, paginate

from src.comments.container import comments_service
from src.comments.exceptions import (
    FileTooLargeException,
    HTMLTagsNotClosedException,
    InvalidCommentTextException,
    InvalidFileTypeException,
    InvalidUsernameException,
)
from src.comments.schemas import SORT_OPTIONS, CommentCreateIn, CommentTreeOut
from src.default_exceptions import exception_responses

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
        HTMLTagsNotClosedException,
    ),
)
def post_comment(
    request,
    payload: Form[CommentCreateIn],
    file: File[UploadedFile] = None,
):
    return comments_service.create_comment(payload, file)
