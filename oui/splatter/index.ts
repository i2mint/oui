import * as d3 from 'd3';
import * as _ from 'lodash';
import { getTransformedFVs } from './data';
import tSNE from './tsne';

// interface SplatterNode {
//     bt: number;
//     fv: number;
//     source?: string;
//     x?: number;
//     y?: number;
//     [fieldName: string]: any;
// }

const FV_LENGTH: number = 6;

const margin: number = 10;

export class Splatter {
    canvas: HTMLCanvasElement;
    colorScale: (node: any) => string;
    context: CanvasRenderingContext2D;
    defaultOptions;
    defaultTsneOptions;
    options: any = {
        defaultColor: '#777',
        nodeSize: 2,
    };
    tsneOptions;
    centerx;
    centery;
    tagColors = {};
    tagSet = [];
    iter = 0;
    lastFrame = 0;
    delay: number;
    tsne: any;
    nodes;
    paused;

    constructor() {
        this._update = this._update.bind(this);
        window['splatterStore'] = this;
    }

    public loadInCanvas(canvas: HTMLCanvasElement, data, userOptions): void {
        this.canvas = canvas;
        this.context = canvas.getContext('2d');
        this._load(data, userOptions);
    }

    public loadInContainer(renderElement: HTMLElement, data, userOptions): void {
        if (!this.canvas) {
            this._initCanvas();
        }
        renderElement.appendChild(this.canvas);
        this._load(data, userOptions);
    }

    public loadRandomNodes(data, userOptions, renderElement?: HTMLDivElement) {
        const randomNodes: any[] = [];
        for (let i: number = 0; i < 300; i++) {
            const fv: number[] = [];
            for (let j: number = 0; j < FV_LENGTH; j++) {
                fv.push(_.random(0, 350));
            }
            randomNodes.push({
                fv,
            });
        }
        if (renderElement) {
            this.loadInContainer(renderElement, randomNodes, userOptions);
        } else {
            this._load(randomNodes, userOptions);
        }
    }

    public assignCanvas(canvas: HTMLCanvasElement): void {
        this.canvas = canvas;
        this.context = canvas.getContext('2d');
    }

    private _initializeValues() {
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

    private _getColor(node: any): string {
        if (this.colorScale) {
            return this.colorScale(node);
        }
        if (this.tagColors) {
            return this.tagColors[node.tag];
        }
        return this.options.untaggedColor;
    }

    private _initTSNE(): void {
        const fvs = getTransformedFVs(this.nodes, 'z-score', 'global', this.tsneOptions.scaler || null);

        this.tsne = new tSNE(this.tsneOptions);
        this.iter = 0;

        this.tsne.initDataRaw(fvs);
        if (window.requestAnimationFrame) {
            window.requestAnimationFrame(this._update);
        }
    }

    private _update(): void {
        if (!this.paused) {
            window.requestAnimationFrame(this._update);
        } else {
            console.log('animation finished');
            return;
        }
        const now = Date.now();
        // console.log({ now });
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
        this.iter++;
        if (this.iter > this.options.maxIterations) {
            this.paused = true;
        }
        this._draw();
    }

    private _draw() {
        if (!this.canvas) {
            this._initCanvas();
        }
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        _.forEach(this.nodes, (node: any) => this._drawNode(node));
    }

    private _drawNode(node: any): void {
        this.context.beginPath();
        this.context.arc(node.x, node.y, this.options.nodeRadius || 2, 0, 2 * Math.PI);
        this.context.fillStyle = this._getColor(node);
        this.context.fill();
        return;
    }

    private _formatNode(rawNode: any): any {
        let node: any = rawNode;
        if (Array.isArray(rawNode)) {
            node = { fv: rawNode };
        }
        return {
            ...node,
            selected: node.selected || false,
            tag: node.tag || '',
            x: node.x || 0,
            y: node.y || 0,
        }
    }

    private _initCanvas(): void {
        this.canvas = document.createElement('canvas');
        this.context = this.canvas.getContext('2d');
    }

    private _load(data, userOptions): void {
        if (!this.canvas) {
            console.error('Unable to load splatter without a canvas. Use the loadInCanvas or')
        }
        const defaultsUrl = 'https://otosense-dev-ui.s3.amazonaws.com/static/js/splatter_defaults.json';
        fetch(defaultsUrl)
        .then((response) => response.json())
        .then((defaults) => {
            this.options = { ...defaults.options, ...(userOptions || {}) };
            const userTsneOptions = userOptions && userOptions.tsne ? userOptions.tsne : {};
            this.tsneOptions = { ...defaults.tsneOptions, ...(userTsneOptions || {}) };
            // extra defaults
            // if (data.length < 60) {
            //     this.tsneOptions.epsilon = Math.max(data.length / 5, 5);
            //     this.tsneOptions.perplexity = Math.min(20, data.length - 1);
            // } else {
            //     this.tsneOptions.epsilon = 50;
            //     this.tsneOptions.perplexity = 30;
            // }
            this.nodes = _.map(data, this._formatNode);
            this._initializeValues();
            this._initTSNE();
            this._update();
        });
    }
}

export function splatter(renderElement, data, userOptions): void {
    new Splatter().loadInContainer(renderElement, data, userOptions);
}
