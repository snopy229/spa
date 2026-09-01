from datetime import datetime

from ninja import Schema, UploadedFile
from pydantic import EmailStr, field_validator


class CommentCreateIn(Schema):
    username: str
    created_at: datetime
    text: str
    avatar: UploadedFile | None = None
    file: UploadedFile | None = None
    comment_id: int | None = None
    email: EmailStr | None = None

    @field_validator("file")
    @classmethod
    def validate_file(cls, file: UploadedFile | None):
        if file is None:
            return file
        if file.content_type not in [
            "text/plain",
            "image/jpeg",
            "image/gif",
            "image/png",
        ]:
            raise ValueError("Разрешены только файлы формата TXT, JPG, GIF и PNG.")
        if file.content_type == "text/plain" and file.size > 100 * 1024:
            raise ValueError("Размер файла TXT не должен превышать 100 KB.")

        return file

    @field_validator("avatar")
    @classmethod
    def validate_avatar(cls, avatar: UploadedFile | None):
        if avatar is None:
            return avatar
        if avatar.content_type not in ["image/jpeg", "image/gif", "image/png"]:
            raise ValueError("Разрешены только файлы формата JPG, GIF и PNG.")

        return avatar


class CommentTreeOut(Schema):
    id: int
    username: str
    avatar: str
    file: str
    text: str
    created_at: datetime
    email: EmailStr | None = None
    replies: list["CommentTreeOut"] = []  # noqa: RUF012
