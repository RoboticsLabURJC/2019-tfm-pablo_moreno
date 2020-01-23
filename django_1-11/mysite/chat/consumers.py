from channels import Group
import json
from channels.asgi import get_channel_layer


def ws_connect(message):
    message.reply_channel.send({"accept": True})
    Group('chat').add(message.reply_channel)


def ws_receive(message):
    print("message: ", message.content['text'])
    message_json = json.loads(message.content['text'])
    Group("chat").send({
        "text": "[%s]: %s" % (message_json['user'], message_json['text']),
    })


def ws_disconnect(message):
    Group('chat').discard(message.reply_channel)
