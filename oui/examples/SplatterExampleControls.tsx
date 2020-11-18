import * as React from 'react';

import { inject } from 'mobx-react';

import SplatterChartStore from '../splatter_v3/splatterChartStore';

interface IProps {
    splatterChartStore?: SplatterChartStore;
}

@inject('splatterChartStore')
export default class SplatterExampleControls extends React.Component<IProps, null> {
    render() {
        return (
            <button onClick={() => this.props.splatterChartStore.loadRandomNodes()}>
                Load random data
            </button>
        );
    }
}
