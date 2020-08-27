# Time visualization Python interface

## `single_time_vis` examples

Render a spectrogram. Double-click to play or stop.

The difference between `bt` and `tt` must equal the actual duration of the sound file for the progress indicator to render correctly.
```python
from ui_components.multi_time_vis import single_time_vis
bt = 0
tt = 6500000
audio_channel = {
    'chartType': 'spectrogram',
    'type': 'audio',
    'url': 'https://otosense.analogcloudsandbox.io/static/wav/pcm1644m.wav',
}
single_time_vis(audio_channel, bt, tt, height=200)
```
![spectro](/uploads/6a30a894e369b159ba07bb5b29659d84/otv-spectro.png)

Render a peaks diagram (waveform approximation)
```python
from ui_components.multi_time_vis import single_time_vis
bt = 0
tt = 6500000
wave_channel = {
    'chartType': 'peaks',
    'type': 'audio',
    'url': 'https://otosense.analogcloudsandbox.io/static/wav/pcm1644m.wav',
}
single_time_vis(wave_channel, bt, tt, height=50)
```
![peaks](/uploads/354597133e98afd690bc85ab7ba2295c/peaks.png)

Render a bar graph
```python
from ui_components.multi_time_vis import single_time_vis
import random
mcs_per_chunk = (2048 * 21 / 44100) * 1000000
mock_data = [{
    'time': i * mcs_per_chunk,
    'value': random.random(),
} for i in range(200)]
data_channel = {
    'chartType': 'bargraph',
    'bargraphMin': 0,
    'bargraphMax': 1,
    'data': mock_data,
    'type': 'data'
}
single_time_vis(data_channel, bt=0, tt=mcs_per_chunk * 200, height=100)
```
![bargraph](/uploads/c86fa2a184eaacad4805bddb3d3fbc1b/bargraph.png=1000x20)

Render a chart of winning categories for chunks
```python
from ui_components.multi_time_vis import single_time_vis
import random
mcs_per_chunk = (2048 * 21 / 44100) * 1000000
categories = ['one', 'two', 'three']
mock_winners = [{
    'time': i * mcs_per_chunk,
    'winner': random.choice(categories)
} for i in range(200)]
winners_channel = {
    'categories': categories,
    'chartType': 'winners',
    'data': mock_winners,
    'type': 'data'
}
single_time_vis(winners_channel, bt=0, tt = mcs_per_chunk * 200, height=60)
```
![winners](/uploads/0844e8b96ad885be8ae4217722852d3f/Screen_Shot_2020-08-24_at_12.44.34_PM.png)