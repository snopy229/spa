from ninja import NinjaAPI

from src.comments.api import router as comments_router
api = NinjaAPI()

api.add_router('', comments_router)