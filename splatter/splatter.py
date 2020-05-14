from IPython.display import display, Javascript, HTML

Javascript(filename='tsne.js')
Javascript(filename='splatter.js')


def splatter(nodes):
    return Javascript("""
    ((element) => {
        console.log('HI!');
        require(['splatter'], (splatter) => splatter(element.get(0), %s))
    })(element)
    """ % nodes)
