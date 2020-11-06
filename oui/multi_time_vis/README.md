# OtoSense time visualizations


# Basics: jsobj_of_audio

jsobj_of_audio is a convenience function to get a (ipython) javascript object from various (single channgle) audio sources.

Let's first make a simple pure tone waveform to try it out.


```python
from numpy import sin, arange, pi

n_samples = 21 * 2048
sr = 44100
freq = 220
wf = sin(arange(n_samples) * 2 * pi * freq / sr)
wf = (30000 * wf).astype('int16')  # because the waveform samples need to be of the int16 type.
```


```python
from oui.multi_time_vis import jsobj_of_audio

jsobj = jsobj_of_audio(wf)
print(f"This jsobj is a {type(jsobj)}")
```


    <IPython.core.display.Javascript object>


    This jsobj is a <class 'IPython.core.display.Javascript'>


That jsobj contains, of course, some javascript object. Let's print just the beginning of it:



```python
print(jsobj.data[:99] + '...')
```

    renderTimeChannel(element.get(0), {'type': 'audio', 'wf': [0, 940, 1879, 2816, 3751, 4682, 5608, 65...


In the context of a notebook, most of the time, you'll just want to display it to "use" it.


```python
jsobj
```

![image](https://user-images.githubusercontent.com/1906276/97647554-cb258f00-1a0f-11eb-87d2-4732d47ee96b.png)



It shows you a spectrogram by default (or, if the sound is too long, it will show you peaks instead).

You can double click on the viz to play the sound from the place you clicked. 

You can (single) click on the viz again to stop the playing.

## Various waveform input formats


```python
from oui.multi_time_vis import jsobj_of_audio
```

We'll need a path to test this out. We'll take the test one, but you can try your own:


```python
from oui.multi_time_vis.test import dpath

posix_path = dpath('baby_voice.wav')
```

### A pathlib path object (if you're into that thing)


```python
from pathlib import PurePath
assert isinstance(posix_path, PurePath)
jsobj_of_audio(posix_path)
```

![image](https://user-images.githubusercontent.com/1906276/97647602-e7c1c700-1a0f-11eb-9023-8fbee798b36d.png)


## A filepath (string)

Note here that if you don't specify a title, it will use the file (base) name


```python
import os

filepath = str(posix_path)  # the full path to the wav file
assert isinstance(filepath, str) and os.path.isfile(filepath)
jsobj_of_audio(filepath) 
```

![image](https://user-images.githubusercontent.com/1906276/97647620-f1e3c580-1a0f-11eb-9046-46f50b02bbd8.png)



## bytes


```python
b = posix_path.read_bytes()
assert isinstance(b, bytes)  # see, bytes, of the sort you'd get from a sensor
jsobj_of_audio(b)
```

![image](https://user-images.githubusercontent.com/1906276/97647602-e7c1c700-1a0f-11eb-9023-8fbee798b36d.png)



## waveform (array of samples)


```python
import soundfile as sf
wf, sr = sf.read(filepath, dtype='int16')  # remember, the waveform sample need to be of the int16 type.
```


```python
jsobj_of_audio((wf, sr))  # note we specify wf and sr as a tuple of both, not wf and sr as two args of the function!
```

![image](https://user-images.githubusercontent.com/1906276/97647602-e7c1c700-1a0f-11eb-9023-8fbee798b36d.png)



```python
jsobj_of_audio(wf)  # if you don't specify sample rate wf, it will take sr=44100
```

![image](https://user-images.githubusercontent.com/1906276/97647602-e7c1c700-1a0f-11eb-9023-8fbee798b36d.png)




```python
jsobj_of_audio((wf, 10000))  # you can also specify a different sr too
```

![image](https://user-images.githubusercontent.com/1906276/97647680-1c358300-1a10-11eb-9144-d1fcc1e5d3b1.png)




```python
jsobj_of_audio((wf, 80000))  # you can also specify a different sr too
```

![image](https://user-images.githubusercontent.com/1906276/97647693-26578180-1a10-11eb-8a1a-257a24d9a678.png)



## viz options


```python
jsobj_of_audio(wf, title='a title!', height=200)
```

![image](https://user-images.githubusercontent.com/1906276/97647717-340d0700-1a10-11eb-865d-6fc08ff9eeda.png)



```python
jsobj_of_audio(wf, chart_type='peaks', title='a title!', subtitle='subtitle', height=150)
```

![image](https://user-images.githubusercontent.com/1906276/97647731-3cfdd880-1a10-11eb-84a6-1d42aa3e300a.png)



# Class `TimeChannel`

Renders a single-row visualization.

Required props:
* __channel__ An `AudioChannel`, `DataChannel`, or `WinnersChannel` containing the data to render
* __bt__ The start timestamp of the channel, in microseconds.
* __tt__ The end timestamp of the channel, in microsedonds.

Optional props:
* __annotations__ An array of `Timerange` objects to render as overlays on the chart.
* __chartType__ The type of chart to render. Options are `bargraph`, `heatmap`, `spectrogram`, `peaks`, and `winners` (default bargraph)
* __enablePlayback__ (audio channels only) Embeds playback controls in the chart: Click to set position, double click to start, spacebar to pause/resume
* __height__ The height of the chart in pixels (default 50)
* __menu__ A JSX element to render to the right of the channel title
* __params__ An object with display parameters (currently only supports `chunkSize` in milliseconds)
* __renderProgress__ A JSX element to display after the component has mounted, before the visualization is complete
* __subtitle__ A string to display under the channel title
* __title__ A channel title to display

Optional event handler props
* __clickHandler__ Single click
* __contextMenuHandler__ Context menu (right click or Mac ctrl+click)
* __keydownHandler__ Keydown
* __mouseOutHandler__ Mouse out
* __startSelecting__ Mouse down
* __zoomHandler__ Mouse wheel
* __suppressEvents__ Disables __all__ events including defaults

Advanced props
* __getAnnotationColor__ A function that takes a `Timerange` and returns a color code for drawing overlays
* __getAnnotationHighlight__ A function that takes a `Timerange` and returns a boolean value for highlighting overlays
* __hideTooltips__ Disables hover tooltips for data charts


## Interface `AudioChannel`

An object representing an audio visualization.

Required keys:
* __type__ Must be 'audio'

Either one of these keys is required (not all three):
* __url__ The URL of a WAV file to visualize
* __buffer__ An ArrayBuffer with WAV data that can be read by the browser (header + PCM)
* __image__ A pre-drawn image data URL

Optional keys:
* __bt__ The start timestamp of the audio, in microseconds, if different bt the TimeChannel element
* __tt__ The start timestamp of the audio, in microseconds, if different bt the TimeChannel element
* __windowSize__ The width of windows used for calculating signal peaks when drawing a peaks diagram.

## Interface `DataChannel`

An object representing a time series visualization.

Required keys:
* __type__ Must be 'data'
* __data__ An array of `DataPoint` objects

Optional keys:
* __bargraphMax__ For a bar graph, the numeric value for the top of the chart (defaults to 1 so you'll want to set this unless your data is all under 1)
* __bargraphMin__ The numeric value for the bottom of the chart (defaults to -2)
* __chartType__ Either 'bargraph' or 'heatmap'
* __filters__ An array of functions with the signature `(params: object, data: DataPoint[])` to apply to the data before rendering
* __getColor__ A function taking a DataPoint and outputting a color code (must be set for a useful heatmap)
* __image__ A pre-drawn image data URL for the chart
* __renderTooltip__ A function that takes a timestamp in microseconds (based on the position of the mouse cursor) and returns a renderable element (a string or JSX element) to display in a tooltip


## Interface `WinnersChannel`

An object representing a visualization with two or more rows displaying the highest value for each point in time.

Required keys:
* __type__ Must be 'data'
* __chartTYpe__ Must be 'winners'
* __categories__ An array of the categories represented in the data
* __data__ An array of `WinnerDataPoint` objects

Optional keys:
* __color__ A color code for the data points on the chart
* __image__ A pre-drawn image data URL for the chart


## Interface `Timerange` for annotation overlays

* __bt__ Start time in microseconds
* __tt__ End time in microseconds
* __color__ (optional) A hex code color for drawing an overlay.
* __highlighted__ (optional) A boolean value to add additional emphasis to the element.


## Interface `DataPoint` for time series data

Data points must either have both __bt__ and __tt__, or __time__

* __bt__ Start time in microseconds
* __tt__ End time in microseconds
* __time__ Point in time in microseconds, if representing an instantaneous or chunk-sized event (display width will be determined by the prop `params.chunkSize` passed to the TimeChannel, defaulting to 972ms)
* __value__ Any value (should be numeric for a bargraph)


## Interface `WinnerDataPoint` for category winner time series data

* __time__ Point in time in microseconds (display width will be determined by the prop `params.chunkSize` passed to the TimeChannel, defaulting to 972ms)
* __winner__ The category that won this point in time (may be null)


# CSS classes

* __otv--vis-channel__ The outermost container of TimeChannel
* __otv--channel-title__ The title displayed above the chart
* __otv--canvas-container__ A div wrapping the visualization image
    * __otv--data__ Additional class applied to data channels
    * __otv--audio__ Additional class applied to audio channels
* __otv--overlay-selections__ The overlay container
* __otv--selection__ The individual overlay items
    * __otv--annotation-highlight__ Highlighted items
* __otv--indicator__ The current position indicator for audio playback
* __otv--tooltip__ The tooltip for data channels


# TODO

* Support (bt, tt) for winners
* Add CSS
* More documentation
* More shortcuts
* Examples
