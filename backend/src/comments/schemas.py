import re
from datetime import datetime
from typing import Literal

from ninja import Schema
from pydantic import EmailStr, field_validator

SORT_OPTIONS = Literal[
    "username", "-username", "email", "-email", "created_at", "-created_at"
]
USERNAME_REGEX = re.compile(r"^[a-zA-Z0-9]+$")


class CommentCreateIn(Schema):
    username: str
    text: str
    comment_id: int | None = None
    email: EmailStr | None = None

    @field_validator("username")
    def validate_username(cls, value: str) -> str:
        if not USERNAME_REGEX.match(value):
            raise ValueError(
                "Имя пользователя может содержать только латинские буквы и цифры"
            )
        return value


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
