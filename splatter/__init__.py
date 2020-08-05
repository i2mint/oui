from IPython.display import Javascript

js_libs = ['https://otosense-dev-ui.s3.amazonaws.com/static/js/tsne.js',
           'https://otosense-dev-ui.s3.amazonaws.com/static/js/splatter.js']

dflt_fill_colors = [
    '#ff0000', '#00ffe6', '#ffc300', '#8c00ff', '#ff5500', '#0048ff', '#3acc00', '#ff00c8', '#fc8383',
    '#1fad8c', '#bbf53d', '#b96ef7', '#bf6a40', '#0d7cf2', '#6ef777', '#ff6699', '#a30000', '#004d45',
    '#a5750d', '#460080', '#802b00', '#000680', '#1d6600', '#660050']


def splatter(pts,
             nodeSize=1,
             height=200,
             width=200,
             untaggedColor: str = '#444',
             maxIterations=240,
             fps=60,
             fillColors=dflt_fill_colors,
             dim=2,
             epsilon=50,
             perplexity=30,
             spread=10,
             assert_same_sized_fvs: bool = True):
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

    :param pts: Your pts, in the form of a list of dicts.
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
    options = dict({}, fillColors=fillColors, fps=fps, height=height, maxIterations=maxIterations, nodeSize=nodeSize,
                   untaggedColor=untaggedColor, width=width, dim=dim, epsilon=epsilon, perplexity=perplexity,
                   spread=spread)
    return _splatter(pts, options, assert_same_sized_fvs)


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
