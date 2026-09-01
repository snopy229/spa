from ninja_extra import NinjaExtraAPI
from ninja_jwt.controller import NinjaJWTDefaultController
from src.comments.api import router as comments_router

api = NinjaExtraAPI()
api.register_controllers(NinjaJWTDefaultController)
api.add_router('', comments_router)