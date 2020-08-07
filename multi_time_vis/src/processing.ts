import * as chroma from 'chroma-js';
import * as _ from 'lodash';

import { resolveFilters } from './filterFuncs';
import {
    DataChannel,
    DataPoint,
    WinnerDataPoint,
    WinnersChannel,
} from './TimeChannel';

export const DEFAULT_CHUNK_SIZE_MS: number = 972;
export const DEFAULT_WINDOW_SIZE: number = 512;
const CANVAS_HEIGHT: number = 20;
const CANVAS_WIDTH: number = 20000;
const BASE_BAR_HEIGHT: number = 4;
export const CATEGORY_HEIGHT: number = 20;
const MAX_INT_16: number = 32768;
const DEFAULT_COLOR: string = '#cc7799';
const WINNERS_COLOR: string = '#8637ba';

export function createBargraph(
        channel: DataChannel,
        from: number,
        to: number,
        chunkSize: number = DEFAULT_CHUNK_SIZE_MS,
    ): string {
    const max: number = channel.bargraphMax || 1;
    const min: number = channel.bargraphMin || -2;
    let data: DataPoint[];
    if (channel.filters) {
        // console.log('filters for', channel.title, channel.filters, channel.filterParams);
        // console.log(' -data before filtering', channel.data);
        data = resolveFilters(channel.filterParams, channel.data, channel.filters);
        // console.log(' -data after filtering', data);
    } else {
        data = channel.data;
    }
    const height: number = CANVAS_HEIGHT;
    const basis: number = getBasis(channel);
    const totalTimerange: number = to - from;
    const pointCount: number = totalTimerange / basis;
    const width: number = Math.max(CANVAS_WIDTH, pointCount);
    const canvas = document.createElement('canvas') as any;
    canvas.setAttribute('height', height);
    canvas.setAttribute('width', width);
    const context: CanvasRenderingContext2D = canvas.getContext('2d');
    context.clearRect(0, 0, width, height);
    const timeRange: number = Math.max(to - from, 1);
    for (let i = 0; i < data.length; i++) {
        const item: DataPoint = data[i];
        let startPct: number;
        let lengthPct: number;
        if (typeof(item.bt) !== 'undefined' && typeof(item.tt) !== 'undefined') {
            startPct = (item.bt - from) / timeRange;
            lengthPct = (item.tt - item.bt) / timeRange;
        } else {
            startPct = (item.time - from) / timeRange;
            lengthPct = chunkSize / timeRange;
        }
        const color: any = channel.getColor ? channel.getColor(item.value) : DEFAULT_COLOR;
        if (typeof item.value === 'number') {
            context.fillStyle = '#fff';
            context.fillRect(Math.floor(startPct * width), 0, Math.ceil(lengthPct * width),
                Math.floor((height - BASE_BAR_HEIGHT) - ((item.value - min) / (max - min)) * (height - BASE_BAR_HEIGHT)));
            context.fillStyle = color;
            context.fillRect(Math.floor(startPct * width), Math.floor((height - BASE_BAR_HEIGHT) -
                (item.value / max) * (height - BASE_BAR_HEIGHT)), Math.ceil(lengthPct * width),
                Math.ceil((item.value / max) * (height - BASE_BAR_HEIGHT)) + BASE_BAR_HEIGHT);
        } else {
            context.fillStyle = '#fff';
            context.fillRect(Math.floor(startPct * width), 0, Math.ceil(lengthPct * width), height);
        }
    }
    return canvas.toDataURL('image/png');
}

export function createHeatmap(
    channel: DataChannel,
    from: number,
    to: number,
    chunkSize: number = DEFAULT_CHUNK_SIZE_MS,
): string {
    let data: DataPoint[];
    if (channel.filters) {
        data = resolveFilters(channel.filterParams, channel.data, channel.filters);
    } else {
        data = channel.data;
    }
    const height: number = CANVAS_HEIGHT;
    const basis: number = getBasis(channel);
    const totalTimerange: number = to - from;
    const pointCount: number = totalTimerange / basis;
    const width: number = Math.max(CANVAS_WIDTH, pointCount);
    const canvas = document.createElement('canvas') as any;
    canvas.setAttribute('height', height);
    canvas.setAttribute('width', width);
    const context: CanvasRenderingContext2D = canvas.getContext('2d');
    context.clearRect(0, 0, width, height);
    const timeRange: number = Math.max(to - from, 1);
    for (let i = 0; i < data.length; i++) {
        const item: DataPoint = data[i];
        let startPct: number;
        let lengthPct: number;
        if (typeof(item.bt) !== 'undefined' && typeof(item.tt) !== 'undefined') {
            startPct = (item.bt - from) / timeRange;
            lengthPct = (item.tt - item.bt) / timeRange;
        } else {
            startPct = (item.time - from) / timeRange;
            lengthPct = chunkSize / timeRange;
        }
        const color: any = channel.getColor ? channel.getColor(item.value) : DEFAULT_COLOR;
        context.fillStyle = color;
        context.fillRect(Math.floor(startPct * width), 0, Math.ceil(lengthPct * width), height);
    }
    return canvas.toDataURL('image/png');
}

