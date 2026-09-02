from datetime import datetime
from typing import Literal

from ninja import Schema
from pydantic import EmailStr


class CommentCreateIn(Schema):
    username: str
    text: str
    comment_id: int | None = None
    email: EmailStr | None = None


class CommentTreeOut(Schema):
    id: int
    username: str
    avatar: str | None = None
    file: str | None = None
    text: str
    created_at: datetime
    email: EmailStr | None = None
    comment_id: int | None = None
    replies: list["CommentTreeOut"] = []  # noqa: RUF012


SORT_OPTIONS = Literal[
    "username", "-username", "email", "-email", "created_at", "-created_at"
]
