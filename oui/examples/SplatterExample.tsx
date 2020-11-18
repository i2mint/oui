import * as React from 'react';

import { Splatter } from '../splatter';

export default class SplatterExample extends React.Component<any, null> {
    canvas: HTMLCanvasElement;
    splatterStore: Splatter;
    constructor(props: any) {
        super(props);

        this.splatterStore = new Splatter();
    }

    componentDidMount() {
        if (this.canvas) {
            this.splatterStore.assignCanvas(this.canvas);
        }
    }

    setCanvasRef: (ref: HTMLCanvasElement) => void = (ref: HTMLCanvasElement) => {
        this.canvas = ref;
        window['splatterCanvas'] = ref;
    }

    render() {
        return (
            <React.Fragment>
                <canvas ref={this.setCanvasRef} width={500} height={500}></canvas>
            </React.Fragment>
        );
    }
}
