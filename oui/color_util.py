from oui import get_pkg_data
from typing import Iterable

alpha_less_rgb_hex_length = len('#aabbcc')


def int_to_alpha_hex(alpha: int = 255):
    assert isinstance(alpha, int) and 0 <= alpha <= 255, \
        f"int alpha should be between 0 and 255"
    return '%02x' % alpha


def float_to_alpha_hex(alpha: float = 1.0):
    assert 0 <= alpha <= 1, f"float alpha should be between 0 and 1"
    return int_to_alpha_hex(int_to_alpha_hex(int(alpha)))


def alpha_hex_from(alpha):
    if isinstance(alpha, int):
        return int_to_alpha_hex(alpha)
    elif isinstance(alpha, float):
        return float_to_alpha_hex(alpha)
    elif isinstance(alpha, str):
        return alpha


def color_hex_to_color_hex(color_hex):
    """
    >>> color_hex_to_color_hex('#3af')
    '#33aaff'
    >>> color_hex_to_color_hex('#09bd')
    '#0099bbdd'
    >>> color_hex_to_color_hex('#00ff1080')
    '#00ff1080'
    """
    n = len(color_hex)
    assert n > 0 and color_hex[0] == '#', "color hex code should start with #"
    assert n in {4, 5, 7, 9}, "color hex code should be # followed with 3, 4, 6, or 8 digits"
    if n <= 5:
        h = color_hex[0] + color_hex[1] * 2 + color_hex[2] * 2 + color_hex[3] * 2
        if n == 5:
            h += color_hex[4] * 2
        return h
    else:  # return as is
        return color_hex


def add_alpha(rgb_hex, alpha_hex, replace_existing_alpha=False):
    """Add an alpha to the rgb_hex.
    >>> add_alpha('#123456', 'ab')
    '#123456ab'
    >>> add_alpha('#12345678', 'ab')
    '#12345678'
    >>> add_alpha('#12345678', 'ab', replace_existing_alpha=True)
    '#123456ab'
    """
    if len(rgb_hex) > alpha_less_rgb_hex_length:
        if replace_existing_alpha:
            return rgb_hex[:-2] + alpha_hex
        else:
            return rgb_hex
    else:
        return rgb_hex + alpha_hex


color_names_and_codes = get_pkg_data('color_names_and_codes.json')
hex_for_color = {x['color']: x['hex'] for x in color_names_and_codes}


def dec_to_hex(dec):
    return '%02x' % dec


def color_dec_to_hex(color_dec):
    """Get the color hex code for an integer (r, g, b) or (r, g, b, alpha) specification.
    >>> color_dec_to_hex((10, 64, 200))
    '#0a40c8'
    >>> color_dec_to_hex((0, 255, 16, 128))
    '#00ff1080'
    """
    assert 3 <= len(color_dec) <= 4 and all(0 <= x <= 255 for x in color_dec), \
        f"Should be a triple with integers between 0 and 255. Was {color_dec}"
    return '#' + ''.join(map(dec_to_hex, color_dec))


def color_hex_from(color_spec):
    if isinstance(color_spec, str):
        if color_spec in hex_for_color:
            return hex_for_color[color_spec]
        else:
            return color_hex_to_color_hex(color_spec)  # just to normalize (expand #123 short-hands)
    elif isinstance(color_spec, Iterable) and 3 <= len(color_spec) <= 4:
        return color_dec_to_hex(color_spec)
    else:
        raise ValueError(f"color spec must be a recognized color, "
                         f"an hex color spec (starting with #) or a rgb triple. Was: {color_spec}")


class _HexColor:
    """A convenience class to access color hex codes from color names and short-hands"""

    def __init__(self):
        for _color, _color_hex in hex_for_color.items():
            setattr(self, _color.replace(' ', '_'), _color_hex)

    def __iter__(self):
        yield from hex_for_color


hex_color = _HexColor()
