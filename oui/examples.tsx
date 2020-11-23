import * as React from 'react';

import { render } from 'react-dom';

import ScrollingTimeVisExample from './examples/ScrollingTimeVisExample';
// import SingleTimeVisExample from './examples/SingleTimeVisExample';

export default class OuiExamples extends React.Component<any, null> {
    // constructor(props: any) {
    //     super(props);
    //
    //     this.state = { data: null, view: SANDBOX_VIEWS.CHORD_CHART };
    // }

    render() {
        return (
            <React.Fragment>
                {/*There should be a picker to choose between different examples. So far, there is only one example.*/}
                {/*<SingleTimeVisExample />*/}
                <ScrollingTimeVisExample />
            </React.Fragment>
        );
    }
}

render(<OuiExamples />, document.getElementById('root'));
