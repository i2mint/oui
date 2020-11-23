import * as React from 'react';
import WebsocketScrollingVis from '../scrolling_vis/websocket-scrolling-vis';
import ScrollingTimeVis from '../scrolling_vis';

interface IState {
    streamingData: any[];
    timeDomain: number;
}

export default class ScrollingTimeVisExample extends React.Component<any, Partial<IState>> {
    constructor(props: any) {
        super(props);

        this.state = {
            streamingData: [],
            timeDomain: 250000,
        };
        window['addData'] = this.addDataPoint;
    }

    addDataPoint: VoidFunction = () => {
        console.log('adding data point');
        const streamingData: any[] = this.state.streamingData.slice();
        streamingData.push({
            bt: Date.now(),
            value: Math.random(),
        });
        this.setState({ streamingData });
    }

    setTimeDomain: (event: React.ChangeEvent<HTMLInputElement>) => void =
        (event: React.ChangeEvent<HTMLInputElement>) => {
        const timeDomain: number = +event.target.value;
        this.setState({ timeDomain });
    }

    render() {
        return (
            <React.Fragment>
                <h2>Scrolling time visualization</h2>
                <ScrollingTimeVis
                    data={this.state.streamingData}
                    timeDomain={this.state.timeDomain}
                />
                <button
                    onClick={this.addDataPoint}
                >Add random data point</button>
                <h2>From local WebSocket</h2>
                <WebsocketScrollingVis
                    timeDomain={this.state.timeDomain}
                    url={'ws://localhost:3001/streamdata'}
                />
                <div>
                    <label htmlFor="time-domain">Time domain</label>
                    <input
                        onChange={this.setTimeDomain}
                        type="number"
                        value={this.state.timeDomain}
                    /> milliseconds
                </div>
            </React.Fragment>
        );
    }
}
