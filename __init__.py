import os
import json

pkg_root_dir = os.path.dirname(__file__)
pjoin = lambda *p: os.path.join(pkg_root_dir, *p)

data_dirpath = pjoin('data')
djoin = lambda *p: os.path.join(data_dirpath, *p)


def get_pkg_data(filename):
    path = djoin(filename)
    if filename.endswith('.json'):
        return json.load(open(path, 'r'))
    else:
        raise ValueError(f"Unrecognized extension in {path}")
