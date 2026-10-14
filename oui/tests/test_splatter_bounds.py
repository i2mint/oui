"""Regression test for oui#7: splatter nodes must stay inside the figure for any aspect ratio.

Runs the layout statements of the shipped JS bundle (``oui/js/index.js``) under node, with a
stub for d3's ``scaleLinear``, and checks the pixel ranges are within ``[0, width] x [0, height]``.
"""

import json
import re
import shutil
import subprocess
from pathlib import Path

import pytest

bundle = Path(__file__).parent.parent / 'js' / 'index.js'

# the statements of initializeValues that build the x/y scales
_layout_re = re.compile(r'var (\w+)=this\.options,(\w)=\w\.width,(\w)=\w\.height;(.*?)\}', re.S)


def _ranges(width, height, node_size=0):
    m = _layout_re.search(bundle.read_text())
    assert m, "Couldn't find the splatter layout code in the bundle"
    opts, w, h, body = m.groups()
    js = (
        'const a={scaleLinear:()=>({range(r){this.r=r;return this}})};'
        'const o={};(function(){'
        f'var {opts}={{nodeSize:{node_size}}},{w}={width},{h}={height};'
        + body.replace('this.', 'o.')
        + '})();console.log(JSON.stringify({x:o.centerx.r,y:o.centery.r}))'
    )
    out = subprocess.run(['node', '-e', js], capture_output=True, text=True, check=True)
    return json.loads(out.stdout)


@pytest.mark.skipif(shutil.which('node') is None, reason='node not installed')
@pytest.mark.parametrize('width,height', [(80, 150), (150, 80), (150, 150), (30, 400), (7.5, 120.5), (12, 12)])
def test_ranges_within_figure(width, height):
    r = _ranges(width, height)
    for lo, hi in (r['x'], r['y']):
        assert lo <= hi
    assert 0 <= r['x'][0] and r['x'][1] <= width
    assert 0 <= r['y'][0] and r['y'][1] <= height
    # square, so the t-SNE aspect ratio is kept
    assert r['x'][1] - r['x'][0] == pytest.approx(r['y'][1] - r['y'][0])


@pytest.mark.skipif(shutil.which('node') is None, reason='node not installed')
@pytest.mark.parametrize('node_size', [5, 7, 20])
def test_ranges_leave_room_for_node_radius(node_size):
    r = _ranges(200, 200, node_size)
    # circles are drawn at scale(2)
    assert r['x'][0] >= 2 * node_size and r['x'][1] <= 200 - 2 * node_size
    assert r['y'][0] >= 2 * node_size and r['y'][1] <= 200 - 2 * node_size


def test_coverage_uses_square_side():
    from oui.splatter import process_viz_args

    pts = [{'fv': [0]}] * 10
    sq = process_viz_args(pts, 0.1, (100, 100), None, '#444')[1]
    elongated = process_viz_args(pts, 0.1, (100, 1000), None, '#444')[1]
    assert elongated == pytest.approx(sq)


def test_splatter_height_width_override_figsize():
    from oui.splatter import splatter

    # figsize is (height, width); keyword height/width override it
    import oui.splatter as sp

    seen = {}
    orig = sp.splatter_raw
    sp.splatter_raw = lambda *a, **k: seen.update(k)
    try:
        splatter([[1, 2]], figsize=(100, 300))
        assert (seen['height'], seen['width']) == (100, 300)
        splatter([[1, 2]], figsize=(100, 300), width=50)
        assert (seen['height'], seen['width']) == (100, 50)
    finally:
        sp.splatter_raw = orig