export function createWinnersChart(
    channel: WinnersChannel,
    from: number,
    to: number,
    chunkSize: number = DEFAULT_CHUNK_SIZE_MS,
): string {
    const categories: string[] = channel.categories;
    const data: WinnerDataPoint[] = channel.data;
    const basis: number = this.getBasis(channel);
    const height: number = CATEGORY_HEIGHT * categories.length;
    const totalTimerange: number = to - from;
    const pointCount: number = totalTimerange / basis;
    const width: number = Math.max(CANVAS_WIDTH, pointCount);
    const canvas = document.createElement('canvas') as any;
    canvas.setAttribute('height', height);
    canvas.setAttribute('width', width);
    const context: CanvasRenderingContext2D = canvas.getContext('2d');
    context.clearRect(0, 0, width, height);
    const timeRange: number = Math.max(to - from, 1);
    const color: string = channel.color || WINNERS_COLOR;
    for (let i = 0; i < data.length; i++) {
        const item: WinnerDataPoint = data[i];
        if (!item.winner) {
            continue;
        }
        const startPct: number = (item.time - from) / timeRange;
        const lengthPct: number = chunkSize / timeRange;
        const startPx: number = Math.floor(startPct * width);
        const widthPx: number = Math.ceil(lengthPct * width);
        const winnerIndex: number = categories.indexOf(item.winner);
        const topPx: number = winnerIndex * CATEGORY_HEIGHT;
        if (i % 100 === 0) {
            console.log({ item, startPct, lengthPct, winnerIndex, topPx, width });
        }
        context.fillStyle = color;
        context.fillRect(startPx, topPx, widthPx, CATEGORY_HEIGHT);
    }
    return canvas.toDataURL('image/png');
}

function getBasis(channel: DataChannel | WinnersChannel) {
    const filtered: any[] = _.filter(channel.data);
    let i = -1;
    const sorted: DataPoint[] = _.sortBy(filtered, (datum: DataPoint) => {
        ++i;
        if (datum.bt !== undefined && datum.tt !== undefined) {
            datum.length = datum.tt - datum.bt;
        } else if (i < filtered.length - 1 && datum.time !== undefined) {
            datum.length = filtered[i + 1].time - datum.time;
        } else if (i < filtered.length - 1 && datum.bt !== undefined) {
            datum.length = filtered[i + 1].bt - datum.bt;
        } else {
            datum.length = 0;
        }
        return datum.length;
    });
    const found = _.find(sorted, (datum: DataPoint, index: number) => datum && datum.length > 0 &&
        index >= sorted.length / 2);
    return found ? found.length : 0;
}

export function transformWaveform(data: Int16Array): Float32Array {
    const output: Float32Array = new Float32Array(data.length);
    for (let i: number = 0; i < data.length; i++) {
        output[i] = data[i] / MAX_INT_16;
    }
    return output;
}

function getPeaks(bucket: Float32Array): [number, number] {
    if (!bucket || !bucket.length) {
        return [0, 0];
    }
    let min: number = bucket[0];
    let max: number = bucket[0];
    for (let i: number = 1; i < bucket.length; i++) {
        if (bucket[i] > max) {
            max = bucket[i];
        } else if (bucket[i] < min) {
            min = bucket[i];
        }
    }
    return [min, max];
}

export function drawWaveform(
    data: Float32Array,
    params?: {
        nFactor?: number,
        windowSize?: number,
    },
): string {
    if (!data) {
        return;
    }
    const WINDOW_SIZE: number = Math.floor(Math.max(256, data.length / 2000));
    const HEIGHT: number = 500;
    const WAVEFORM_COLOR: string = '#8637ba';
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = data.length / WINDOW_SIZE;
    console.log(`${canvas.width} columns`);
    canvas.height = HEIGHT;
    // const rgb: [number, number, number] = [198, 118, 0];
    context.strokeStyle = WAVEFORM_COLOR;
    // const canvasData = context.getImageData(0, 0, canvas.width, canvas.height);
    context.moveTo(0, 0);
    const nFactor: number = params && params.nFactor ? params.nFactor : 1;
    for (let x = 0; x < canvas.width; x++) {
        const maxSliceIndex: number = Math.min(data.length, (x + 1) * WINDOW_SIZE);
        const subArray: Float32Array = data.slice(x * WINDOW_SIZE, maxSliceIndex);
        const [min, max] = getPeaks(subArray);
        const minY: number = Math.floor((nFactor * -min + 1) * (HEIGHT / 2));
        const maxY: number = Math.floor((1 - nFactor * max) * (HEIGHT / 2));
        context.moveTo(x, minY);
        context.lineTo(x, maxY);
    }
    context.stroke();
    return canvas.toDataURL('image/png');
}

