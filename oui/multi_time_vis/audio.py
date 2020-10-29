import io
from typing import Iterable
from oui.multi_time_vis.base import single_time_vis

CHANNEL_TYPES = ['audio', 'data']

DFLT_SR = 44100
DFLT_CHART_TYPE = 'spectrogram'
DFLT_ENABLE_PLAYBACK = True
DFLT_HEIGHT = 100
DFLT_PARAMS = None


def _cast_wf(wf):
    """Cast wf to a list of ints"""
    if not isinstance(wf, list):
        if str(type(wf)) == "<class 'numpy.ndarray'>":
            # see https://stackoverflow.com/questions/2060628/reading-wav-files-in-python
            wf = wf.tolist()  # list(wf) does not convert int16 to int
        else:
            wf = list(wf)  # fallback
    if len(wf) > 0:
        assert isinstance(wf[0], int), f"first element of wf wasn't an int, but a {type(wf[0])}"
    return wf


def jsobj_of_audio(src,
                   chart_type=DFLT_CHART_TYPE,
                   enable_playback=DFLT_ENABLE_PLAYBACK,
                   height=DFLT_HEIGHT,
                   params=DFLT_PARAMS,
                   title='',
                   subtitle='',
                   **kwargs):
    """

    :param src: some recognized source of audio.
        At this point: waveform (list/array of int samples), (wf, sr), filepath, bytes, file-like object
    :param chart_type: The chart type to render, either 'peaks' (default) or 'spectrogram'
    :param enable_playback: Whether to enable playback on double click (default True)
    :param height: The height of the chart in pixels (default 50)
    :param params: Extra rendering parameters, currently unused
    :param title: The title to display, defaults to the filename
    :param subtitle: An optional subtitle to display under the title
    :param kwargs: extra kwargs to be passed on to Javascript object constructor
    :return:
    """
    if isinstance(src, bytes):
        src = io.BytesIO(src)
    if isinstance(src, (str, io.IOBase)):
        return file_to_jsobj(src, chart_type, enable_playback, height, params, title, subtitle, **kwargs)
    elif isinstance(src, tuple) and len(src) == 2:  # then assume it's a (wf, sr)
        return wfsr_to_jsobj(*src, chart_type, enable_playback, height, params, title, subtitle, **kwargs)
    elif isinstance(src, Iterable):
        return file_to_jsobj(src,
                             chart_type=chart_type,
                             enable_playback=enable_playback,
                             height=height,
                             params=params,
                             title=title,
                             subtitle=subtitle,
                             **kwargs)


def wfsr_to_src_spec(wf, sr=44100):
    duration_s = len(wf) / sr

    return {
        'type': 'audio',
        'wf': _cast_wf(wf),
        'sr': sr,
        'bt': 0,
        'tt': int(duration_s * 1000000)
    }


def wfsr_to_jsobj(
        wf,
        sr=DFLT_SR,
        chart_type=DFLT_CHART_TYPE,
        enable_playback=DFLT_ENABLE_PLAYBACK,
        height=DFLT_HEIGHT,
        params=DFLT_PARAMS,
        title='',
        subtitle='',
        **kwargs):
    """Get anb audio jsobj from a (waveform, sample rate) pair

    :
    :param wf: Waveform. An iterable of ints
    :param sr: Sample rate. An int.
    :param chart_type: The chart type to render, either 'peaks' (default) or 'spectrogram'
    :param enable_playback: Whether to enable playback on double click (default True)
    :param height: The height of the chart in pixels (default 50)
    :param params: Extra rendering parameters, currently unused
    :param title: The title to display, defaults to the filename
    :param subtitle: An optional subtitle to display under the title
    :param kwargs: extra kwargs to be passed on to Javascript object constructor
    :return:
    """
    src_spec = wfsr_to_src_spec(wf, sr)
    return single_time_vis(src_spec,
                           bt=src_spec['bt'],
                           tt=src_spec['tt'],
                           chart_type=chart_type,
                           enable_playback=enable_playback,
                           height=height,
                           params=params,
                           title=title,
                           subtitle=subtitle,
                           **kwargs)


def file_to_jsobj(file,
                  chart_type=DFLT_CHART_TYPE,
                  enable_playback=DFLT_ENABLE_PLAYBACK,
                  height=DFLT_HEIGHT,
                  params=DFLT_PARAMS,
                  title='',
                  subtitle='',
                  **kwargs
                  ):
    """Renders a time visualization of a WAV file from its file.

    :param file: The filepath str or file-like object (e.g. open file, or BytesIO object)
    :param chart_type: The chart type to render, either 'peaks' (default) or 'spectrogram'
    :param enable_playback: Whether to enable playback on double click (default True)
    :param height: The height of the chart in pixels (default 50)
    :param params: Extra rendering parameters, currently unused
    :param title: The title to display, defaults to the filename
    :param subtitle: An optional subtitle to display under the title
    :param kwargs: extra kwargs to be passed on to Javascript object constructor
    """
    import soundfile

    wf, sr = soundfile.read(file, dtype='int16')
    if not title and isinstance(file, str):
        title = file
    return wfsr_to_jsobj(wf, sr,
                         chart_type=chart_type,
                         enable_playback=enable_playback,
                         height=height,
                         params=params,
                         title=title,
                         subtitle=subtitle,
                         **kwargs
                         )


render_wav_file = file_to_jsobj  # back-compatibility alias
