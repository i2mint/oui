import * as d3 from 'd3';
import * as _ from 'lodash';
import tSNE from './tsne';

// interface SplatterNode {
//     bt: number;
//     fv: number;
//     source?: string;
//     x?: number;
//     y?: number;
//     [fieldName: string]: any;
// }

const margin: number = 10;

export class Splatter {
    defaultOptions;
    defaultTsneOptions;
    options;
    tsneOptions;
    svg: any;
    centerx;
    centery;
    tagColors = {};
    tagSet = [];
    iter = 0;
    lastFrame = 0;
    delay: number;
    tsne: any;
    gnodeSelection: any;
    nodeSelection: any;
    nodes;
    update;
    paused;

    constructor() {
        this.draw = this.draw.bind(this);
        return;
    }

    initializeValues() {
        this.tagColors = {};
        this.paused = false;
        this.iter = 0;
        this.tagSet = [];
        this.delay = 1000 / this.options.fps;
        const { width, height } = this.options;
        this.centerx = d3.scaleLinear()
            .range([width / 2 - height / 2 + margin, width / 2 + height / 2 - margin]);
        this.centery = d3.scaleLinear()
            .range([margin, height - margin]);
    }

    getColor(tag: string) {
        return this.tagColors[tag] || this.options.untaggedColor;
    }

    getFv(idx, d) {
        return d.fv[idx];
    }

    getTransformedFVs(rawNodes, method, scalerScope) {
        const getZScoreTransformation: (items: any[]) => void = (items: any[]) => {
            const fvLength = items[0].fv.length;
            let stdArr = [];
            let meanArr = [];

            if (scalerScope === 'global' && this.options.scaler) {
                stdArr = this.options.scaler.scale_;
                meanArr = this.options.scaler.mean_;
            } else {
                for (let i = 0; i < fvLength; i++) {
                    stdArr[i] = d3.deviation(items, this.getFv.bind(this, i));
                    meanArr[i] = d3.mean(items, this.getFv.bind(this, i));
                }
            }

            return _.map(items, (node) =>
                _.map(node.fv, (fv, i) =>
                    stdArr[i] ? (fv - meanArr[i]) / stdArr[i] : 0),
            );
        }
        if (!rawNodes[0] || !rawNodes[0].fv) {
            console.log(`Can't find a fv object inside node`);
            return;
        }

        switch (method) {
            case 'z-score':
            default:
                return getZScoreTransformation(rawNodes);
        }
    }

    initializeDom(element?: HTMLElement) {
        if (!this.svg) {
            this.svg = d3.select(element)
                .append('svg');
        }
        this.svg
            .attr('height', this.options.height)
            .attr('width', this.options.width);
        // .attr('shape-rendering', 'optimizeSpeed');
        const nodesGroup = this.svg.append('g').attr('class', 'nodesGroup')
            .attr('width', this.options.width);
        const gnodes = nodesGroup.selectAll('.gnode')
            .data(this.nodes)
            .enter()
            .append('g')
            .classed('gnode', true);
        gnodes
            .attr('transform', (d) => `translate(${d.x * 40}, ${d.y * 40})`)
            .style('cursor', 'default');

        const node = gnodes.append('circle')
            .classed('node', true);

        node.attr('fill', this.options.untaggedColor)
            .attr('r', this.options.nodeSize);

        return { gnodes, node };
    }

    initTSNE() {
        const fvs = this.getTransformedFVs(this.nodes, 'z-score', 'global');

        this.tsne = new tSNE(this.tsneOptions);
        this.iter = 0;

        this.tsne.initDataRaw(fvs);
        if (window.requestAnimationFrame) {
            window.requestAnimationFrame(this.draw);
        }
    }

    draw() {
        if (!this.paused) {
            window.requestAnimationFrame(this.draw);
        } else {
            console.log('animation finished');
            return;
        }
        const now = Date.now();
        if (now - this.lastFrame < this.delay) {
            return;
        }
        this.lastFrame = now;
        this.tsne.step();
        const posnsInner = this.tsne.getSolution();
        this.centerx.domain(d3.extent(posnsInner.map((d) => d[0])));
        this.centery.domain(d3.extent(posnsInner.map((d) => d[1])));

        for (let i = 0; i < this.nodes.length; i++) {
            this.nodes[i].x = this.centerx(posnsInner[i][0]);
            this.nodes[i].y = this.centery(posnsInner[i][1]);
        }
        this.update();
        this.iter++;
        if (this.iter > this.options.maxIterations) {
            this.paused = true;
        }
    }

