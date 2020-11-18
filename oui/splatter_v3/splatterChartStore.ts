import * as _ from 'lodash';
import { action, computed, IObservableArray, makeObservable, observable } from 'mobx';

export default class SplatterChartStore {
    config: any = { defaultColor: '#333', defaultShape: 'circle', nodeSize: 6 };
    nodes: IObservableArray<any> = observable.array([]);

    getNodeColor: (node: any) => string = (node: any) => '';
    getNodeShape: (node: any) => string = (node: any) => '';
    stopped: boolean = true;

    constructor() {
        window['splatterChart'] = this;
        this.animate = this.animate.bind(this);
        this.setNodes = this.setNodes.bind(this);
        makeObservable(this, {
            handleAnimation: action,
            nodes: observable,
            setNodes: action
        })
    }

    setNodes: any = (rawNodes) => this.nodes.replace(rawNodes);

    loadRandomNodes: VoidFunction = () => {
        const randomNodes: any[] = [];
        for (let i: number = 0; i < 10000; i++) {
            randomNodes.push({
                x: _.random(0, 100),
                y: _.random(0, 100),
                size: _.random(1, 8),
            });
        }
        this.setNodes(randomNodes);
    }
    handleAnimation: VoidFunction = () => {
        for (let i: number = 0; i < this.nodes.length; i++) {
            const wiggleX: number = _.random(-5, 5);
            const wiggleY: number = _.random(-5, 5);
            this.nodes[i].x += wiggleX;
            this.nodes[i].y += wiggleY;
        }
        window.requestAnimationFrame(this.animate);
    }

    stop() {
        this.stopped = true;
    }

    animate() {
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

    // @computed get nodesX(): number[] {
    //     if (!this.nodes || !this.nodes.length) {
    //         return [];
    //     }
    //     return this.nodes.map((node: any) => node.x);
    // }
    //
    // @computed get nodesY(): number[] {
    //     if (!this.nodes || !this.nodes.length) {
    //         return [];
    //     }
    //     return this.nodes.map((node: any) => node.y);
    // }

    @computed get nodesXY(): Float32Array {
        if (!this.nodes || !this.nodes.length) {
            return new Float32Array([]);
        }
        const xy: number[] = [];
        this.nodes.forEach((node: any) => xy.push(node.x, node.y));
        return new Float32Array(xy);
    }

    // @computed get nodesColor(): string[] {
    //     if (!this.nodes || !this.nodes.length) {
    //         return [];
    //     }
    //     return this.nodes.map((node: any) => this.getNodeColor(node) || this.config.defaultColor);
    // }
    //
    // @computed get nodesSize(): string[] {
    //     if (!this.nodes || !this.nodes.length) {
    //         return [];
    //     }
    //     return this.nodes.map((node: any) => node.size || this.config.nodeSize);
    // }

    // @computed get nodesShape(): string[] {
    //     if (!this.nodes || !this.nodes.length) {
    //         return [];
    //     }
    //     return this.nodes.map((node: any) => this.getNodeShape(node) || this.config.defaultShape);
    // }
}
