from functools import partial
from IPython.display import HTML, Javascript
import os
from i2.deco import postprocess
import json
from collections.abc import Mapping
from math import sqrt, pi
from pathlib import Path

from i2.signatures import Sig
from oui.color_util import color_hex_from, add_alpha, dec_to_hex

HTML('<script>var exports = {"__esModule": true};</script>')

pkg_dir = os.path.dirname(__file__)
dflt_filename = 'splatter_defaults.json'
pjoin = lambda *p: os.path.join(pkg_dir, *p)
dflts_filepath = pjoin(dflt_filename)

dflts = json.load(open(dflts_filepath, 'r'))
splatter_dflts = dict(dflts['options'], **dflts['tsneOptions'])

_splatter_raw_sig = Sig.from_objs('pts', splatter_dflts.items())


# splatter_kwargs_dflts = {k: dflts[k] for k in dflts if k not in }
# _splatter_sig = Sig.from_objs('pts', splatter_dflts.items())


def assert_jsonizable(d):
    _ = json.dumps(d)
    return True

# @Sig.from_objs('pts', dflts.items(), assert_same_sized_fvs=True)
# def mysplatter():
#     pass

def process_pts(pts):
    """Get a normalize form for pts.

    Feed `fvs` (an iterable of individual fvs) to get the [{tag: fv}, ...] form out of it
    >>> list(process_pts(pts=[[1, 2, 3], [4, 5, 6]]))
    [{'fv': [1, 2, 3]}, {'fv': [4, 5, 6]}]

    Feed `{tag: fvs,...}` form to get the [{tag: fv}, ...] form out of it
    >>> list(process_pts(pts={
    ...     'old': [[1, 2], [3, 4], [5, 6]],
    ...     'new': [[10, 20], [30, 40]]}))  # doctest: +NORMALIZE_WHITESPACE
    [{'tag': 'old', 'fv': [1, 2]},
     {'tag': 'old', 'fv': [3, 4]},
     {'tag': 'old', 'fv': [5, 6]},
     {'tag': 'new', 'fv': [10, 20]},
     {'tag': 'new', 'fv': [30, 40]}]

    :param pts: Some form of pts
    :return: A normalize "list-of-dicts" form of pts, with dicts being at least
    """
    if not isinstance(pts, Mapping):
        # pts is a list(-like)
        for pt in pts:
            if isinstance(pt, Mapping):
                pt = dict(**pt)  # cast to dict (or make copy)
                pt['fv'] = list(pt['fv'])  # make sure fv is a list
            else:
                pt = {'fv': list(pt)}  # if pt not a dict, assume it's the fv itself
            yield pt
    else:  # if pts is a Mapping, it's a {tag: fvs} mapping:
        for tag, fvs in pts.items():
            for fv in fvs:
                yield dict(tag=tag, fv=list(fv))


_max_node_size_ratio = 0.20


def ordered_uniks(iterable):
    """Unique values of iterable in the order they are encountered in arr
    >>> iterable = [4, 2, 6, 1, 2, 2, 7]
    >>> ordered_uniks(iterable)
    [4, 2, 6, 1, 7]
    """
    found = set()
    # Note: (found.add(x) is None) is a trick so that it the expression is always evaluated.
    return [x for x in iterable if x not in found and found.add(x) is None]


