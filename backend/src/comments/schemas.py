import re
from datetime import datetime
from typing import Literal

import bleach
from defusedxml import ElementTree
from defusedxml.ElementTree import ParseError
from ninja import Schema
from pydantic import EmailStr, field_validator

SORT_OPTIONS = Literal[
    "username", "-username", "email", "-email", "created_at", "-created_at"
]
USERNAME_REGEX = re.compile(r"^[a-zA-Z0-9]+$")
ALLOWED_TAGS = ["a", "code", "i", "strong"]
ALLOWED_ATTRIBUTES = {"a": ["href", "title"]}


class CommentCreateIn(Schema):
    username: str
    text: str
    comment_id: int | None = None
    email: EmailStr | None = None

    @field_validator("username")
    def validate_username(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("Имя пользователя не может быть пустым")
        if not USERNAME_REGEX.match(value):
            raise ValueError(
                "Имя пользователя может содержать только латинские буквы и цифры"
            )
        return value

    @field_validator("text")
    def validate_text(cls, value: str) -> str:
        if not value.strip():
            raise ValueError(
                "Текст комментария не может быть пустым. Допустимы только теги: <a>, <code>, <i>, <strong>"
            )

        try:
            ElementTree.fromstring(f"<root>{value}</root>")
        except ParseError:
            raise ValueError("Не все HTML-теги закрыты корректно.")

        if (
            bleach.clean(value, tags=ALLOWED_TAGS, attributes=ALLOWED_ATTRIBUTES)
            != value
        ):
            raise ValueError(
                "Текст комментария содержит недопустимые HTML-теги или атрибуты"
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
