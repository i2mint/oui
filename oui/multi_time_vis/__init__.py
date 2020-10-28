from IPython.display import Javascript
from copy import copy
import os
import soundfile

CHANNEL_TYPES = ['audio', 'data']


def mk_time_channel(filename, chart_type='peaks'):
    """
    Make a single_time_vis time channel dict from an audio file.

    :param filename: The filename to open
    :param chart_type: The chart type to render, either 'peaks' (default) or 'spectrogram'
    """
    wf, sr = soundfile.read(filename, dtype='int16')
    duration_s = len(wf) / sr
    return {
        'bt': 0,
        'chartType': chart_type,
        'type': 'audio',
        'wf': list(wf),
        'sr': sr,
        'tt': int(duration_s * 1000000)
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
    :param chart_type: The chart type to render, either 'peaks' (default) or 'spectrogram'
    :param enable_playback: Whether to enable playback on double click (default True)
    :param height: The height of the chart in pixels (default 50)
    :param params: Extra rendering parameters, currently unused
    :param title: The title to display, defaults to the filename
    :param subtitle: An optional subtitle to display under the title
    """
    channel = mk_time_channel(filename, chart_type)
    title = title or filename
    return single_time_vis(channel,
                           bt=channel['bt'],
                           tt=channel['tt'],
                           chart_type=chart_type,
                           enable_playback=enable_playback,
                           height=height,
                           params=params,
                           title=title,
                           subtitle=subtitle)


def single_time_vis(channel,
                    bt=0,
                    tt=0,
                    chart_type=None,
                    enable_playback=True,
                    height=50,
                    params=None,
                    title='',
                    subtitle=''):
    """
    Render a visualization of time series or audio data.

    :param channel: A time channel dict or a list of numbers (see below)
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
    Should include either "url" or both "wf" and "sr"

    :param url: A URL to access WAV-format audio over HTTP
    :param wf: A list of 16-bit integers
    :param sr: The sample rate of the recording

    Data channel:

    Can be a list of numbers (for bargraphs or heatmaps) or strings (for winners).
    Otherwise, a channel dict with the following keys:

    :param data: A list of data points, with the keys "value" and either ("bt" and "tt") or "time"
    :param bargraphMax: The numeric value for the top of the chart, default 1
    :param bargraphMin: The numeric value for the top of the chart, default -2
    :param categories: For a winners channel, the list of categories to display
        (matching the "winners" values of the data points)
    """
    channel = _preprocess_channel(channel)
    props = dict({}, bt=bt, tt=tt, chart_type=chart_type, enable_playback=enable_playback, height=height,
                 params=params, title=title, subtitle=subtitle)
    return _single_time_vis(channel, props)


def time_vis(channels, props=None):
    """
    Render multiple channels.

    :param channels: The channels to render, a list of dicts.
    :return:
    """
    if not props:
        props = {}
    channels = [_preprocess_channel(channel) for channel in channels]
    js_source = f'renderMultiTimeVis(element.get(0), {channels}, {props})'.replace('True', 'true').replace('None', 'null')
    return Javascript(js_source)


def _preprocess_channel(channel):
    preprocessed = copy(channel)
    if isinstance(preprocessed, list):
        preprocessed = {
            'chart_type': 'bargraph',
            'data': preprocessed,
            'type': 'data',
        }
    data = preprocessed.get('data', [])
    if data:
        if isinstance(data[0], str):
            preprocessed['chart_type'] = 'winners'
            preprocessed['categories'] = list(set(data))
        else:
            preprocessed['bargraphMax'] = max(*data)
    if 'wf' in preprocessed or 'url' in preprocessed:
        preprocessed['type'] = 'audio'
        preprocessed['chart_type'] = 'peaks'
    return preprocessed


def _single_time_vis(channel, props):
    js_source = f'renderTimeChannel(element.get(0), {channel}, {props})'.replace('True', 'true').replace('None', 'null')
    return Javascript(js_source)

