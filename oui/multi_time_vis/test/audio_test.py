from oui.multi_time_vis.test import dpath


def audio_jsobj_are_equivalent(jsobj_01, jsobj_02):
    return (
            jsobj_01._trace['props'] == jsobj_02._trace['props']
            and
            jsobj_02._trace['channel'] == jsobj_01._trace['channel']
    )


def test_jsobj_of_audio():
    from oui.multi_time_vis import jsobj_of_audio
    import soundfile as sf

    posix_path = dpath('baby_voice.wav')
    jsobj_from_posix_path = jsobj_of_audio(posix_path)

    # test with filepath (string) input
    filepath = str(posix_path)
    jsobj_from_filepath = jsobj_of_audio(filepath)
    jsobj_from_filepath._trace['props']['title'] = ''  # hack removing automatic title that happens for string inputs
    assert (audio_jsobj_are_equivalent(jsobj_from_filepath, jsobj_from_posix_path))

    # test with bytes input
    b = posix_path.read_bytes()
    jsobj_from_bytes = jsobj_of_audio(b)
    assert (audio_jsobj_are_equivalent(jsobj_from_bytes, jsobj_from_posix_path))

    # test with an io.BytesIO object
    from io import BytesIO
    bb = BytesIO(b)
    jsobj_from_bytesio = jsobj_of_audio(bb)
    assert (audio_jsobj_are_equivalent(jsobj_from_bytesio, jsobj_from_posix_path))

    # test with (wf, sr) pair input
    wf, sr = sf.read(filepath, dtype='int16')
    jsobj_from_wfsr = jsobj_of_audio((wf, sr))
    assert (audio_jsobj_are_equivalent(jsobj_from_wfsr, jsobj_from_posix_path))

    # if sr is the DFLT_SR, test with (wf, sr) pair input
    from oui.multi_time_vis.audio import DFLT_SR
    if sr == DFLT_SR:
        jsobj_from_wf = jsobj_of_audio(wf)
        assert (audio_jsobj_are_equivalent(jsobj_from_wf, jsobj_from_posix_path))
