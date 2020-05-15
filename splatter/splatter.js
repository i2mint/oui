require.undef('splatter');

require.config({
    paths: { 
        d3: 'https://d3js.org/d3.v4.min'
    }
});

console.log('loaded splatter v1.1');

define('splatter', ['d3', 'tsne'], function(d3, TSNE) {
    const defaultFillColors = [
        '#ff0000', '#00ffe6',
        '#ffc300', '#8c00ff',
        '#ff5500', '#0048ff',
        '#3acc00', '#ff00c8',
        '#fc8383', '#1fad8c',
        '#bbf53d', '#b96ef7',
        '#bf6a40', '#0d7cf2',
        '#6ef777', '#ff6699',
        '#a30000', '#004d45',
        '#a5750d', '#460080',
        '#802b00', '#000680',
        '#1d6600', '#660050'];

    const margin = 10;
    const defaultOptions = {
        fillColors: defaultFillColors.slice(),
        fps: 60,
        height: 200,
        maxIterations: 240,
        nodeSize: 1,
        untaggedColor: '#444',
        width: 200,
    };
    const defaultTsneOptions = {
        dim: 2,
        epsilon: 50,
        initial: 'current',
        // measure: 'euclidean',
        perplexity: 30,
        spread: 10,
    };
    let options = Object.assign({}, defaultOptions);
    let tsneOptions = Object.assign({}, defaultTsneOptions);
    let svg;
    let centerx;
    let centery;
    let tagColors = {};
    let tagSet = [];
    let iter = 0;
    let lastFrame = 0;
    let delay;
    let tsne;
    let nodes;
    let update;
    let paused;

    function initializeValues() {
        tagColors = {};
        paused = false;
        iter = 0;
        tagSet = [];
        delay = 1000 / options.fps;
        const { width, height } = options;
        centerx = d3.scaleLinear()
            .range([width / 2 - height / 2 + margin, width / 2 + height / 2 - margin]);
        centery = d3.scaleLinear()
            .range([margin, height - margin]);
    }

    function getColor(tag) {
        return tagColors[tag];
    }

    function getFv(idx, d) {
        return d.fv[idx];
    }
    function getTransformedFVs(rawNodes, method, scalerScope) {
        function getZScoreTransformation(items) {
            const fvLength = items[0].fv.length;
            let stdArr = [];
            let meanArr = [];

            if (scalerScope === 'global' && options.scaler) {
                stdArr = options.scaler.scale_;
                meanArr = options.scaler.mean_;
            } else {
                for (let i = 0; i < fvLength; i++) {
                    stdArr[i] = d3.deviation(items, getFv.bind(null, i));
                    meanArr[i] = d3.mean(items, getFv.bind(null, i));
                }
            }

            return _.map(items, (node) =>
                _.map(node.fv, (fv, i) =>
                     stdArr[i] ? (fv - meanArr[i]) / stdArr[i] : 0),
            );
        }
        if (!rawNodes[0] || !rawNodes[0].fv) {
            console.log('Can\'t find a fv object inside node');
            return;
        }

        switch (method) {
            case 'z-score':
            default:
                return getZScoreTransformation(rawNodes);
        }
    }
    function initializeDom(element) {
        svg = d3.select(element)
            .append('svg')
            .attr('height', options.height)
            .attr('width', options.width);
            // .attr('shape-rendering', 'optimizeSpeed');
        const nodesGroup = svg.append('g').attr('class', 'nodesGroup')
            .attr('width', options.width);
        const gnodes = nodesGroup.selectAll('.gnode')
            .data(nodes)
            .enter()
            .append('g')
            .classed('gnode', true);
        gnodes
            .attr('transform', (d) => `translate(${d.x * 40}, ${d.y * 40})`)
            .style('cursor', 'default');

        const node = gnodes.append('circle')
            .classed('node', true);

        node.attr('fill', options.untaggedColor)
            .attr('r', options.nodeSize);

        return { gnodes, node };
    }

    function initTSNE() {
        const fvs = getTransformedFVs(nodes, 'z-score', 'global', options);

        tsne = new TSNE(tsneOptions);
        iter = 0;

        tsne.initDataRaw(fvs);
        if (window.requestAnimationFrame) {
            window.requestAnimationFrame(draw);
        }
    }

    function draw() {
        if (!paused) {
            window.requestAnimationFrame(draw);
        } else {
            console.log('animation finished');
            return;
        }
        const now = Date.now();
        if (now - lastFrame < delay) {
            return;
        }
        lastFrame = now;
        tsne.step();
        const posnsInner = tsne.getSolution();
        centerx.domain(d3.extent(posnsInner.map((d) => d[0])));
        centery.domain(d3.extent(posnsInner.map((d) => d[1])));

        for (let i = 0; i < nodes.length; i++) {
            nodes[i].x = centerx(posnsInner[i][0]);
            nodes[i].y = centery(posnsInner[i][1]);
        }
        update();
        iter++;
        if (iter > options.maxIterations) {
            paused = true;
        }
    }

    function splatter(element, data, userOptions) {
        options = Object.assign({}, defaultOptions, (userOptions || {}));
        const userTsneOptions = userOptions && userOptions.tsne ? userOptions.tsne : {};
        tsneOptions = Object.assign({}, defaultTsneOptions, userTsneOptions);
        initializeValues();
        nodes = data;
        const { gnodes, node } = initializeDom(element);
        tagSet = [];
        for (let i = 0; i < nodes.length; i++) {
            if (nodes[i].tag && !tagColors[nodes[i].tag]) {
                tagSet.push(nodes[i].tag);
                tagColors[nodes[i].tag] = options.fillColors[tagSet.length - 1];
            }
        }
        // node = node;
        const colorScale = d3.scaleOrdinal().domain(tagSet).range(options.fillColors);
        // const submitQuickTag = submitQuickTag;

        let dragEventActive = false;
        let zoomEventActive = false;
        const translate = [0, 0];

        // function zoom(e) {
        //     if (dragEventActive) {
        //         zoomBehavior.translate(translate);
        //         return;
        //     }
        //     zoomEventActive = true;
        //     translate[0] = d3v3.event.translate[0];
        //     translate[1] = d3v3.event.translate[1];
        //     d3.selectAll('.nodesGroup').attr('transform', 'translate(' + translate +
        //         ')scale(' + d3v3.event.scale + ')');

        //     // var scale = zoomBehaviour.scale() > 2.0 ? 1 / zoomBehaviour.scale() * 2 : null;
        //     const scale = 1 / Math.pow(0.25 * zoomBehavior.scale(), 0.5);
        //     node.attr('transform', scale ? 'scale(' + scale + ')' : null); // this is just the circle

        //     d3.selectAll('.nodesGroup').selectAll('text')
        //         .attr('transform', (scale && scale < 0.5) ? 'scale(0.125)' : null)
        //         .attr('y', (scale && scale < 0.5) ? -4 : -2);
        // }

        // const zoomBehavior: any = d3v3.behavior.zoom()
        //     .scaleExtent([.2, 32])
        //     .on('zoom', zoom)
        //     .on('zoomend', () => zoomEventActive = false);

        // function svgMouseUp() {
        //     submitQuickTag();
        //     if (!d3v3.event.shiftKey && !zoomEventActive) {
        //         nodes.forEach((d) => {
        //             d.selected = false;
        //         });
        //         node.attr('stroke', (d) => d.selected ? 'black' : 'none')
        //             .classed('selected', false);

        //     }
        // }

        // function dragMove() {
        //     if (!d3v3.event.sourceEvent.shiftKey) {
        //         return;
        //     }
        //     dragEventActive = true;
        //     // stopAllPhysics();
        //     if (!rectSelection.attr('initX')) {
        //         rectSelection
        //             .attr('initX', d3v3.event.sourceEvent.offsetX)
        //             .attr('initY', d3v3.event.sourceEvent.offsetY)
        //             .attr('offX', d3v3.event.x - d3v3.event.sourceEvent.offsetX)
        //             .attr('offY', d3v3.event.y - d3v3.event.sourceEvent.offsetY);
        //     }

        //     const x = +rectSelection.attr('initX');
        //     const y = +rectSelection.attr('initY');
        //     const offX = +rectSelection.attr('offX');
        //     const offY = +rectSelection.attr('offY');
        //     const thisWidth = d3v3.event.x - x - offX;
        //     const thisHeight = d3v3.event.y - y - offY;

        //     rectSelection.attr('hidden', null)
        //         .attr('height', Math.abs(thisHeight))
        //         .attr('width', Math.abs(thisWidth))
        //         .attr('x', thisWidth < 0 ? x + thisWidth : x)
        //         .attr('y', thisHeight < 0 ? y + thisHeight : y);
        // }

        // // done dragging in the svg; create a selection
        // function dragEnd() {
        //     dragEventActive = false;
        //     const x = (+rectSelection.attr('x') - zoomBehavior.translate()[0]) / zoomBehavior.scale();
        //     const y = (+rectSelection.attr('y') - zoomBehavior.translate()[1]) / zoomBehavior.scale();
        //     const thisWidth = (+rectSelection.attr('width')) / zoomBehavior.scale();
        //     const thisHeight = (+rectSelection.attr('height')) / zoomBehavior.scale();

        //     node.each((d, i) => {
        //         if ((d.x > x) && (d.x < x + thisWidth) && (d.y > y) && (d.y < y + thisHeight)) {
        //             d.selected = true;
        //         }
        //     });

        //     node.attr('stroke', (d) => d.selected ? 'black' : 'none')
        //         .classed('selected', (d) => d.selected);

        //     rectSelection
        //         .attr('hidden', 'null')
        //         .attr('height', null)
        //         .attr('initX', null)
        //         .attr('width', null)
        //         .attr('x', null)
        //         .attr('y', null);
        // }

        // const dragBehavior = d3v3.behavior.drag()
        //     .on('drag', dragMove)
        //     .on('dragend', dragEnd);

        // d3v3.select('.splattersvg')
        //     .call(dragBehavior)
        //     .on('mouseup', svgMouseUp)
        //     .call(zoomBehavior);

        // rectSelection = svg.append('rect')
        //     .attr('class', 'rectangularSelection')
        //     .attr('fill', 'grey')
        //     .attr('opacity', 0.4)
        //     .attr('stroke', 'black');

        // const tooltip = svg.append('text')
        //     .attr('dy', '-0.25em')
        //     .attr('font-size', '10pt')
        //     .attr('pointer-events', 'none')
        //     .attr('text-anchor', 'middle')
        //     .attr('id', 'TOOLTIPTEST');

        // function nodeMouseOver(item: any) {
        //     tooltip.attr('y', d3.mouse(svg.node())[1] - 10);
        //     tooltip.selectAll('tspan')
        //         .data([item.tag ? item.tag : 'untagged'])
        //         .attr('dy', (d, i) => i * 15)
        //         .attr('x', d3.event.x)
        //         .text((d) => d)
        //         .enter()
        //         .append('tspan');
        // }

        // hoverNodeIndicator = (newNode: SplatterNode) => {
        //     gnodes.filter((d) => d.name === newNode.name)
        //         .transition()
        //         .duration(100)
        //         .attr('transform', (d) => `translate(${d.x},${d.y})scale(1.4)`);
        // };

        // unhoverNodeIndicator = (newNode: SplatterNode) => {
        //     gnodes.filter((d) => d.name === newNode.name)
        //         .transition()
        //         .duration(100)
        //         .attr('transform', (d) => `translate(${d.x},${d.y})scale(1)`);
        // };

        // let doubleClickMs = 0;
        // const doubleClickThreshold = 200;

        // gnodes.on('dblclick', (d) => {
        //         doubleClickMs = Date.now();
        //         playNode(d);
        //         d3.event.stopPropagation();
        //     })
        //     .on('click', (d) => {
        //         const now = Date.now();
        //         const x = d3.event.pageX;
        //         const y = d3.event.pageY;
        //         if (now - doubleClickMs > doubleClickThreshold) {
        //             setTimeout(() => {
        //                 if (now - doubleClickMs > doubleClickThreshold) {
        //                     d.selected = !d.selected;
        //                     openQuickTag(d, x, y);
        //                     // tsne.stop();
        //                     update();
        //                 }
        //             }, doubleClickThreshold);
        //         }
        //     })
        //     .on('mousemove', nodeMouseOver)
        //     .on('mouseleave', (d) => {
        //         tooltip.text('');
        //     });

        function updateVis() {
            node.attr('fill', (d) => getColor(d.tag))
                .attr('r', (d) => d.playing ? 5 : options.nodeSize)
                .attr('stroke', (d) => d.selected ? 'black' : 'none')
                .attr('opacity', (d) => d.hidden ? 0.15 : 1);
            gnodes
                .attr('transform', (d) => 'translate(' + [d.x, d.y] + ')');
        }

        // nodeLabels.text((d: any) => d.tag);
        node.attr('fill', (d) => '#444')
            .attr('r', options.nodeSize)
            .attr('stroke', (d) => d.selected ? 'black' : 'none')
            .classed('selected', (d) => d.selected)
            .attr('transform', 'scale(' + (1 / Math.pow(0.25 /* * zoomBehavior.scale()*/, 0.5)) + ')');

        update = updateVis;
        if (nodes.length < 60) {
            tsneOptions.epsilon = Math.max(nodes.length / 5, 5);
            tsneOptions.perplexity = Math.min(20, nodes.length - 1);
        } else {
            tsneOptions.epsilon = 50;
            tsneOptions.perplexity = 30;
        }
        initTSNE();
    }

    return splatter;
});
