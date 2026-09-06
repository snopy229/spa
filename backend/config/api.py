from ninja import NinjaAPI

from config import settings
from src.default_exceptions import DefaultHTTPException
from src.comments.api import router as comments_router

api = NinjaAPI(docs_url="/docs" if settings.DEBUG else None)

@api.exception_handler(DefaultHTTPException)
def on_default_http_exception(request, exc: DefaultHTTPException):
    return api.create_response(
        request,
        exc.detail,
        status=exc.status_code,
    )
api.add_router('', comments_router)