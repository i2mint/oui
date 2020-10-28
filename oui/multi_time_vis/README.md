# OtoSense time visualizations

## Class `TimeChannel`

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


### Interface `AudioChannel`

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

### Interface `DataChannel`

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


### Interface `WinnersChannel`

An object representing a visualization with two or more rows displaying the highest value for each point in time.

Required keys:
* __type__ Must be 'data'
* __chartTYpe__ Must be 'winners'
* __categories__ An array of the categories represented in the data
* __data__ An array of `WinnerDataPoint` objects

Optional keys:
* __color__ A color code for the data points on the chart
* __image__ A pre-drawn image data URL for the chart


### Interface `Timerange` for annotation overlays

* __bt__ Start time in microseconds
* __tt__ End time in microseconds
* __color__ (optional) A hex code color for drawing an overlay.
* __highlighted__ (optional) A boolean value to add additional emphasis to the element.


### Interface `DataPoint` for time series data

Data points must either have both __bt__ and __tt__, or __time__

* __bt__ Start time in microseconds
* __tt__ End time in microseconds
* __time__ Point in time in microseconds, if representing an instantaneous or chunk-sized event (display width will be determined by the prop `params.chunkSize` passed to the TimeChannel, defaulting to 972ms)
* __value__ Any value (should be numeric for a bargraph)


### Interface `WinnerDataPoint` for category winner time series data

* __time__ Point in time in microseconds (display width will be determined by the prop `params.chunkSize` passed to the TimeChannel, defaulting to 972ms)
* __winner__ The category that won this point in time (may be null)


## CSS classes

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


## TODO

* Support (bt, tt) for winners
* Add CSS
* More documentation
* More shortcuts
* Examples
