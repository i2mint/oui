import * as _ from 'lodash';
import {
	action,
	computed,
	IObservableArray,
	makeObservable,
	observable,
	autorun,
} from 'mobx';
import { UMAP } from 'umap-js';

const flattenArray = (arr: any[]) => {
	const xy: number[] = [];
	arr.forEach((node: any) => xy.push(node[0], node[1]));
	return new Float32Array(xy);
};

const arrayToNodes = (arr: any[]) => {
	const nodes: any[] = [];
	arr.forEach((point) => nodes.push({ x: point[0], y: point[1] }));
	return nodes;
};

export default class SplatterChartStore {
	config: any = { defaultColor: '#333', defaultShape: 'circle', nodeSize: 6 };
	nodes: IObservableArray<any> = observable.array([]);
	initNodes: IObservableArray<any> = observable.array([]);
	umap: any;
	getNodeColor: (node: any) => string = (node: any) => '';
	getNodeShape: (node: any) => string = (node: any) => '';
	stopped: boolean = true;

	constructor(newInitNodes: IObservableArray<any>) {
		window['splatterChart'] = this;
		this.animate = this.animate.bind(this);
		this.setNodes = this.setNodes.bind(this);
		this.setInitNodes = this.setInitNodes.bind(this);

		makeObservable(this, {
			handleAnimation: action,
			nodes: observable,
			setNodes: action,
		});

		this.initNodes = newInitNodes;
		this.initUMAP();

		//autorun(() => this.startAnimation());
		autorun(() => this.animateBriefly());
	}

	initUMAP() {
		this.umap = new UMAP();
		const nEpochs = this.umap.initializeFit(this.initNodes);
		this.umap.step();
		const posnsInner = this.umap.getEmbedding();
		this.setNodes(arrayToNodes(posnsInner));
	}

	setNodes: any = (rawNodes: IObservableArray<any>) =>
		this.nodes.replace(rawNodes);
	setInitNodes: any = (rawInitNodes: IObservableArray<any>) =>
		this.initNodes.replace(rawInitNodes);
	loadInitNodes = (newNodes: IObservableArray<any>) => {
		this.setInitNodes(newNodes);
	};
	handleAnimation: VoidFunction = () => {
		this.umap.step();
		const posnsInner = this.umap.getEmbedding();
		this.setNodes(arrayToNodes(posnsInner));
		window.requestAnimationFrame(this.animate);
	};

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
}
