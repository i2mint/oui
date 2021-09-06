from flask import Flask, Response
from flask_cors import CORS
import json
from random import random
from time import time, sleep

app = Flask(__name__)
CORS(app)

@app.route('/stream')
def return_stream():
    def random_data():
        while True:
            new_data = {
                'bt': int(time() * 1000),
                'value': random(),
            }
            print('sending chunk')
            yield json.dumps(new_data) + '\n'
            sleep(0.5)
    return Response(random_data(), mimetype='text/plain')

if __name__ == '__main__':
    app.run(port=3001)
