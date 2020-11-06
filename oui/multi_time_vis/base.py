from IPython.display import Javascript
from copy import copy
from typing import Optional

CHANNEL_TYPES = ['audio', 'data']


def single_time_vis(channel: dict,
                    bt=0,
                    tt=0,
                    chart_type: Optional[str] = None,
                    enable_playback: bool = True,
                    height: int = 50,
                    params=None,
                    title: str = '',
                    subtitle='',
                    **kwargs
                    ) -> Javascript:
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
    props = dict(kwargs, bt=bt, tt=tt, chart_type=chart_type, enable_playback=enable_playback, height=height,
                 params=params, title=title, subtitle=subtitle)
    return _single_time_vis(channel, props)


def time_vis(channels, props=None) -> Javascript:
    """
    Render multiple channels.

    :param channels: The channels to render, a list of dicts.
    :return:
    """
    if not props:
        props = {}
    channels = [_preprocess_channel(channel) for channel in channels]
    js_source = f'renderMultiTimeVis(element.get(0), {channels}, {props})'.replace('True', 'true').replace('None',
                                                                                                           'null')
    jsobj = Javascript(js_source)
    jsobj._trace = {'channels': channels, 'props': props}
    return jsobj


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


def _single_time_vis(channel, props) -> Javascript:
    ##########################################################################################
    # TODO: Horrible hack due to horrible JS interface. Change!
    #   chartType is a visualization concern, and should therefore be in props, not channel
    #   (also, channel should probably be called src to align with new word for concept)
    if 'chart_type' in props:
        channel['chartType'] = props['chart_type']
    ##########################################################################################

    js_source = f'renderTimeChannel(element.get(0), {channel}, {props})'.replace('True', 'true').replace('None', 'null')
    jsobj = Javascript(js_source)
    jsobj._trace = {'channel': channel, 'props': props}
    return jsobj
