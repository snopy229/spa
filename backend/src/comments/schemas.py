import re
from datetime import datetime
from typing import Literal

import bleach
from defusedxml import ElementTree
from defusedxml.ElementTree import ParseError
from ninja import Schema
from pydantic import EmailStr, field_validator
from src.comments.exceptions import (
    HTMLTagsNotClosedException,
    InvalidCommentTextException,
    InvalidUsernameException,
)

SORT_OPTIONS = Literal[
    "username", "-username", "email", "-email", "created_at", "-created_at"
]
USERNAME_REGEX = re.compile(r"^[a-zA-Z0-9]+$")
ALLOWED_TAGS = ["a", "code", "i", "strong"]
ALLOWED_ATTRIBUTES = {"a": ["href", "title"]}


class CommentCreateIn(Schema):
    username: str
    text: str
    home_page: str | None = None
    comment_id: int | None = None
    email: EmailStr | None = None

    @field_validator("username")
    def validate_username(cls, value: str) -> str:
        if not USERNAME_REGEX.match(value):
            raise InvalidUsernameException
        return value

    @field_validator("text")
    def validate_text(cls, value: str) -> str:
        try:
            ElementTree.fromstring(f"<root>{value}</root>")
        except ParseError:
            raise HTMLTagsNotClosedException

        if (
            bleach.clean(value, tags=ALLOWED_TAGS, attributes=ALLOWED_ATTRIBUTES)
            != value
        ):
            raise InvalidCommentTextException
        return value


class CommentTreeOut(Schema):
    id: int
    username: str
    avatar: str | None = None
    file: str | None = None
    text: str
    created_at: datetime
    email: EmailStr | None = None
    home_page: str | None = None
    comment_id: int | None = None
    replies: list["CommentTreeOut"] = []  # noqa: RUF012
