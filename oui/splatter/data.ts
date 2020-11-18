import * as d3 from 'd3';
import * as _ from 'lodash';

export function getTransformedFVs(rawNodes, method, scalerScope, scaler?) {
    function getZScoreTransformation(items: any[]): any[] {
        const fvLength = items[0].fv.length;
        let stdArr = [];
        let meanArr = [];

        if (scalerScope === 'global' && scaler) {
            stdArr = scaler.scale_;
            meanArr = scaler.mean_;
        } else {
            for (let i = 0; i < fvLength; i++) {
                stdArr[i] = d3.deviation(items, (node) => node.fv[i]);
                meanArr[i] = d3.mean(items, (node) => node.fv[i]);
            }
        }

        return _.map(items, (node) =>
            _.map(node.fv, (fv, i) =>
                stdArr[i] ? (fv - meanArr[i]) / stdArr[i] : 0),
        );
    }

    switch (method) {
        case 'z-score':
        default:
            return getZScoreTransformation(rawNodes);
    }
}