def process_viz_args(pts, nodeSize, figsize, fillColors, untaggedColor, alpha=1):
    n = len(pts)
    if isinstance(figsize, (int, float)):
        figsize = (figsize, figsize)
    height, width = figsize

    dflt_fill_colors = splatter_dflts['fillColors']
    if fillColors is None:
        fillColors = dflt_fill_colors
    elif isinstance(fillColors, Mapping):
        color_for_tag = fillColors
        unik_tags = ordered_uniks(filter(None, (x.get('tag', None) for x in pts)))
        when_not_found_choose_from_here = iter(dflt_fill_colors)
        fillColors = [color_for_tag.get(tag, False) or next(when_not_found_choose_from_here) for tag in unik_tags]

        # If '' and None was mentioned in color_for_tag, the user wants to specify untaggedColor
        if '' in color_for_tag:
            untaggedColor = color_for_tag['']
        elif None in color_for_tag:
            untaggedColor = color_for_tag[None]

    if nodeSize < _max_node_size_ratio:  # if smaller than max_node_size_ratio, it's not pixels,
        # but a desired node coverage ratio (approx ratio of the figure coverage by nodes)
        # It assumes the (unknown) nodeSize is a the "radius" of a circle so that
        # node_coverage = n * pi * nodeSize ** 2 / (height * width)
        # And solves for nodeSize to get desired coverage.
        node_coverage = nodeSize
        nodeSize = max(1, sqrt(node_coverage * (height * width) / (pi * n)))

    assert 0 <= alpha <= 1, f"alpha should be between 0 and 1, was {alpha}"
    fillColors = list(map(color_hex_from, fillColors))
    untaggedColor = color_hex_from(untaggedColor)
    if alpha != 1:
        alpha_hex = dec_to_hex(round(int(alpha * 255)))
        add_this_alpha = partial(add_alpha, alpha_hex=alpha_hex)
        fillColors = list(map(add_this_alpha, fillColors))
        untaggedColor = add_this_alpha(untaggedColor)
    return pts, nodeSize, figsize, fillColors, untaggedColor


# TODO: Wishlist: A decorator to automatically make extra_splatter_kwargs explicit (from dflts)
def splatter(pts,
             nodeSize=0.02,
             figsize=(200, 200),
             fillColors=None,
             untaggedColor='#444',
             alpha=1,
             process_pts=process_pts,
             process_viz_args=process_viz_args,
             **extra_splatter_kwargs):
    pts = list(process_pts(pts))
    pts, nodeSize, figsize, fillColors, untaggedColor = process_viz_args(
        pts, nodeSize, figsize, fillColors, untaggedColor, alpha)
    height, width = figsize
    return splatter_raw(pts, nodeSize=nodeSize, height=height, width=width,
                        fillColors=fillColors, untaggedColor=untaggedColor,
                        **extra_splatter_kwargs)


# TODO: Forward JS errors to python and handle on python side (raising informative error for e.g.)
@_splatter_raw_sig
def splatter_raw(*args, **kwargs):
    """
    Splatter multidimensional pts (that is, see a TSNE iteration happen in front of your eyes,
    squishing your multidimensional pts into two dimensions.

    The `pts` input is a list of dicts, where every dict must have, at a minimum, an `'fv'` field whose value
    is a list of fixed size for all pt of pts.

    Optionally, you can include:
    - 'tag': Will be use to categorize and color the point

    :param pts: Your pts, in the form of a list of dicts, list of lists, or dict of lists.
        All forms of data will be converted to a list of dicts where these dicts have four fields
        (other fields are possible, but are ignored by splatter): `fv` (required), `tag`, `source`, and `bt`.
        - `fv`: the "feature vector" that is used to computer node simularity/distance
        - `tag`: used to denote a group/category and map to a color
        - `source` and `bt`: which together denote the reference of the node element --
            `source` being an identification of the source of the data, and `bt` identifying (usually) time
            (or offset, or some addressing of the source stream).
        ... and any other fields, which will be ignored.
    :param nodeSize: The size of the displayed points (aka "nodes"), in pixels.
    :param height: Height of display rectangle, in pixels.
    :param width: Width of display rectangle, in pixels.
    :param untaggedColor: Color of an untagged node.
    :param maxIterations: Maximum iterations of the TSNE
    :param fps: Frames per second
    :param fillColors: List of colors to cycle through, one for every unique tag.
        How do `fillColors` and `tags` relate?
        Splatter iterates through the raw nodes to find unique tags.
        List of unique tags sorted in order tags were encountered.
        The mapping is then `..., unik_tag[i] -> fill_color[i], ...`.
    :param dim: Target dimension of the TSNE.
        If more than 2, only the first two dimensions are taken into account in the 2d visualization.
    :param epsilon: TSNE parameter. See https://distill.pub/2016/misread-tsne/
    :param perplexity: TSNE parameter. See https://distill.pub/2016/misread-tsne/
    :param spread: TSNE parameter. See https://distill.pub/2016/misread-tsne/
    :return:
    """
    kwargs = _splatter_raw_sig.extract_kwargs(*args, **kwargs)
    assert_jsonizable(kwargs)
    return _splatter(pts=kwargs.pop('pts'), options=kwargs)


