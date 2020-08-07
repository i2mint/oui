import * as React from 'react';

import * as moment from 'moment';

const MCS: number = 1000000;
const SECONDS: number = 60;

const TICK_DURATIONS: any = {
    FIFTEEN_SECONDS: MCS * 15, // 15 seconds
    FIVE_SECONDS: MCS * 5, // 5 seconds
    THIRTY_SECONDS: MCS * 30, // 30 seconds
    // tslint:disable-next-line
    ONE_MINUTE: SECONDS * MCS, // 1 minute
    FIVE_MINUTES: SECONDS * MCS * 5, // 5 minutes
};

interface IProps {
    from: number;
    leftX: number;
    rightX: number;
    to: number;
}

const majorTickFormat: string = 'h:mm';
const minorTickFormat: string = '[:]ss';

export default class TimeAxis extends React.Component<IProps, null> {
    element: HTMLDivElement;
    getTickDuration(totalDuration): number {
        if (totalDuration < SECONDS * MCS * 1.4) {
            return TICK_DURATIONS.FIVE_SECONDS;
        }
        if (totalDuration < SECONDS * MCS * 3.2) {
            return TICK_DURATIONS.FIFTEEN_SECONDS;
        }
        if (totalDuration < SECONDS * MCS * 6.4) {
            return TICK_DURATIONS.THIRTY_SECONDS;
        }
        if (totalDuration < SECONDS * MCS * 18) {
            return TICK_DURATIONS.ONE_MINUTE;
        }
        return TICK_DURATIONS.FIVE_MINUTES;
    }

    setRef(ref: any): void {
        this.element = ref;
    }

    getTicks(
        startRatio: number,
        tickWidthRatio: number,
        currentMoment: moment.Moment,
        tickDurationMs: number,
    ): JSX.Element[] {
        const ticks: JSX.Element[] = [];
        let currentRatio: number = startRatio;
        const width: string = `${tickWidthRatio * 100}%`;
        while (currentRatio + tickWidthRatio < 1) { // loop until the second to last tick
            const format: string = currentMoment.seconds() === 0 ? majorTickFormat : minorTickFormat;
            ticks.push((
                <div
                    className="axisTick"
                    key={currentMoment.valueOf()}
                    style={{ width }}
                >
                    {currentMoment.format(format)}
                </div>
            ));
            currentMoment.add(tickDurationMs, 'ms');
            currentRatio += tickWidthRatio;
        }
        // last tick cannot have its full width otherwise it will push the other ticks to the left
        const lastFormat: string = currentMoment.seconds() === 0 ? majorTickFormat : minorTickFormat;
        ticks.push((
            <div
                className="axisTick spacer"
                key={currentMoment.valueOf()}
                style={{ width: 0 }}
            >{currentMoment.format(lastFormat)}
            </div>
        ));
        return ticks;
    }

    render() {
        const totalDuration: number = this.props.to - this.props.from;
        const durationRatio: number = this.props.rightX - this.props.leftX;
        const displayDuration: number = totalDuration * durationRatio;
        const displayStart: number = this.props.from + this.props.leftX * totalDuration;
        const tickDuration: number = this.getTickDuration(displayDuration);
        const tickWidthRatio: number = tickDuration / displayDuration;
        const firstTickOffset: number = tickDuration - displayStart % tickDuration;
        const firstTickTime: number = firstTickOffset + displayStart;
        const startMoment: moment.Moment = moment.utc(new Date(firstTickTime / 1000));
        const firstTickLeftRatio: number = firstTickOffset / displayDuration;
        return (
            <div
                className="timeAxis"
                ref={this.setRef}
            >
                <div
                    className="axisTick"
                    style={{
                        width: `${firstTickLeftRatio * 100}%`,
                    }}
                />
                <React.Fragment>
                    {this.getTicks(firstTickLeftRatio, tickWidthRatio, startMoment, tickDuration / 1000)}
                </React.Fragment>
            </div>
        );
    }
}
