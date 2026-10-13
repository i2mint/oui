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
_layout_re = re.compile(r'var \w+=this\.options,(\w)=\w\.width,(\w)=\w\.height;(.*?)\}', re.S)


def _ranges(width, height):
    m = _layout_re.search(bundle.read_text())
    assert m, "Couldn't find the splatter layout code in the bundle"
    w, h, body = m.groups()
    js = (
        'const a={scaleLinear:()=>({range(r){this.r=r;return this}})};'
        'const o={};(function(){'
        f'var {w}={width},{h}={height};'
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
