import json
from random import random
from time import sleep, time
from functools import partial

from flask import Flask
from flask_sockets import Sockets

app = Flask(__name__)
sockets = Sockets(app)


def get_random_data(timestamp):
    return random()


def mytrans(ts, cycle_seconds=3, factor=1/3, trans=lambda x: x):
    return trans(factor * ((ts / cycle_seconds) % cycle_seconds))


def myclock(cycle_seconds=3, factor=1/3, trans=lambda x: x):
    return mytrans(time(), cycle_seconds=cycle_seconds, factor=factor, trans=trans)


def cycler(iterable):
    from itertools import cycle
    circle = cycle(iterable)

    def get_data(ignored):
        return next(circle)

    return get_data


dflt_data_getter = get_random_data
dflt_data_getter = myclock
# dflt_data_getter = cycler([0.1, 0.5, 0.9])


@sockets.route('/streamdata')
def stream_data_socket(ws, data_getter=get_random_data, pause_for=0.5, log_sends=True):
    print("Entering loop...")
    while not ws.closed:
        timestamp = time()
        new_data = {
            'bt': int(timestamp * 1000),
            'value': data_getter(),
        }
        if log_sends:
            print(f'sending: {new_data}')
        ws.send(json.dumps(new_data))
        sleep(pause_for)


if __name__ == "__main__":
    from gevent import pywsgi
    from geventwebsocket.handler import WebSocketHandler

    server = pywsgi.WSGIServer(('', 3001), app, handler_class=WebSocketHandler)
    server.serve_forever()