def assert_pts_are_valid(pts):
    if not (isinstance(pts, list)  # pts are a list
            and len(pts) > 0  # with at least one element
            and isinstance(pts[0], dict)  # it's elements are dicts (at least the first)
            and 'fv' in pts[0]):  # that have an 'fv' field
        raise ValueError("pts must be a non-empty list of dicts that have at least an fv field")
    # All elements have an 'fv' and they are all of the same length
    first_fv_size = len(pts[0]['fv'])
    for pt in pts:
        if 'fv' not in pt:
            raise ValueError(f"An pt of pts didn't have an 'fv': {pt}")
        if not isinstance(pt['fv'], list):
            raise ValueError(f"All fvs of pts must be lists. This one was not: {pt}")
        if len(pt['fv']) != first_fv_size:
            raise ValueError(f"All fvs of pts must be of the same size ({first_fv_size}: {pt}")
    return True


# TODO: Forward JS errors to python and handle on python side (raising informative error for e.g.)
def _splatter(pts, options):
    assert_pts_are_valid(pts)
    if not options:
        options = {}
    return Javascript(f'splatter(element.get(0), {str(pts)}, {str(options)})')


# Just to note that we can do this with position only args too.

def call_func(func, **kwargs):
    args, kwargs = Sig(func).args_and_kwargs_from_kwargs(kwargs)
    return func(*args, **kwargs)


def call_func_ignoring_excess(func, **kwargs):
    """Call func, sourcing the arguments from kwargs and ignoring the excess arguments.
    Also works if func has some position only arguments.
    """
    s = Sig(func)
    args, kwargs = s.args_and_kwargs_from_kwargs(s.source_kwargs(**kwargs))
    return func(*args, **kwargs)

# TODO: Get defaults from splatter_defaults.json and inject in signature
# def splatter(pts,
#              nodeSize=1,
#              height=200,
#              width=200,
#              untaggedColor: str = '#444',
#              maxIterations=240,
#              fps=60,
#              fillColors=dflt_fillColors,
#              dim=2,
#              epsilon=50,
#              perplexity=30,
#              spread=10,
#              assert_same_sized_fvs: bool = True):
#     """
#     Splatter multidimensional pts (that is, see a TSNE iteration happen in front of your eyes,
#     squishing your multidimensional pts into two dimensions.
#
#     The `pts` input is a list of dicts, where every dict must have, at a minimum, an `'fv'` field whose value
#     is a list of fixed size for all pt of pts.
#
#     Optionally, you can include:
#     - 'tag': Will be use to categorize and color the point
#     - 'x': initial x-coordinate of the point
#     - 'y': initial y-coordinate of the point
#
#     ... and any other fields, which will be ignored.
#
#     :param pts: Your pts, in the form of a list of dicts, list of lists, or dict of lists
#     :param nodeSize: The size of the displayed points (aka "nodes")
#     :param height: Height of display rectangle
#     :param width: Width of display rectangle
#     :param untaggedColor: Color of an untagged node
#     :param maxIterations: Maximum iterations of the TSNE
#     :param fps: Frames per second
#     :param fillColors: List of colors to cycle through, one for every unique tag
#     :param dim: Target dimension of the TSNE
#     :param epsilon:
#     :param perplexity:
#     :param spread:
#     :param assert_same_sized_fvs:
#     :return:
#     """
#     fillColors = list(fillColors)  # because json can't handle tuples
#     options = dict(fillColors=fillColors, fps=fps, height=height, maxIterations=maxIterations, nodeSize=nodeSize,
#                    untaggedColor=untaggedColor, width=width, dim=dim, epsilon=epsilon, perplexity=perplexity,
#                    spread=spread)
#     pts = list(process_pts(pts))
#     return _splatter(pts, options, assert_same_sized_fvs)
