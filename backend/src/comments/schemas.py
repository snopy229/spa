from datetime import datetime

from ninja import Schema
from pydantic import EmailStr


class CommentCreateIn(Schema):
    username: str
    created_at: datetime
    text: str
    comment_id: int | None = None
    email: EmailStr | None = None


class CommentTreeOut(Schema):
    id: int
    username: str
    avatar: str
    file: str
    text: str
    created_at: datetime
    email: EmailStr | None = None
    replies: list["CommentTreeOut"] = []  # noqa: RUF012
