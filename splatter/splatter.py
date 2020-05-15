from IPython.display import display, Javascript, HTML

js_libs = ['https://otosense-dev-ui.s3.amazonaws.com/static/js/tsne.js',
           'https://otosense-dev-ui.s3.amazonaws.com/static/js/splatter.js']


def splatter(nodes, options):
    return Javascript(f"""
    ((element) => {{
        console.log('HI!');
        require(['splatter'], (splatter) => splatter(element.get(0), {nodes}, {options}))
    }})(element);""", lib=js_libs)
