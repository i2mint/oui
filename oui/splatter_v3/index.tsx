import * as React from 'react';

import * as _ from 'lodash';
import {
    action,
    computed,
    IObservableArray,
    makeObservable,
    observable,
    ObservableMap,
} from 'mobx';
import { observer } from 'mobx-react';
import { UMAP } from 'umap-js';

import Plot from 'react-plotly.js';

const FV_SIZE: number = 22;
const N_FVS: number = 1000;
const DFLT_NODE_COLOR: string = '#333838';
// const DFLT_NODE_SHAPE: string = 'circle';
// const DFLT_NODE_SIZE: number = 5;
const DFLT_ANIMATION_DURATION: number = 5;
const DFLT_COLOR_KEY: string = 'tag';
const DFLT_COLORS: string[] = [
  '#ff0000',
  '#00ffe6',
  '#ffc300',
  '#8c00ff',
  '#ff5500',
  '#0048ff',
  '#3acc00',
  '#ff00c8',
  '#fc8383',
  '#1fad8c',
  '#bbf53d',
  '#b96ef7',
  '#bf6a40',
  '#0d7cf2',
  '#6ef777',
  '#ff6699',
  '#a30000',
  '#004d45',
  '#a5750d',
  '#460080',
  '#802b00',
  '#000680',
  '#1d6600',
  '#660050',
];

interface IProps {
    animationDuration?: number;
    backgroundColor?: string;
    colorKey?: string;
    colors?: string[];
    // getNodeColor: (node: any) => string = null;
    // getNodeShape: (node: any) => string = null;
    // getNodeSize: (node: any) => number = null;
    // getNodeText: (node: any) => string = null;
    defaultColor?: string;
    height?: number;
    hidden?: boolean;
    hideTooltips?: boolean;
    key?: string;
    loadingElement?: JSX.Element;
    markSelected?: boolean;
    onClick?: (node: any, data: any) => void;
    onDeselect?: (data: any) => void;
    onDoubleClick?: (data: any) => void;
    // onHover?: (data: any) => void;
    onSelect?: (data: any) => void;
    // onUnhover?: (data: any) => void;
    parentStore?: any;
    tooltipKey?: string;
    tooltipTemplate?: string;
    width?: number;
}

