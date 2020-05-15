from IPython.display import Javascript

js_libs = ['https://otosense-dev-ui.s3.amazonaws.com/static/js/tsne.js',
           'https://otosense-dev-ui.s3.amazonaws.com/static/js/splatter.js']


def splatter(pts, options=None, assert_same_sized_fvs=True):
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
    :return:
    """
    options = options or {}
    assert len(pts) > 0, "Your data is empty"
    if assert_same_sized_fvs:
        first_fv_size = len(pts[0].get('fv', []))
        assert all(first_fv_size == len(pt.get('fv', [])) for pt in pts), "All 'fv' lists must be of the same size."
    return Javascript(f"""
    ((element) => {{
        console.log('HI!');
        require(['splatter'], (splatter) => splatter(element.get(0), {pts}, {options}))
    }})(element);""", lib=js_libs)