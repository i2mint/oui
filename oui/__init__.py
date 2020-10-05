import os
import json
from pathlib import Path

from IPython.display import display, Javascript

pkg_root_dir = os.path.dirname(__file__)
print(f'pkg_root_dir: {pkg_root_dir}')
pjoin = lambda *p: os.path.join(pkg_root_dir, *p)
js_filename = pjoin('js', 'index.js')
print(f'js_filename: {js_filename}')
with open(js_filename) as js_file:
    js_source = js_file.read()
    display(Javascript(js_source))

data_dirpath = pjoin('data')
djoin = lambda *p: os.path.join(data_dirpath, *p)


def get_pkg_data(filename):
    path = djoin(filename)
    if filename.endswith('.json'):
        return json.load(open(path, 'r'))
    else:
        raise ValueError(f"Unrecognized extension in {path}")

