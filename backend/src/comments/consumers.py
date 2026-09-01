from channels.generic.websocket import AsyncJsonWebsocketConsumer


class CommentsConsumer(AsyncJsonWebsocketConsumer):
    GROUP_NAME = "comments"

    async def connect(self):
        await self.channel_layer.group_add(self.GROUP_NAME, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.GROUP_NAME, self.channel_name)

    async def new_comment(self, event):
        await self.send_json(event["comment"])
