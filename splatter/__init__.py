# import os
#
# containing_dir = os.path.dirname(__file__)
# rjoin = lambda *args: os.path.join(containing_dir, *args)
#
# from IPython.display import display, Javascript, HTML
#
# Javascript(filename=rjoin('tsne.js'))
# Javascript(filename=rjoin('splatter.js'))
#
# print(rjoin('tsne.js'))
# assert os.path.isfile(rjoin('tsne.js'))
# print(rjoin('splatter.js'))
# assert os.path.isfile(rjoin('splatter.js'))
#
#
# def splatter(nodes):
#     return Javascript("""
#     ((element) => {
#         console.log('HI!');
#         require(['splatter'], (splatter) => splatter(element.get(0), %s))
#     })(element)
#     """ % nodes)

from IPython.display import display, Javascript, HTML

js_libs = ['https://otosense-dev-ui.s3.amazonaws.com/static/js/tsne.js',
           'https://otosense-dev-ui.s3.amazonaws.com/static/js/splatter.js']


def splatter(nodes, options):
    return Javascript(f"""
    ((element) => {{
        console.log('HI!');
        require(['splatter'], (splatter) => splatter(element.get(0), {nodes}, {options}))
    }})(element);""", lib=js_libs)