import * as React from 'react';

import { render } from 'react-dom';

import { TimeChannel } from './multi_time_vis';

export default class OuiExamples extends React.Component<any, null> {
    // constructor(props: any) {
    //     super(props);
    //
    //     this.state = { data: null, view: SANDBOX_VIEWS.CHORD_CHART };
    // }

    render() {
        return (
            <React.Fragment>
                <TimeChannel
                    channel={{
                        chartType: 'peaks',
                        from: 0,
                        guid: 'a',
                        to: 6500000,
                        type: 'audio',
                        url: 'https://otosense.analogcloudsandbox.io/static/wav/pcm1644m.wav',
                    }}
                    chartType={'audio'}
                    enablePlayback
                    bt={0}
                    tt={6500000}
                />
            </React.Fragment>
        );
    }
}

render(<OuiExamples />, document.getElementById('root'));
