import * as _ from 'lodash';

import { DataPoint } from './TimeChannel';

/*
 * The naming convention uses funcNameDPA, which stands for DataPoint Array.
 * None of these arrays should modify the contents of the array its being passed.
 * Obviously all of these arrays should follow the given signature.
 * Filter params can always be empty, so the function should check for that.
 */

export function normalizeDPA(params: any, data: DataPoint[]): DataPoint[] {
    const maxVal: number = _.maxBy(data, (dPoint: DataPoint) => dPoint.value).value;
    const minVal: number = _.minBy(data, (dPoint: DataPoint) => dPoint.value).value;
    return _.map(data, (dPoint: DataPoint) => {
        const copy = JSON.parse(JSON.stringify(dPoint));
        if (dPoint.value === null) {
            return copy;
        }
        if (maxVal === minVal) {
            copy.value = 1;
        } else {
            copy.value = (dPoint.value - minVal) / (maxVal - minVal);
        }
        return copy;
    });
}

export function categorizeAndNormalizeDPA(params: any, data: DataPoint[]): DataPoint[] {
    return _.map(data, (dPoint: DataPoint) => {
        const copy = JSON.parse(JSON.stringify(dPoint));
        if (dPoint.value === null) {
            return copy;
        }
        copy.value = (params.categories.indexOf(dPoint.value) + 1) / params.categories.length;
        return copy;
    });
}

// Min and Max stay between calls as long as params remain
export function dynamicNormalizeDPA(params: any, data: DataPoint[]): DataPoint[] {
    const maxVal: number = _.maxBy(data, (dPoint: DataPoint) => dPoint.value).value;
    if (params && (!('_max' in params) || params._max < maxVal)) {
        params._max = maxVal;
    }
    const minVal: number = _.minBy(data, (dPoint: DataPoint) => dPoint.value).value;
    if (params && (!('_min' in params) || params._min > minVal)) {
        params._min = minVal;
    }
    return _.map(data, (dPoint: DataPoint) => {
        const copy = JSON.parse(JSON.stringify(dPoint));
        if (dPoint.value === null) {
            return copy;
        }
        if (params) {
            copy.value = (dPoint.value - params._min) / (params._max - params._min);
        } else {
            copy.value = (dPoint.value - minVal) / (maxVal - minVal);
        }
        return copy;
    });
}

export function logDPA(params: any, data: DataPoint[]): DataPoint[] {
    return _.map(data, (dPoint: DataPoint) => {
        const copy = JSON.parse(JSON.stringify(dPoint));
        if (dPoint.value === null) {
            return copy;
        }
        copy.value = Math.log(dPoint.value);
        return copy;
    });
}

export function powerDPA(params: any, data: DataPoint[]): DataPoint[] {
    if (typeof(params) === 'undefined') {
        params = {};
    }
    if (!params._pow) {
        params._pow = 1;
    }
    return _.map(data, (dPoint: DataPoint) => {
        const copy = JSON.parse(JSON.stringify(dPoint));
        if (dPoint.value === null) {
            return copy;
        }
        copy.value = Math.pow(dPoint.value, params._pow);
        return copy;
    });
}

export function rangeDPA(params: any, data: DataPoint[]): DataPoint[] {
    if (typeof(params) === 'undefined') {
        params = {};
    }
    if (!params._low || params._low < 0) {
        params._low = 0;
    }
    if (!params._high || params._high > 1) {
        params._high = 1;
    }
    const maxVal: number = _.maxBy(data, (dPoint: DataPoint) => dPoint.value).value;
    const minVal: number = _.minBy(data, (dPoint: DataPoint) => dPoint.value).value;
    const low = params._low * (maxVal - minVal) + minVal;
    const high = params._high * (maxVal - minVal) + minVal;
    const out = _.map(data, (dPoint: DataPoint) => {
        const copy = JSON.parse(JSON.stringify(dPoint));
        if (dPoint.value === null) {
            return copy;
        }
        if (dPoint.value < low) {
            copy.value = 0;
        } else if (dPoint.value > high) {
            copy.value = 1;
        } else {
            copy.value = (dPoint.value - low) / (high - low);
        }
        return copy;
    });
    return out;
}

// export function multiDPA(params: any, data: DataPoint[]): DataPoint[] {
//     if (typeof(params) === 'undefined') {
//         params = {};
//     }
//     if (!params._mul) {
//         params._mul = 1;
//     }
//     return _.map(data, (dPoint: DataPoint) => {
//         const copy = JSON.parse(JSON.stringify(dPoint));
//         copy.value = dPoint.value * params._mul;
//         return copy;
//     });
// }
//
// export function offsetDPA(params: any, data: DataPoint[]): DataPoint[] {
//     if (typeof(params) === 'undefined') {
//         params = {};
//     }
//     if (!params._add) {
//         params._add = 0;
//     }
//     return _.map(data, (dPoint: DataPoint) => {
//         const copy = JSON.parse(JSON.stringify(dPoint));
//         copy.value = dPoint.value + params._add;
//         return copy;
//     });
// }

export function resolveFilters(params: any,
                               data: DataPoint[],
                               filters: Array<(params: any, data: DataPoint[]) => DataPoint[]>): DataPoint[] {
    _.forEach(filters, (filter: (params: any, data: DataPoint[]) => DataPoint[]) =>
        data = filter(params, data));
    // _.forEach(data, (dPoint: DataPoint) => {
    //     if (dPoint.value === null) {
    //         dPoint.value = 0;
    //     }
    // });
    return data;
}
