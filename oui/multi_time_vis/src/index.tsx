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

import './style.scss';

export function renderTimeChannel(
    element: HTMLElement,
    channel: any,
    props: any) {
    console.log('loaded OtoSense time visualization v0.0.7a');
    const { bt, tt, chart_type, enable_playback, height, params, title, subtitle } = props;
    if (channel && channel.buffer) {
        channel.buffer = new Int16Array(channel.buffer);
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

window['renderTimeChannel'] = renderTimeChannel;
