import * as React from "react";

import { render } from "react-dom";

// import SingleTimeVisExample from './examples/SingleTimeVisExample';
// import SplatterExample from './examples/SplatterExample';
import SplatterPlotlyExample from "./SplatterPlotlyExample";

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
        {/*<SingleTimeVisExample />
                <SplatterExample />*/}
        <SplatterPlotlyExample />
      </React.Fragment>
    );
  }
}
//const rawNodes = [{ fv: [1, 2] }];
render(<OuiExamples />, document.getElementById("root"));
//render(JSX, document.getElementById("root"));
