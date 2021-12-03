// import * as React from 'react';
//
// import Splatter from '../splatter_v3';
// // import SplatterExampleControls from './SplatterExampleControls';
//
// const parentStore: any = {
//     initSplatter() {
//         console.log('time to init!', { thisObject: this, splatterStore: this.splatterChart });
//         this.initialized = true;
//         this.splatterChart.loadRandomNodes();
//     },
//     handleClick(node, data) {
//         console.log({ node, data });
//     },
//     handleDeselect(data) {
//         console.log({ deselect: data });
//     },
//     handleDoubleClick(data) {
//         console.log({ doubleClick: data });
//     },
//     handleSelect(data) {
//         console.log({ select: data });
//     },
// };
//
// parentStore.initSplatter = parentStore.initSplatter.bind(parentStore);
//
// export default class SplatterPlotlyExample extends React.Component<any, any> {
//     constructor(props) {
//         super(props);
//
//         this.state = { splatterOn: true };
//         window['splatterContainer'] = this;
//     }
//
//     toggleSplatter(): void {
//         this.setState({ splatterOn: !this.state.splatterOn });
//     }
//
//     render() {
//         return <Splatter
//             animationDuration={1}
//             backgroundColor="#dfe1e8"
//             colorKey="tag"
//             colors={['yellow', 'green']}
//             hidden={!this.state.splatterOn}
//             markSelected
//             onClick={parentStore.handleClick}
//             onDeselect={parentStore.handleDeselect}
//             onDoubleClick={parentStore.handleDoubleClick}
//             onSelect={parentStore.handleSelect}
//             tooltipKey="tag"
//             height={800}
//             width={800}
//             parentStore={parentStore}
//         />;
//     }
// }
