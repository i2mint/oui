import * as React from 'react';

import SplatterContainer from './index';
// import SplatterExampleControls from './SplatterExampleControls';

export default class SplatterPlotlyExample extends React.Component<any, null> {
	// canvas: HTMLCanvasElement;
	// splatterStore: Splatter;
	// constructor(props: any) {
	//     super(props);
	//
	//     this.splatterStore = new Splatter();
	// }
	//
	// componentDidMount() {
	//     if (this.canvas) {
	//         this.splatterStore.assignCanvas(this.canvas);
	//     }
	// }
	//
	// setCanvasRef: (ref: HTMLCanvasElement) => void = (ref: HTMLCanvasElement) => {
	//     this.canvas = ref;
	//     window['splatterCanvas'] = ref;
	// }

	render() {
		return <SplatterContainer />;
	}
}
