from datetime import datetime

from ninja import Schema
from pydantic import EmailStr


class CommentCreateIn(Schema):
    username: str
    avatar: str
    created_at: datetime
    email: EmailStr | None = None
