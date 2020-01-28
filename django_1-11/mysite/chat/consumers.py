from channels import Group
import json
import time
import threading
from channels.asgi import get_channel_layer

userList = []

def ws_connect(message):
    message.reply_channel.send({"accept": True})
    Group('chat').add(message.reply_channel)
    userList.append(message.reply_channel)
    #print("Added user:", message.reply_channel)

def ws_receive(message):
    finded = False
    ch_finded = False
    str_msg = ""

    message_json = json.loads(message.content['text'])
    str_msg = "Message:\n  type:" + str(message_json['type']) + "\n  Data:"

    Group('chat').discard(message.reply_channel)

    for usr in userList:
        if str(usr) == str(message.reply_channel):
            finded = True

    if not finded:
        print("User not in list:", message.reply_channel)
        userList.append(message.reply_channel)
    else:
        ch_group_list = get_channel_layer().group_channels('chat')
        for user in userList:
            if str(user) != str(message.reply_channel):
                for ch_usr in ch_group_list:
                    if str(usr) == str(ch_usr):
                        ch_finded = True
                if not ch_finded:
                    Group('chat').add(user)

    if message_json['type'] == "candidate":
        answer = json.dumps({
            "type": message_json['type'],
            "candidate": message_json['candidate']
        })
        str_msg += str(message_json['candidate'])
    elif message_json['type'] == "checkUser":
        answer = json.dumps({
            "type": message_json["type"],
            "users": len(userList) > 1
        })
        str_msg += str(len(userList) > 1)
        print(str_msg)
        message.reply_channel.send({"text": answer})
        Group('stream-sender').add(message.reply_channel)
        return None
    elif message_json['type'] == "RTC-Offer":
        answer = json.dumps({
            "type": message_json['type'],
            "offer": message_json['offer']
        })
        str_msg += str(message_json['offer'])
    elif message_json['type'] == "RTC-Answer":
        answer = json.dumps({
            "type": message_json['type'],
            "answer": message_json['answer']
        })
        str_msg += str(message_json['answer'])
        print(str_msg)
        Group('stream-sender').send({ "text": answer})
        return None
    elif message_json['type'] == "chat":
        answer = json.dumps({
            "type": message_json['type'],
            "user": message_json['user'],
            "message": message_json['text']
        })
        str_msg += "\n    User: " + message_json['user'] + "\n    Text: " + message_json['text']
    else:   # Chat messages
        print("Error: message type not defined.");

    print(str_msg)
    Group('chat').send({ "text": answer })


def ws_disconnect(message):
    Group('chat').discard(message.reply_channel)
    try:
        userList.remove(message.reply_channel)
    except ValueError:
        pass