    renderNetwork(element, data) {
        this.initializeValues();
        this.nodes = data;
        const { gnodes, node } = this.initializeDom(element);
        this.gnodeSelection = gnodes;
        this.nodeSelection = node;
        this.tagSet = [];
        for (let i = 0; i < this.nodes.length; i++) {
            if (this.nodes[i].tag && !this.tagColors[this.nodes[i].tag]) {
                this.tagSet.push(this.nodes[i].tag);
                this.tagColors[this.nodes[i].tag] = this.options.fillColors[this.tagSet.length - 1];
            }
        }
        // node = node;
        // const colorScale: (arg: any) => string = d3.scaleOrdinal().domain(tagSet).range(options.fillColors);
        // const submitQuickTag = submitQuickTag;

        // let dragEventActive = false;
        // let zoomEventActive = false;
        // const translate: [number, number] = [0, 0];

        // zoom(e) {
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

        // svgMouseUp() {
        //     submitQuickTag();
        //     if (!d3v3.event.shiftKey && !zoomEventActive) {
        //         nodes.forEach((d) => {
        //             d.selected = false;
        //         });
        //         node.attr('stroke', (d) => d.selected ? 'black' : 'none')
        //             .classed('selected', false);

        //     }
        // }

        // dragMove() {
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
        // dragEnd() {
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

        const tooltip = this.svg.append('text')
            .attr('dy', '-0.25em')
            .attr('font-size', '10pt')
            .attr('pointer-events', 'none')
            .attr('text-anchor', 'middle')
            .attr('id', 'TOOLTIPTEST');

        const nodeMouseOver: (item: any) => void = (item: any) => {
            const mouse = d3.mouse(this.svg.node());
            tooltip.attr('y', mouse[1] - 10);
            tooltip.selectAll('tspan')
                .data([item.tag ? item.tag : 'untagged'])
                .attr('dy', (d, i) => i * 15)
                .attr('x', mouse[0] + 5)
                .text((d) => d)
                .enter()
                .append('tspan');
        }

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
        gnodes.on('mousemove', nodeMouseOver)
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
            .on('mouseleave', (d) => {
                tooltip.text('');
            });

        const updateVis: VoidFunction = () => {
            node.attr('fill', (d) => this.getColor(d.tag))
                .attr('r', (d) => d.playing ? 5 : this.options.nodeSize)
                .attr('stroke', (d) => d.selected ? 'black' : 'none')
                .attr('opacity', (d) => d.hidden ? 0.15 : 1);
            gnodes
                .attr('transform', (d) => 'translate(' + [d.x, d.y] + ')');
        }

        // nodeLabels.text((d: any) => d.tag);
        node.attr('fill', (d: any) => this.options.untaggedColor)
            .attr('r', this.options.nodeSize)
            .attr('stroke', (d: any) => d.selected ? 'black' : 'none')
            .classed('selected', (d: any) => d.selected)
            .attr('transform', 'scale(' + (1 / Math.pow(0.25 /* * zoomBehavior.scale()*/, 0.5)) + ')');

        this.update = updateVis;
        if (this.nodes.length < 60) {
            this.tsneOptions.epsilon = Math.max(this.nodes.length / 5, 5);
            this.tsneOptions.perplexity = Math.min(20, this.nodes.length - 1);
        } else {
            this.tsneOptions.epsilon = 50;
            this.tsneOptions.perplexity = 30;
        }
        this.initTSNE();
    }

    load(renderElement, data, userOptions): void {
        const defaultsUrl = 'https://otosense-dev-ui.s3.amazonaws.com/static/js/splatter_defaults.json';
        fetch(defaultsUrl)
        .then((response) => response.json())
        .then((defaults) => {
            this.options = { ...defaults.options, ...(userOptions || {}) };
            const userTsneOptions = userOptions && userOptions.tsne ? userOptions.tsne : {};
            this.tsneOptions = { ...defaults.tsneOptions, ...(userTsneOptions || {}) };
            this.renderNetwork(renderElement, data);
        });
    }

    loadInSvg(svg: SVGElement, data, userOptions): void {
        this.svg = d3.select(svg);
        return this.load(null, data, userOptions);
    }
}

export function splatter(renderElement, data, userOptions): void {
    new Splatter().load(renderElement, data, userOptions);
}
