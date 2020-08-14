<h1>Table of Contents<span class="tocSkip"></span></h1>
<div class="toc"><ul class="toc-item"><li><span><a href="#Hello-splatters" data-toc-modified-id="Hello-splatters-1"><span class="toc-item-num">1&nbsp;&nbsp;</span>Hello splatters</a></span><ul class="toc-item"><li><span><a href="#splatter_raw" data-toc-modified-id="splatter_raw-1.1"><span class="toc-item-num">1.1&nbsp;&nbsp;</span>splatter_raw</a></span></li></ul></li><li><span><a href="#splatter:-An-interface-that-does-more-for-you" data-toc-modified-id="splatter:-An-interface-that-does-more-for-you-2"><span class="toc-item-num">2&nbsp;&nbsp;</span>splatter: An interface that does more for you</a></span><ul class="toc-item"><li><span><a href="#More-data-input-formats" data-toc-modified-id="More-data-input-formats-2.1"><span class="toc-item-num">2.1&nbsp;&nbsp;</span>More data input formats</a></span></li><li><span><a href="#Lists-of-lists" data-toc-modified-id="Lists-of-lists-2.2"><span class="toc-item-num">2.2&nbsp;&nbsp;</span>Lists of lists</a></span></li><li><span><a href="#tagged-lists" data-toc-modified-id="tagged-lists-2.3"><span class="toc-item-num">2.3&nbsp;&nbsp;</span>tagged lists</a></span></li><li><span><a href="#Figsize" data-toc-modified-id="Figsize-2.4"><span class="toc-item-num">2.4&nbsp;&nbsp;</span>Figsize</a></span></li></ul></li><li><span><a href="#nodeSize" data-toc-modified-id="nodeSize-3"><span class="toc-item-num">3&nbsp;&nbsp;</span>nodeSize</a></span></li><li><span><a href="#alpha" data-toc-modified-id="alpha-4"><span class="toc-item-num">4&nbsp;&nbsp;</span>alpha</a></span></li><li><span><a href="#Color" data-toc-modified-id="Color-5"><span class="toc-item-num">5&nbsp;&nbsp;</span>Color</a></span><ul class="toc-item"><li><span><a href="#Specifying-color" data-toc-modified-id="Specifying-color-5.1"><span class="toc-item-num">5.1&nbsp;&nbsp;</span>Specifying color</a></span></li><li><span><a href="#Giving-tags-color" data-toc-modified-id="Giving-tags-color-5.2"><span class="toc-item-num">5.2&nbsp;&nbsp;</span>Giving tags color</a></span></li></ul></li><li><span><a href="#More" data-toc-modified-id="More-6"><span class="toc-item-num">6&nbsp;&nbsp;</span>More</a></span></li></ul></div>

# Hello splatters

A splatter is way to visualize and interact with multi-dimensional, possibly tagged, data. 

For those who like fancy-pants terms, know that it's a t-distributed stochastic 
neighbor embedding (t-SNE) happening in front of your eyes. 


Highlights:

You can splatter:
- a list of dicts (must have an 'fv', and optionally a 'tag')
- a `[fv,...]` list of fvs (themselves lists)
- a `{tag: fv_list, ...}` mapping

You can specify color
- with hex codes
- with a list of color names and short-hands
- specify colors to pick from
- specify a `{tag: color, ...}` mapping

You can specify size
- figsize, as `(height, weight)` or just one number (`height=weight`). Unit is pixels.
- nodeSize, as pixels (of radius of circle) or as proportion of the figure all the points should cover