export function drawWaveformFromPeaks(
    peaks: Array<[number, number]>,
    params?: {
        limitColumns?: number,
        nFactor?: number,
    },
): string {
    // const startTime: number = performance.now();
    const HEIGHT: number = 500;
    const WAVEFORM_COLOR: string = '#7C4A8B';
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = peaks.length;
    canvas.height = HEIGHT;
    context.strokeStyle = WAVEFORM_COLOR;
    context.moveTo(0, 0);
    const nFactor: number = params && params.nFactor ? params.nFactor : 1;
    for (let x: number = 0; x < canvas.width; x++) {
        const [min, max] = peaks[x];
        if (min && max) {
            const minY: number = Math.floor((nFactor * -min + 1) * (HEIGHT / 2));
            const maxY: number = Math.floor((1 - nFactor * max) * (HEIGHT / 2));
            context.moveTo(x, minY);
            context.lineTo(x, maxY);
        }
    }
    context.stroke();
    window['peakcanvas'] = canvas;
    return canvas.toDataURL('image/png');
}

export function drawWaveformFromConcatenatedPeaks(
    data: Array<{bt: number, peaks: Array<[number, number]>}>,
    from: number,
    to: number,
    sr: number,
    params?: {
        nFactor?: number,
        windowSize?: number,
    },
): string {
    const windowSize: number = params && params.windowSize ?
        params.windowSize : DEFAULT_WINDOW_SIZE;
    const mcsPerWindow: number = windowSize / sr * 1000000;
    const peaksArrays: Array<Array<[number, number]>> = [];
    console.log({ data });
    function addPadding(duration: number): void {
        const windowCount: number = Math.floor(duration / mcsPerWindow);
        const zeroPeaks: Array<[number, number]> = [];
        console.log('padding duration', { duration, sr, mcsPerWindow, windowCount });
        for (let i: number = 0; i < windowCount; i++) {
            zeroPeaks.push([0, 0]);
        }
        peaksArrays.push(zeroPeaks);
    }
    if (data[0].bt - from >= mcsPerWindow) {
        console.log('padding left', { from, bt: data[0].bt });
        addPadding(data[0].bt - from);
    }
    for (let i: number = 0; i < data.length; i++) {
        peaksArrays.push(data[i].peaks);
        const peaksDuration: number = data[i].peaks.length * mcsPerWindow;
        const peaksTt: number = peaksDuration + data[i].bt;
        const nextBt: number = i < data.length - 1 ? data[i + 1].bt : to;
        const timeToNextBt: number = nextBt - peaksTt;
        // console.log({ timeToNextBt, firstBt: data[i].bt, peaksDuration,
        //     peaksCount: data[i].peaks.length, peaksTt, nextBt });
        if (timeToNextBt >= mcsPerWindow) {
            addPadding(timeToNextBt);
        }
    }
    const flattenedPeaks: Array<[number, number]> = _.flatten(peaksArrays);
    return drawWaveformFromPeaks(flattenedPeaks, params);
}

export function drawSpectrogram(data: any, useNewColors?: boolean): string {
    if (!data) {
        return;
    }
    console.log({ fft: data });
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = data.length;
    canvas.height = data[0].length / 2;
    console.log({ w: canvas.width, h: canvas.height });

    const origColors = ['#000000', '#0c0f94', '#ff0000', '#ffff00', '#ffffff'];
    const newColors = ['#0000FF', '#00FFFF', '#00FF00', '#FFFF00', '#FF0000'];
    const origPositions = [0, .6, 3.9, 4.8, 6];
    const newPositions = [0, 0.9, 1.8, 3.0, 4.5];

    const color: any = chroma.scale(useNewColors ? newColors : origColors)
        .domain(useNewColors ? newPositions : origPositions)
        .mode('rgb');

    const canvasData = context.getImageData(0, 0, canvas.width, canvas.height);
    for (let bin = 0; bin < data.length; bin++) {
        const x = canvas.width * bin / data.length;
        for (let i = 0; i < data[bin].length / 2; i++) {
            const y = canvas.height - 2 * canvas.height * i / data[bin].length;

            const value = data[bin][i];
            const rgb: [number, number, number] = color(value).rgb();
            const index = (x + y * canvas.width) * 4;
            draw1x1Pixel(canvasData, index, rgb);
        }
    }
    context.putImageData(canvasData, 0, 0);
    return canvas.toDataURL('image/png');
}

function draw1x1Pixel(canvasData, index: number, rgb: [number, number, number]) {
    canvasData.data[index + 0]  = Math.floor(rgb[0]);
    canvasData.data[index + 1]  = Math.floor(rgb[1]);
    canvasData.data[index + 2]  = Math.floor(rgb[2]);
    canvasData.data[index + 3]  = 255;
}