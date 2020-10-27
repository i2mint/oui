from IPython.display import Javascript
import os
import soundfile

CHANNEL_TYPES = ['audio', 'data']


def mk_time_channel(filename, chart_type='peaks'):
    """
    Make a single_time_vis time channel dict from an audio file.

    :param filename: The filename to open
    """
    wf, sr = soundfile.read(filename, dtype='int16')
    return {
        'chartType': chart_type,
        'type': 'audio',
        'buffer': list(wf),
        'sr': sr
    }


def render_wav_file(filename,
                    chart_type='peaks',
                    enable_playback=True,
                    height=50,
                    params=None,
                    title='',
                    subtitle=''):
    """
    Renders a time visualization of a WAV file from its filename.

    :param filename: The filename to load
    :param chart_type: The chart type to render, either 'peaks' (default) or 'spectrogram
    :param enable_playback: Whether to enable playback on double click (default True)
    :param height: The height of the chart in pixels (default 50)
    :param params: Extra rendering parameters, currently unused
    :param title: The title to display, defaults to the filename
    :param subtitle: An optional subtitle to display under the title
    """
    channel = mk_time_channel(filename, chart_type)
    duration_s = len(channel['buffer']) / channel['sr']
    title = title or filename
    return single_time_vis(channel,
                           bt=0,
                           tt=int(duration_s * 1000000),
                           chart_type=chart_type,
                           enable_playback=enable_playback,
                           height=height,
                           params=params,
                           title=title,
                           subtitle=subtitle)


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
    :param bargraph_max: The numeric value for the top of the chart, default 1
    :param bargraph_min: The numeric value for the top of the chart, default -2
    :param categories: For a winners channel, the list of categories to display
        (matching the "winners" values of the data points)
    """
    assert channel.get('type', None) in CHANNEL_TYPES, 'Channel type must be "audio" or "data"'
    if channel['type'] == 'audio':
        assert 'url' in channel or ('buffer' in channel and 'sr' in channel), 'Channel must have either "url" or "buffer" (list of integers) and "sr"'
        if not chart_type:
            chart_type = 'peaks'
    else:
        assert 'data' in channel
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
    js_source = f'renderTimeChannel(element.get(0), {channel}, {props})'.replace('True', 'true').replace('None', 'null')
    return Javascript(js_source)