export default observer(
    class Splatter extends React.Component<IProps, any> {
        colorList: string[] = [];
        colorMap: ObservableMap = observable.map();
        colorValues: string[] = null;
        fvs: number[][] = [];
        maxSteps: number = 0;
        nodes: IObservableArray<any> = observable.array([]);
        step: number = 0;
        stepsPerFrame: number = 1;
        stopped: boolean = true;
        traces: any[] = [];
        umap: any = null;
        constructor(props) {
            super(props);
            console.log('constructing!');
            makeObservable(this, {
                addColor: action,
                handleDeselect: action,
                handleSelect: action,
                iterate: action,
                draw: action,
                selectedNodes: computed,
                setNodes: action,
                setRawNodes: action,
                traces: observable,
            });
            if (props.parentStore) {
                props.parentStore.splatterChart = this;
                if (props.parentStore.initSplatter) {
                    props.parentStore.initSplatter();
                }
            }
            window['splatterChart'] = this;
        }

        initUMAP() {
            this.umap = new UMAP();
            // const now: number = Date.now();
            this.maxSteps = this.umap.initializeFit(this.fvs);
            const duration: number = this.maxSteps / 60;
            const animationDuration: number = this.props.animationDuration || DFLT_ANIMATION_DURATION;
            this.stepsPerFrame = Math.ceil(duration / animationDuration);
            // const later: number = Date.now();
        }

        iterate() {
            for (let i: number = 0; i < this.stepsPerFrame; i++) {
                this.step++;
                this.umap.step();
                const posnsInner = this.umap.getEmbedding();
                for (let j: number = 0; j < posnsInner.length; j++) {
                    const node: any = this.nodes[j];
                    if (!node) {
                        return;
                    }
                    const position: [number, number] = posnsInner[j];
                    node.x = position[0];
                    node.y = position[1];
                }
            }
        }

        setNodes(nodes: IObservableArray<any>): void {
            this.nodes = nodes;
            this.step = 0;
            this.stopped = true;
            const fvs = nodes.map((node) => node.fv);
            this.fvs = fvs;
        }

        setRawNodes(rawNodes: any[]): void {
            this.nodes.replace(_.map(rawNodes, (node: any) => ({
                ...node,
                selected: node.selected || false,
                x: node.x || 0,
                y: node.y || 0,
            })));
            this.step = 0;
            this.stopped = true;
            const fvs = rawNodes.map((node) => node.fv);
            this.fvs = fvs;
        }

        handleAnimation(): void {
            this.iterate();
            this.draw();
            if (this.step >= this.maxSteps) {
                this.stopped = true;
                return;
            }
            window.requestAnimationFrame(this.animate);
        };

        loadNodes(nodes: IObservableArray): void {
            this.setNodes(nodes);
            this.setColors(nodes);
            this.initUMAP();
            this.startAnimation();
        }

        loadRandomNodes(): void {
            const randomNodes: any[] = [];
            for (let i: number = 0; i < N_FVS; i++) {
                const tagIndex: number = i % 4;
                const tag: string = tagIndex > 0 ? `tag_${tagIndex}` : undefined;
                const newNode: any = {
                    fv: [],
                    selected: false,
                    tag,
                    x: _.random(0, 100, true),
                    y: _.random(0, 100, true),
                };
                for (let j: number = 0; j < FV_SIZE; j++) {
                    newNode.fv.push(_.random(0, 350, true));
                }
                randomNodes.push(newNode);
            }
            this.setRawNodes(randomNodes);
            this.setColors(randomNodes);
            this.initUMAP();
            this.startAnimation();
        }

        setColors(nodes): void {
            this.colorList = [];
            this.colorMap = observable.map();
            const colorKey: string = this.props.colorKey || DFLT_COLOR_KEY;
            this.colorValues = _.filter(_.map(_.uniqBy(nodes, colorKey), colorKey));
            if (this.props.colors) {
                this.colorList = this.props.colors.slice();
                this.colorList.push(...DFLT_COLORS);
            } else {
                this.colorList = DFLT_COLORS.slice();
            }
            for (let i: number = 0; i < this.colorValues.length; i++) {
                this.colorMap.set(this.colorValues[i], this.colorList[i]);
            }
        }

        addColor(value): void {
            this.colorValues.push(value);
            this.colorMap.set(value, this.colorList[this.colorValues.length - 1]);
        }

        stop() {
            this.stopped = true;
        }

        animate: () => void = () => {
            if (!this.stopped) {
                this.handleAnimation();
            }
        }

        startAnimation() {
            this.stopped = false;
            this.animate();
        }

        animateBriefly() {
            this.startAnimation();
            window.setTimeout(() => this.stop(), 3000);
        }

        // getNodeFromEventData(data: any) {
        //
        // }

        handleClick: (data: any) => void = (data: any) => {
            if (this.props.onClick) {
                let node: any = null;
                if (data.points && data.points.length && data.points[0].data &&
                    data.points[0].data.nodeIndices) {
                    const pointIndex: number = data.points[0].pointIndex;
                    const nodeIndex: number = data.points[0].data.nodeIndices[pointIndex];
                    node = this.nodes[nodeIndex];
                }
                this.props.onClick(node, data);
            }
        }

        handleDoubleClick: (data: any) => void = (data: any) => {
            if (this.props.onDoubleClick) {
                this.props.onDoubleClick(data);
            }
        }

        handleDeselect: (data: any) => void = (data: any) => {
            if (this.props.onDeselect) {
                this.props.onDeselect(data);
            } else if (this.props.markSelected) {
                for (let i: number = 0; i < this.selectedNodes.length; i++) {
                    this.selectedNodes[i].selected = false;
                }
            }
        }

        handleSelect: (data: any) => void = (data: any) => {
            if (this.props.onSelect) {
                this.props.onSelect(data);
            }
            if (this.props.markSelected) {
                console.log('marking selected nodes');
                this.traces.forEach((trace: any, i: number) => {
                    if (trace.selectedpoints && trace.selectedpoints.length && trace.nodeIndices &&
                        trace.nodeIndices.length) {
                        console.log(`selections for trace ${i}`, trace.selectedpoints.slice(), trace.nodeIndices.slice());
                        trace.selectedpoints.forEach((pointIndex: number) => {
                            const nodeIndex: number = trace.nodeIndices[pointIndex];
                            if (nodeIndex) {
                                const node: any = this.nodes[nodeIndex];
                                if (node) {
                                    console.log(`Selected node ${i} ${pointIndex} ${nodeIndex}`);
                                    node.selected = true;
                                }
                            }
                        });
                    }
                });
            }
        }

        // handleHover(data: any): void {
        //     if (this.onHover) {
        //         this.onHover(data);
        //     }
        // }
        //
        // handleUnhover(data: any): void {
        //     if (this.onUnhover) {
        //         this.onUnhover(data);
        //     }
        // }

        draw(): void {
            const basicTrace: any = {
                hoverinfo: this.props.hideTooltips ? 'none' : undefined,
                hovertemplate: !this.props.hideTooltips ?
                    this.props.tooltipTemplate || '%{text}<extra></extra>' : undefined,
                mode: 'markers',
                nodeIndices: [],
                type: 'scattergl',
                text: [],
                x: [],
                y: [],
            };
            const key: string = this.props.colorKey || DFLT_COLOR_KEY;
            const results: any[] = [{
                ..._.cloneDeep(basicTrace),
                marker: { color: this.props.defaultColor || DFLT_NODE_COLOR },
                name: 'none',
            }];
            _.forEach(this.colorValues, (value: string) => {
                results.push({
                    ..._.cloneDeep(basicTrace),
                    marker: { color: this.colorMap.get(value) },
                    name: value,
                });
            });
            let lastTraceIndex: number = results.length;
            for (let i: number = 0; i < this.nodes.length; i++) {
                let traceIndex: number = lastTraceIndex;
                const node: any = this.nodes[i];
                let colorValue: any = node[key];
                if (!colorValue) {
                    colorValue = '';
                    traceIndex = 0;
                } else {
                    colorValue = colorValue + '';
                    traceIndex = _.indexOf(this.colorValues, colorValue);
                    if (traceIndex < 0) {
                        this.addColor(colorValue);
                        const newTrace = {
                            ..._.cloneDeep(basicTrace),
                            marker: { color: this.colorMap.get(colorValue) },
                            name: colorValue,
                        };
                        results.push(newTrace);
                        lastTraceIndex++;
                        i--;
                        continue;
                    } else {
                        traceIndex++;
                    }
                }
                if (traceIndex < 0) {
                    console.log('did not continue');
                }
                results[traceIndex].text.push(colorValue);
                results[traceIndex].x.push(node.x);
                results[traceIndex].y.push(node.y);
                results[traceIndex].nodeIndices.push(i);
            }
            if (results.length === 1) {
                results[0].hoverinfo = 'none';
            }
            this.traces = results;
        }

        get selectedNodes(): any[] {
            return this.nodes.filter((node: any) => !!node.selected);
        }

        render() {
            return (
                <div className="splatter-container" style={{ display: this.props.hidden ? 'none' : 'block' }}>
                    {!!this.props.loadingElement &&
                        <div className="splatter-loading">{this.props.loadingElement}</div>
                    }
                    {!this.props.loadingElement &&
                        <Plot
                            data={this.traces}
                            layout={{
                                autosize: true,
                                height: this.props.height || 400,
                                hovermode: 'closest',
                                paper_bgcolor: this.props.backgroundColor || undefined,
                                plot_bgcolor: this.props.backgroundColor || undefined,
                                title: '',
                                xaxis: {
                                    autorange: true,
                                    range: [0, 150],
                                    showgrid: false,
                                    showline: false,
                                    showticklabels: false,
                                    type: 'linear',
                                    zeroline: false,
                                },
                                yaxis: {
                                    autorange: true,
                                    range: [0, 150],
                                    showgrid: false,
                                    showline: false,
                                    showticklabels: false,
                                    type: 'linear',
                                    zeroline: false,
                                },
                                width: this.props.width || 400,
                            }}
                            config={{
                                displaylogo: false,
                                modeBarButtonsToRemove: [
                                    'hoverClosestCartesian', 'hoverCompareCartesian', 'toggleHover', 'toggleSpikelines'
                                ]
                            }}
                            onClick={this.handleClick}
                            onDeselect={this.handleDeselect}
                            onDoubleClick={this.handleDoubleClick}
                            // onHover={this.handleHover}
                            // onUnhover={this.handleUnhover}
                            onSelected={this.handleSelect}
                        />
                    }
                    {!!this.props.children && (
                        <React.Fragment>
                            {this.props.children}
                        </React.Fragment>
                    )}
                </div>
            );
        }
    }
);
