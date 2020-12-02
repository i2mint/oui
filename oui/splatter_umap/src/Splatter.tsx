import * as React from "react";
//import React from 'react';
import { /*inject, */ observer } from "mobx-react";
//import Plot from "react-plotly.js";
// plotly error workaround:
// see https://github.com/plotly/react-plotly.js/issues/121
import createPlotlyComponent from "react-plotly.js/factory";
import Plotly from "plotly.js";
import { testData, exampleNormal, make2DMatrix } from "../data/testData.js";

//import Plot from "react-plotly.js";
import SplatterChartStore from "./splatterChartStore";

const Plot = createPlotlyComponent(Plotly);

interface IProps {
  splatterChartStore?: SplatterChartStore;
}

//const splatterChartStore = new SplatterChartStore(testData);
const splatterChartStore = new SplatterChartStore(make2DMatrix(2000, 10));

//const newNodes = splatterChartStore.loadNodes(newNodes);
//console.log(splatterChartStore.nodesXY[0]);

export default observer(
  class Splatter extends React.Component<IProps, any> {
    render() {
      return (
        <div>
          <h1>Splatter </h1>
          <Plot
            data={[
              {
                //x: [0, 1, 2],
                //y: [2, 1, 3],
                x: splatterChartStore.nodesXY.filter((item, i) => i % 2 === 0),
                y: splatterChartStore.nodesXY.filter((item, i) => i % 2 === 1),

                //xy:new Float32Array([1,2,3,4,5,6,0,4]),
                //xy: [(0, 1), (2,3)],
                //xy: splatterChartStore.nodesXY,
                // y: this.props.splatterChartStore.nodesY,
                marker: {
                  color: "red",
                  //color: this.props.splatterChartStore.nodesColor,
                  // shape: this.props.splatterChartStore.nodesShape,
                  size: 5 // this.props.splatterChartStore.nodesSize,
                },
                mode: "markers",
                type: "scattergl"
              }
            ]}
            layout={{
              // datarevision: this.props.splatterChartStore.revision,
              autosize: true,
              height: 400,
              title: "",
              xaxis: {
                autorange: true,
                range: [0, 150],
                type: "linear"
              },
              yaxis: {
                autorange: true,
                range: [0, 150],
                type: "linear"
              },
              width: 400
            }}
          />
        </div>
      );
    }
  }
);
