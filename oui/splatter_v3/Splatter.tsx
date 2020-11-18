import * as React from 'react';

import { /*inject, */observer } from 'mobx-react';
import Plot from 'react-plotly.js';

import SplatterChartStore from './splatterChartStore';

interface IProps {
    splatterChartStore?: SplatterChartStore;
}

const splatterChartStore = new SplatterChartStore();

export default observer(class Splatter extends React.Component<IProps, any> {
    render() {
        return (
            <div>
                <h1>Splatter</h1>
                <Plot
                    data={[
                        {
                            xy: splatterChartStore.nodesXY,
                            // y: this.props.splatterChartStore.nodesY,
                            marker: {
                                // color: this.props.splatterChartStore.nodesColor,
                                // shape: this.props.splatterChartStore.nodesShape,
                                size: 2, // this.props.splatterChartStore.nodesSize,
                            },
                            mode: 'markers',
                            type: 'pointcloud',
                        }
                    ]}
                    layout={{
                        // datarevision: this.props.splatterChartStore.revision,
                        autosize: false,
                        height: 300,
                        title: '',
                        xaxis: {
                            autorange: false,
                            range: [0, 150],
                            type: 'linear',
                        },
                        yaxis: {
                            autorange: false,
                            range: [0, 150],
                            type: 'linear',
                        },
                        width: 300,
                    }}
                />
            </div>
        );
    }
})