You can also specify parameters of the t-SNE algorithm itself. 
For help and experimentation on how to do that, here's a 
[nice resource](https://distill.pub/2016/misread-tsne/).

## splatter_raw

Let's have a look at a minimal example containing five tagged points


```python
from ui_components.splatter import splatter_raw

pts = [
    {'fv': [1, 2, 3], 'tag': 'foo'},
    {'fv': [1, 2, 4], 'tag': 'foo'},
    {'fv': [1, 3, 3], 'tag': 'foo'},
    {'fv': [2, 10, 11], 'tag': 'bar'},
    {'fv': [2, 10, 12], 'tag': 'bar'}]
splatter_raw(pts)
```

![image](/uploads/7353f280cca416f988c98c4be26f65bd/image.png)



`fv` stands for "feature vector", which usually encodes some characteristics of items of interest. When we're lazy, we'll refer to the set of `fv`s as "the data", or "the points".

You see that though the points (see?) lie in a 3-dimensional space, we've managed to squeeze them into 2-dimensions for your visual enjoyment. 

When you do such ungodly thing, you're bound to loose something of the original relationships, but the splatter tries to keep similar items as close to each other: That is, if two items were close by (i.e. similar) in the original space, the algorithm will do it's best so that you see them being close in the splatter. It will not, on the other hand, make such efforts for points that are further apart.

The `tag` of a point is optional. See though, that points that have the same tag will have the same color. And if you don't specify a `tag` at all, the point will take on the `untaggedColor` (by default, `'#444'`). 


```python
pts = [
    {'fv': [1, 2, 3], 'tag': 'foo'},
    {'fv': [1, 2, 4]},
    {'fv': [1, 3, 3], },
    {'fv': [2, 10, 11], 'tag': 'bar'},
    {'fv': [2, 10, 12]}]
splatter_raw(pts, untaggedColor='#444', nodeSize=3)
```




    <IPython.core.display.Javascript object>



`splatter_raw` is the python layer around the `Javascript` code that doesn't do much more than forward the work. See the signature below for what controls you have.


```python
from inspect import signature
signature(splatter_raw)
```




    <Signature (pts, nodeSize=1, height=200, width=200, untaggedColor='#444', maxIterations=240, fps=60, fillColors=['#ff0000', '#00ffe6', '#ffc300', '#8c00ff', '#ff5500', '#0048ff', '#3acc00', '#ff00c8', '#fc8383', '#1fad8c', '#bbf53d', '#b96ef7', '#bf6a40', '#0d7cf2', '#6ef777', '#ff6699', '#a30000', '#004d45', '#a5750d', '#460080', '#802b00', '#000680', '#1d6600', '#660050'], dim=2, epsilon=50, perplexity=30, spread=10)>



See that you can make the figure box and nodes (points) bigger. Units are in pixels...


```python
import numpy as np
from ui_components.splatter import _splatter

pts = [{'fv': fv.tolist()} for fv in np.random.rand(100, 3)]
splatter_raw(pts, nodeSize=2, height=300, width=200)
```




    <IPython.core.display.Javascript object>



Know, in case it ever matters, that even splatter_raw is a thin layer over `_splatter(pts, options)`, which is the actual one forwarding to JS. We stuck `spatter_raw` on top so that we could give details of the `options` arguments and do some validation. 


```python
from ui_components.splatter import _splatter
_splatter(pts=pts, options=dict(nodeSize=2, height=300, width=200))
```




    <IPython.core.display.Javascript object>



See [issue](http://git.otosense.ai/thor/ui_components/issues/6) about bounding boxes.

# splatter: An interface that does more for you

Above `splatter_raw` is a convenience function called `splatter`. It's the one you'll use more of the time since it does more for you in the way of handling different data formats and preparing the data for you.


```python
import numpy as np
from inspect import signature
from ui_components.splatter import splatter

signature(splatter)
```




    <Signature (pts, nodeSize=0.02, figsize=(200, 200), fillColors=None, untaggedColor='#444', alpha=1, process_pts=<function process_pts at 0x11933bd30>, process_viz_args=<function process_viz_args at 0x118f58e50>, **extra_splatter_kwargs)>



Let's try some stuff out. 

## More data input formats

## Lists of lists

You know how you had to do this:
```python
pts = [{'fv': fv.tolist()} for fv in np.random.rand(100, 3)]
```
to get `pts` in the format accepted by `splatter_raw`. 

Well, now you don't have to.


```python
pts = np.random.rand(100, 3)
splatter(pts)
```




    <IPython.core.display.Javascript object>



## tagged lists

Sometimes you have your data already grouped by tag. It's okay, keep it that way, we'll unravel it before we give it to splatter.


```python
pts = {
    'foo': [[1, 1, 1]] * 10,
    'bar': [[1, 10, 1]] * 20,
    '': [[5, 10, 10]] * 15  # just include an empty tag to denote "untagged"
}
splatter(pts)
```




    <IPython.core.display.Javascript object>



## Figsize

Check the following three splaters out.


```python
pts = np.random.rand(100, 3)
```


```python
splatter(pts, figsize=100)
```




    <IPython.core.display.Javascript object>




```python
splatter(pts, figsize=250)
```




    <IPython.core.display.Javascript object>




```python
splatter(pts, figsize=(150, 80))
```




    <IPython.core.display.Javascript object>



You'll notice two things here:
- You only needed to specify one number for the figsize and it will interpret it as the dimensions (in pixels) of a square. But you can still use the `(height, width)` way of expressing the figsize, just as a pair (tuple or list) instead of two separate arguments.
- The nodes are bigger when the bounding box is bigger. 

# nodeSize

About that last point: In fact, it's the proportion of surface the nodes occupy relative to the surface of the box that is conserved, and that ratio is specified by `nodeSize`. See what happens when we make `nodeSize` bigger. 


```python
splatter(pts, nodeSize=0.06, figsize=250)
```


![image](/uploads/53420f2215a2ab35b1fbd48017545402/image.png)



But know that you can still use `nodeSize` in the pixels unit as JS does. `splatter` will interpret your `nodeSize` as pixels instead of "proportion of the box's surface" as soon as `nodeSize > 0.2`. 


```python
splatter(pts, nodeSize=0.19, figsize=150)
```

![image](/uploads/5412ede0a9bea59c14b9e1266a5813d8/image.png)





```python
splatter(pts, nodeSize=0.2, figsize=150)
```


![image](/uploads/0d5be1725c92af9680490ff34f2399a2/image.png)



# alpha


```python
splatter(pts, nodeSize=0.1, figsize=150, alpha=0.2)  # TODO: Not working
```




    <IPython.core.display.Javascript object>



# Color

## Specifying color

First, know that color has to be specified in hex form. 
Like... `'#ADD8E6'` is light blue. 
There's a plethora of online tools to get the hex of your color of choice. 
The first one I found googling is: https://htmlcolorcodes.com/color-picker/

Alternatively, you can use our little hex_color tool:


```python
from ui_components.color_util import hex_color
```

`hex_color` is a collection (meaning you can do things like `list(hex_color)`:


```python
print(*hex_color, sep='\t')
```

    b	g	r	c	m	y	k	w	f	t	i	s	o	p	l	a	d	n	v	h	maroon	dark_red	brown	firebrick	crimson	red	tomato	coral	indian_red	light_coral	dark_salmon	salmon	light_salmon	orange_red	dark_orange	orange	gold	dark_golden_rod	golden_rod	pale_golden_rod	dark_khaki	khaki	olive	yellow	yellow_green	dark_olive_green	olive_drab	lawn_green	chart_reuse	green_yellow	dark_green	green	forest_green	lime	lime_green	light_green	pale_green	dark_sea_green	medium_spring_green	spring_green	sea_green	medium_aqua_marine	medium_sea_green	light_sea_green	dark_slate_gray	teal	dark_cyan	aqua	cyan	light_cyan	dark_turquoise	turquoise	medium_turquoise	pale_turquoise	aqua_marine	powder_blue	cadet_blue	steel_blue	corn_flower_blue	deep_sky_blue	dodger_blue	light_blue	sky_blue	light_sky_blue	midnight_blue	navy	dark_blue	medium_blue	blue	royal_blue	blue_violet	indigo	dark_slate_blue	slate_blue	medium_slate_blue	medium_purple	dark_magenta	dark_violet	dark_orchid	medium_orchid	purple	thistle	plum	violet	magenta	fuchsia	orchid	medium_violet_red	pale_violet_red	deep_pink	hot_pink	light_pink	pink	antique_white	beige	bisque	blanched_almond	wheat	corn_silk	lemon_chiffon	light_golden_rod_yellow	light_yellow	saddle_brown	sienna	chocolate	peru	sandy_brown	burly_wood	tan	rosy_brown	moccasin	navajo_white	peach_puff	misty_rose	lavender_blush	linen	old_lace	papaya_whip	sea_shell	mint_cream	slate_gray	light_slate_gray	light_steel_blue	lavender	floral_white	alice_blue	ghost_white	honeydew	ivory	azure	snow	black	dim_gray	dim_grey	gray	grey	dark_gray	dark_grey	silver	light_gray	light_grey	gainsboro	white_smoke	white


`hex_color`'s attribute names are these above color names (and short-cuts thereof), and the corresponding attribute value is... the hex for that color. Lucky you.


```python
hex_color.blue
```




    '#0000FF'




```python
hex_color.b
```




    '#0000FF'




```python
hex_color.light_blue
```




    '#ADD8E6'



## Giving tags color

`fillColors` is where you can specify a list of colors that will be used to color the points according to their tag. The list is traversed in order, and assigned to each new unique tag encountered in `pts`, in order. 

Of course, `filleColors` falls back on a default


```python
pts = {
    'use': [[1, 1, 1], [1, 1, 2], [1, 2, 1]],
    'the': [[5, 5, 5], [6, 6, 6], [7, 7, 7]],
    'force': [[10, 11, 12]],
    '': [[1, 5, 9], [9, 1, 5]]  # just include an empty tag to denote "untagged"
}
hc = hex_color
```


```python
splatter(pts)
```


![image](/uploads/46a8a24338b7c83008a679d1ad197e35/image.png)




```python
splatter(pts, fillColors=[hc.bisque, hc.blue_violet, hc.dark_khaki])
```


![image](/uploads/c443ddd53ab2823b22832d3368ceda20/image.png)



You should be able to specify `untaggedColor` too, but that doesn't work.

**(TODO: FIXME!!)**


```python
splatter(pts, fillColors=[hc.bisque, hc.blue_violet, hc.dark_khaki], untaggedColor=hc.crimson)
```






If want to map specific tags to specific colors, you can do that by specifying a `{tag: color,...}` map.


```python
splatter(pts, fillColors={'use': hc.pink, 'the': hc.orchid, 'force': hc.gainsboro}, untaggedColor=hc.crimson)
```



![image](/uploads/c46ce18b9f583915edc8d59343c06963/image.png)



And that map doesn't have to be completely specified. We'll fill in the gaps with the aforementioned default `fillColors`. 


```python
splatter(pts, fillColors={'use': hc.pink}, untaggedColor=hc.crimson)
```


![image](/uploads/9f02779d547985ebffcaabf2e886358e/image.png)




# More


```python
print(splatter_raw.__doc__)
```

    
        Splatter multidimensional pts (that is, see a TSNE iteration happen in front of your eyes,
        squishing your multidimensional pts into two dimensions.
    
        The `pts` input is a list of dicts, where every dict must have, at a minimum, an `'fv'` field whose value
        is a list of fixed size for all pt of pts.
    
        Optionally, you can include:
        - 'tag': Will be use to categorize and color the point
    
        :param pts: Your pts, in the form of a list of dicts, list of lists, or dict of lists.
            All forms of data will be converted to a list of dicts where these dicts have four fields
            (other fields are possible, but are ignored by splatter): `fv` (required), `tag`, `source`, and `bt`.
            - `fv`: the "feature vector" that is used to computer node simularity/distance
            - `tag`: used to denote a group/category and map to a color
            - `source` and `bt`: which together denote the reference of the node element --
                `source` being an identification of the source of the data, and `bt` identifying (usually) time
                (or offset, or some addressing of the source stream).
            ... and any other fields, which will be ignored.
        :param nodeSize: The size of the displayed points (aka "nodes"), in pixels.
        :param height: Height of display rectangle, in pixels.
        :param width: Width of display rectangle, in pixels.
        :param untaggedColor: Color of an untagged node.
        :param maxIterations: Maximum iterations of the TSNE
        :param fps: Frames per second
        :param fillColors: List of colors to cycle through, one for every unique tag.
            How do `fillColors` and `tags` relate?
            Splatter iterates through the raw nodes to find unique tags.
            List of unique tags sorted in order tags were encountered.
            The mapping is then `..., unik_tag[i] -> fill_color[i], ...`.
        :param dim: Target dimension of the TSNE.
            If more than 2, only the first two dimensions are taken into account in the 2d visualization.
        :param epsilon: TSNE parameter. See https://distill.pub/2016/misread-tsne/
        :param perplexity: TSNE parameter. See https://distill.pub/2016/misread-tsne/
        :param spread: TSNE parameter. See https://distill.pub/2016/misread-tsne/
        :return:
        



```python

```


```python

```


```python

```


```python

```


```python

```


```python

```


```python

```
