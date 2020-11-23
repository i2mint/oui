import * as React from 'react';

import * as chroma from 'chroma-js';
import * as d3 from 'd3';
import * as _ from 'lodash';

const DFLT_HEIGHT: number = 300;
const DFLT_WIDTH: number = 1000;
const DFLT_MIN: number = 0;
const DFLT_MAX: number = 1;
const DFLT_STEP_SIZE_MS: number = 250; // 1/4 second
const DFLT_STEP_SIZE_MCS: number = 250000;
const DFLT_TIME_DOMAIN_MS: number = DFLT_STEP_SIZE_MS * DFLT_WIDTH;
const DFLT_TIME_DOMAIN_MCS: number = DFLT_STEP_SIZE_MCS * DFLT_WIDTH;
const DFLT_DATA_KEY: string = 'value';
const DFLT_COLOR: string = '#544';

export enum STREAMING_CHART_TYPES {
    HEATMAP= 'heatmap',
    HEATMAP2D= 'heatmap2d',
    LINEGRAPH= 'linegraph',
    VLINE= 'vline',
}

export interface ScrollingVisProps {
    autoScale?: boolean;
    chartType?: string;
    color?: string;
    colors?: string[];
    data?: any[];
    fixedStep?: number;
    height?: number;
    // lastUpdate: number;
    itemValue?: string;
    max?: number;
    mcs?: boolean;
    min?: number;
    stepSize?: number;
    timeDomain?: number;
    yScale?: (value: any) => any;
    width?: number;
}

export default class ScrollingTimeVis extends React.Component<ScrollingVisProps, any> {
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    displayData: any[] = [];
    offset: number = 0;
    started: boolean = false;
    step: number = 0;
    stopped: boolean = false;
    xScale: (time: any) => number;
    yScale: (value: any) => any;

    componentDidMount() {
        this.makeScale();
    }

    componentWillUnmount() {
        this.stopped = true;
    }

    componentDidUpdate(prevProps: ScrollingVisProps) {
        if (this.props.data && this.props.data.length === 1 &&
            (!prevProps.data || !prevProps.data.length) && !this.started) {
            this.started = true;
            console.log('Start drawing!');
            this.draw();
        }
    }

    makeScale() {
        if (this.props.yScale) {
            this.yScale = this.props.yScale;
        }
        switch (this.props.chartType) {
            case STREAMING_CHART_TYPES.HEATMAP:
            case STREAMING_CHART_TYPES.HEATMAP2D:
                this.yScale = this.makeColorScale();
                break;
            case STREAMING_CHART_TYPES.LINEGRAPH:
            case STREAMING_CHART_TYPES.VLINE:
            default:
                this.yScale = this.makeHeightScale();
        }
    }

    makeColorScale: () => (value: any) => any = () => {
        const min: number = this.props.min || DFLT_MIN;
        const max: number = this.props.max || DFLT_MAX;
        const colors: string[] = this.props.colors && this.props.colors.length ?
            this.props.colors : ['#fffffe', '#000000'];
        return chroma.scale(colors).domain([min, max]);
    }

    makeHeightScale: () => (value: any) => any = () => {
        const height: number = this.props.height || DFLT_HEIGHT;
        const min: number = this.props.min || DFLT_MIN;
        const max: number = this.props.max || DFLT_MAX;
        return d3.scaleLinear().domain([min, max]).range([0, height]);
    }

    setCanvasRef: (ref: HTMLCanvasElement) => void = (ref: HTMLCanvasElement) => {
        console.log('setting canvas ref');
        this.canvas = ref;
        this.ctx = ref.getContext('2d');
    }

    drawHeatmap: VoidFunction = () => {
        return;
    }

    drawHeatmap2d: VoidFunction = () => {
        return;
    }

    drawLinegraph: VoidFunction = () => {
        return;
    }

    drawVlines: (height: number, columnWidth: number) => void = (height: number, columnWidth: number) => {
        let x: number = this.offset || 0;
        const dataKey: string = this.props.itemValue || DFLT_DATA_KEY;
        for (let i: number = 0; i < this.displayData.length; i++) {
            const item: any = this.displayData[i];
            const y: number = this.yScale(item[dataKey]);
            if (!this.props.fixedStep && this.xScale) {
                x = this.xScale(item.bt);
            }
            this.ctx.fillStyle = this.props.color || DFLT_COLOR;
            this.ctx.fillRect(x, height - y, columnWidth, y);
            x += columnWidth;
        }
    }

    draw: VoidFunction = () => {
        if (this.stopped) {
            return;
        }
        const width: number = this.props.width || DFLT_WIDTH;
        const height: number = this.props.height || DFLT_HEIGHT;
        this.ctx.clearRect(0, 0, width, height);
        const stepSize: number = this.props.stepSize || (this.props.mcs ? DFLT_STEP_SIZE_MCS : DFLT_STEP_SIZE_MS);
        const totalColumns: number = this.props.timeDomain ? this.props.timeDomain / stepSize : width;
        const columnWidth: number = width / totalColumns;
        if (!this.props.fixedStep && this.props.data.length && this.props.data[0].bt) {
            let now: number = Date.now();
            if (this.props.mcs) {
                now = now * 1000;
            }
            const timeDomain: number = this.props.timeDomain || (this.props.mcs ? DFLT_TIME_DOMAIN_MCS : DFLT_TIME_DOMAIN_MS);
            this.xScale = d3.scaleLinear().domain([now - timeDomain, now]).range([0, width]);
            this.displayData = _.filter(this.props.data, (item: any) => item.bt > now - timeDomain);
        } else {
            const nColumns: number = this.props.data.length;
            const offset = totalColumns - nColumns;
            if (offset < 0) {
                this.offset = 0;
                this.displayData = this.props.data.slice(this.props.data.length - totalColumns);
            } else {
                this.offset = offset;
                this.displayData = this.props.data;
            }
        }
        switch (this.props.chartType) {
            case STREAMING_CHART_TYPES.HEATMAP:
                this.drawHeatmap();
                break;
            case STREAMING_CHART_TYPES.HEATMAP2D:
                this.drawHeatmap2d();
                break;
            case STREAMING_CHART_TYPES.LINEGRAPH:
                this.drawLinegraph();
                break;
            case STREAMING_CHART_TYPES.VLINE:
            default:
                this.drawVlines(height, columnWidth);
        }
        if (!this.props.fixedStep) {
            window.requestAnimationFrame(this.draw);
        } else {
            window.setTimeout(this.draw, this.props.fixedStep);
        }
    }

    render() {
        console.log('rerender!');
        return (
            <div className="oui-scrolling-vis-container">
                <canvas
                    ref={this.setCanvasRef}
                    height={this.props.height || DFLT_HEIGHT}
                    width={this.props.width || DFLT_WIDTH}
                />
            </div>
        );
    }
}
