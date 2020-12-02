import * as React from "react";
// import { Provider } from 'mobx-react';

import Splatter from "./Splatter";
// import SplatterChartStore from './splatterChartStore';

interface IProps {
  children?: React.ReactNode;
}

export default class SplatterContainer extends React.Component<IProps, null> {
  // splatterChartStore: SplatterChartStore;
  // constructor(props: IProps) {
  //     super(props);
  //
  //     this.splatterChartStore = new SplatterChartStore();
  // }
  render() {
    return (
      <React.Fragment>
        <Splatter />
        {!!this.props.children && (
          <React.Fragment>{this.props.children}</React.Fragment>
        )}
      </React.Fragment>
    );
  }
}
