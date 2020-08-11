from IPython.display import Javascript
import os
from i2.signatures import Sig
import json
from collections.abc import Mapping

pkg_dir = os.path.dirname(__file__)
dflt_filename = 'splatter_defaults.json'
pjoin = lambda *p: os.path.join(pkg_dir, *p)
dflts_filepath = pjoin(dflt_filename)

dflts = json.load(open(dflts_filepath, 'r'))
splatter_dflts = dict(dflts['options'], **dflts['tsneOptions'])

js_libs = ['https://otosense-dev-ui.s3.amazonaws.com/static/js/tsne.js',
           'https://otosense-dev-ui.s3.amazonaws.com/static/js/splatter.js']


# @Sig.from_objs('pts', dflts.items(), assert_same_sized_fvs=True)
# def mysplatter():
#     pass


def _splatter(pts, options, assert_same_sized_fvs=True):
    assert len(pts) > 0, "Your data is empty"
    if assert_same_sized_fvs:
        first_fv_size = len(pts[0].get('fv', []))
        assert all(first_fv_size == len(pt.get('fv', [])) for pt in pts), "All 'fv' lists must be of the same size."
    return Javascript(f"""
    ((element) => {{
        console.log('HI!');
        require(['splatter'], (splatter) => splatter(element.get(0), {pts}, {options}))
    }})(element);""", lib=js_libs)


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


_sig = Sig.from_objs('pts', splatter_dflts.items(), [('assert_same_sized_fvs', True, bool)])


# TODO: Forward JS errors to python and handle on python side (raising informative error for e.g.)
@_sig
def splatter(*args, **kwargs):
    """
    Splatter multidimensional pts (that is, see a TSNE iteration happen in front of your eyes,
    squishing your multidimensional pts into two dimensions.

    The `pts` input is a list of dicts, where every dict must have, at a minimum, an `'fv'` field whose value
    is a list of fixed size for all pt of pts.

    Optionally, you can include:
    - 'tag': Will be use to categorize and color the point
    - 'x': initial x-coordinate of the point
    - 'y': initial y-coordinate of the point

    ... and any other fields, which will be ignored.

    :param pts: Your pts, in the form of a list of dicts, list of lists, or dict of lists
    :param nodeSize: The size of the displayed points (aka "nodes")
    :param height: Height of display rectangle
    :param width: Width of display rectangle
    :param untaggedColor: Color of an untagged node
    :param maxIterations: Maximum iterations of the TSNE
    :param fps: Frames per second
    :param fillColors: List of colors to cycle through, one for every unique tag
    :param dim: Target dimension of the TSNE
    :param epsilon:
    :param perplexity:
    :param spread:
    :param assert_same_sized_fvs:
    :return:
    """
    b = _sig.bind(*args, **kwargs)
    b.apply_defaults()
    kwargs = dict(b.arguments)
    # kwargs['fillColors'] = list(kwargs['fillColors'])
    kws = dict()
    kws['pts'] = list(process_pts(kwargs['pts']))
    kws['assert_same_sized_fvs'] = kwargs.pop('assert_same_sized_fvs')
    kws['options'] = kwargs  # the remaining is put in here
    return _splatter(**kws)


# Just to note that we can do this with position only args too.

def call(func, kwargs):
    args, kwargs = Sig(func).args_and_kwargs_from_kwargs(kwargs)
    return func(*args, **kwargs)

# dflt_fill_colors = (
#     '#ff0000', '#00ffe6', '#ffc300', '#8c00ff', '#ff5500', '#0048ff', '#3acc00', '#ff00c8', '#fc8383',
#     '#1fad8c', '#bbf53d', '#b96ef7', '#bf6a40', '#0d7cf2', '#6ef777', '#ff6699', '#a30000', '#004d45',
#     '#a5750d', '#460080', '#802b00', '#000680', '#1d6600', '#660050')


# TODO: Forward JS errors to python and handle on python side (raising informative error for e.g.)
# TODO: Get defaults from splatter_defaults.json and inject in signature
# def splatter(pts,
#              nodeSize=1,
#              height=200,
#              width=200,
#              untaggedColor: str = '#444',
#              maxIterations=240,
#              fps=60,
#              fillColors=dflt_fill_colors,
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
