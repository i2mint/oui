import * as React from 'react';
import { render } from 'react-dom';

import TimeChannel from './TimeChannel';
export { default as TimeChannel } from './TimeChannel';
export * from './TimeChannel';

export { default as MultiTimeVis } from './MultiTimeVis';
export * from './MultiTimeVis';

export { default as TimeAxis } from './TimeAxis';
export * from './TimeAxis';

export * from './processing';
import { generateWAVHeader } from '../sound_utils';

import './style.scss';

export function renderTimeChannel(
    element: HTMLElement,
    channel: any,
    props: any
) {
    console.log('loaded OtoSense time visualization v0.0.10');
    const { bt, tt, chart_type, enable_playback, height, params, title, subtitle } = props;
    if (channel && channel.buffer) {
        if (channel.sr) {
            const dataLength: number = channel.buffer.length * 2;
            const header: Uint8Array = generateWAVHeader(channel.sr, 16, dataLength);
            const resultBuffer: ArrayBuffer = new ArrayBuffer(dataLength + 44);
            const resultUint8View: Uint8Array = new Uint8Array(resultBuffer);
            resultUint8View.set(header);
            const resultInt16View: Int16Array = new Int16Array(resultBuffer, 44);
            resultInt16View.set(channel.buffer);
            channel.buffer = resultBuffer;
        } else {
            channel.buffer = new Int16Array(channel.buffer).buffer;
        }
    }
    const chartParams: any = params ? params : {};
    render(
        <TimeChannel
            channel={channel}
            from={bt}
            to={tt}
            chartType={chart_type}
            enablePlayback={enable_playback}
            height={height}
            params={chartParams}
            title={title}
            subtitle={subtitle}
            suppressPlayOnSpace
        />, element);
}
