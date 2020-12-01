from flask import Flask
from flask_sockets import Sockets
import json
from random import random
from time import sleep, time


app = Flask(__name__)
sockets = Sockets(app)


@sockets.route('/streamdata')
def stream_data_socket(ws):
    while not ws.closed:
        new_data = {
            'bt': int(time() * 1000),
            'value': random(),
        }
        print('sending chunk')
        ws.send(json.dumps(new_data))
        sleep(0.5)


if __name__ == "__main__":
    from gevent import pywsgi
    from geventwebsocket.handler import WebSocketHandler
    server = pywsgi.WSGIServer(('', 3001), app, handler_class=WebSocketHandler)
    server.serve_forever()