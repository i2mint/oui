from IPython.display import Javascript

js_libs = ['https://otosense-dev-ui.s3.amazonaws.com/static/js/oto-multi-time-vis-min-v0.0.6b.js']

CHANNEL_TYPES = ['audio', 'data']


def single_time_vis(channel,
                    bt=0,
                    tt=10000000,
                    chart_type='bargraph',
                    enable_playback=True,
                    height=50,
                    params=None,
                    title='',
                    subtitle=''):
    """
    Render a visualization of time series or audio data.

    :param channel: A time channel dict (see below)
    :param bt: The logical start time of the display, in microseconds
    :param tt: The logical end time of the display, in microseconds
    :param chart_type: The type of visualization to draw, one of
        ["bargraph", "heatmap", "spectrogram", "peaks", or "winners"]
    :param enable_playback: Whether to embed audio controls in the component (audio channel only)
    :param height: The height of the channel in pixels
    :param params: An empty dict or a dict with "chunk_size" as an integer in milliseconds
    :param title: A title to display above the chart
    :param subtitle: A subtitle to display under the title

    Channel keys:

    Audio channel:
    Either "url" or "buffer"

    :param type: Must be "audio"
    :param url: A URL to access WAV-format audio over HTTP
    :param buffer: A list of 16-bit integers

    Data channel:

    :param type: Must be "data"
    :param data: A list of data points, with the keys "value" and either ("bt" and "tt") or "time"
    :param bargraph_max: The numeric value for the top of the cart, default 1
    :param bargraph_min: The numeric value for the top of the cart, default -2
    """
    assert channel.get('type', None) in CHANNEL_TYPES, 'Channel type must be "audio" or "data"'
    if channel['type'] == 'audio':
        assert channel.get('url') or channel.get('buffer'), 'Channel must have a "url" or "buffer" (list of integers)'
    else:
        assert channel.get('data')
    props = dict({}, bt=bt, tt=tt, chart_type=chart_type, enable_playback=enable_playback, height=height,
                 params=params, title=title, subtitle=subtitle)
    return _single_time_vis(channel, props)


def time_vis(channels):
    """
    Render multiple channels.

    :param channels: The channels to render, a list of dicts.
    :return:
    """
    pass
    # options = dict({}, fillColors=fillColors, fps=fps, height=height, maxIterations=maxIterations, nodeSize=nodeSize,
    #                untaggedColor=untaggedColor, width=width, dim=dim, epsilon=epsilon, perplexity=perplexity,
    #                spread=spread)
    # return _splatter(pts, options, assert_same_sized_fvs)


def _single_time_vis(channel, props):
    js_code = f"""
    ((element) => {{
        require(['otoTimeVis'], (otoTimeVis) => otoTimeVis(
        element.get(0),
        {channel},
        {props}))
    }})(element);""".replace('True', 'true').replace('None', 'null')
    return Javascript(js_code, lib=js_libs)
