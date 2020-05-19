from IPython.display import Javascript

js_libs = ['https://otosense-dev-ui.s3.amazonaws.com/static/js/chord_chart.js']


def chord_chart(data, options=None):
    """
    A chord chart for visualizing a confusion matrix.

    :param data: A CentroidSmoothing model.
    :return:
    """
    options = options or {}
    return Javascript(f"""
    ((element) => {{
        console.log('Drawing chord chart.');
        require(['chord_chart'], (chordChart) => chordChart(element.get(0), {data}))
    }})(element);""", lib=js_libs)
