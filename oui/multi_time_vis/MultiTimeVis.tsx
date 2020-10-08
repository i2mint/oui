import * as React from 'react';

import * as _ from 'lodash';
// import * as moment from 'moment';
import SoundUtility from '../sound_utils';

import TimeAxis from './TimeAxis';
import TimeChannel, { AudioChannel, DataChannel, DataPoint } from './TimeChannel';

export interface Timerange {
    bt: number;
    tt: number;
    color?: string;
    highlighted?: boolean;
    [fieldName: string]: any;
}

export interface SelectedRange {
    from: number;
    highlighted?: boolean;
    to: number;
}

interface RequiredProps {
    channels: Array<AudioChannel | DataChannel>;
    from: number;
    leftX: number;
    params: any;
    rightX: number;
    to: number;
}

interface IProps extends RequiredProps {
    annotations?: Timerange[];
    blockKeyEvents?: boolean;
    channelControls?: { [channelName: string]: JSX.Element };
    chartType?: string;
    contextMenuHandler?: (event: any) => void;
    deleteHighlightedRanges?: VoidFunction;
    clearSelection?: VoidFunction;
    channelHeight?: number;
    getAnnotationColor?: (item: any) => string;
    getAnnotationHighlight?: (item: any) => boolean;
    highlightKey?: string;
    highlightValue?: string;
    hideTimeScale?: boolean;
    indicatorX?: number;
    maxScale?: number;
    onClick?: () => any;
    onSelect?: (startRatio: number, endRatio: number) => void;
    onTrim?: (startRatio: number, endRatio: number) => void;
    onZoom?: (leftX: number, rightX: number) => void;
    playing?: boolean;
    playSelection?: (selection: Timerange) => void;
    renderHelpDialog?: () => JSX.Element;
    renderTooltip?: (item: DataPoint, channelIndex: number) => JSX.Element;
    revertScale?: VoidFunction;
    setLeftAndRight?: (leftX: number, rightX: number) => void;
    selectedIntervals?: SelectedRange[];
    selectionMenu?: JSX.Element;
    startPlayback?: (fromRatio: number) => void;
    stopPlayback?: VoidFunction;
    togglePlayback?: VoidFunction;
    subtitle?: string;
    zoomable?: boolean;
}

interface IState {
    contextMenuLeft: number;
    contextMenuTop: number;
    contextMenuVisible: boolean;
    helpDialog: boolean;
    hoverX: number;
    negativeRange: { from: number, to: number };
    selecting: boolean;
    selectionEnd: number;
    selectionRanges: Array<{ from: number, to: number }>;
    selectionStart: number;
}

const ZOOM_RATE = 1.03;
const ZOOM_PER = 50;
const MIN_ZOOM = 0.0015;

function inhibitScroll(event: WheelEvent): void {
    if (event.shiftKey) {
        event.preventDefault();
    }
}

export default class MultiTimeVis extends React.Component<IProps, IState> {
    element: HTMLDivElement;
    soundUtils: SoundUtility;
    root: any;

    constructor(props) {
        super(props);
        this.state = {
            contextMenuLeft: null,
            contextMenuTop: null,
            contextMenuVisible: false,
            helpDialog: false,
            hoverX: null,
            negativeRange: null,
            selecting: false,
            selectionEnd: 0,
            selectionRanges: [],
            selectionStart: 0,
        };

        if (props.soundUtils) {
            this.soundUtils = props.soundUtils;
        } else {
            this.soundUtils = new SoundUtility();
        }
    }

    componentDidMount() {
        window.addEventListener('keydown', this.handleKeyDown);
        window.addEventListener('click', this.handleOutsideClick);
        window.addEventListener('mousewheel', inhibitScroll, { passive: false });
    }

    componentWillReceiveProps(nextProps: IProps) {
        const nextState: any = {};
        if (nextProps.rightX) {
            nextState.rightX = nextProps.rightX;
        }
        if (nextProps.leftX) {
            nextState.leftX = nextProps.leftX;
        }
        if (_.keys(nextState).length) {
            this.setState(nextState);
        }
    }

    componentWillUnmount(): void {
        this.stopPlayback();
        window.removeEventListener('mouseup', this.stopSelecting);
        window.removeEventListener('mousemove', this.select);
        window.removeEventListener('keydown', this.handleKeyDown);
        window.removeEventListener('click', this.handleOutsideClick);
        window.removeEventListener('mousewheel', inhibitScroll);
    }

    closeDialogs(): void {
        this.setState({
            helpDialog: false,
        });
    }

    helpDialog(): void {
        this.setState({ helpDialog: true });
    }

    updateScale(leftX: number, rightX: number) {
        if (this.props.setLeftAndRight) {
            this.props.setLeftAndRight(leftX, rightX);
        }
    }

    handleOutsideClick(): void {
        this.setState({ contextMenuVisible: false });
    }

    clearSelection(): void {
        if (this.props.clearSelection) {
            this.props.clearSelection();
        }
        this.setState({
            contextMenuVisible: false,
            selecting: false,
        });
    }

    handleSetLeftAndRight(left: number, right: number) {
        this.props.setLeftAndRight(left, right);
    }

    makeRef(ref: HTMLDivElement): void {
        this.element = ref;
    }

    // Playback helpers
    stopPlayback() {
        if (this.props.stopPlayback) {
            this.props.stopPlayback();
        }
    }

    // Event handlers
    findEventLocation(event: MouseEvent): number {
        const rect: ClientRect = this.element.getBoundingClientRect();
        const eventLeftPx: number = event.pageX - rect.left;
        return eventLeftPx / rect.width;
    }

    handleDoubleClick(e: React.SyntheticEvent<MouseEvent>): void {
        console.log('double click!');
        const startFromRatio: number = this.findEventLocation(e.nativeEvent as MouseEvent);
        const visibleRange: number = this.props.rightX - this.props.leftX;
        const realRatio: number = startFromRatio * visibleRange + this.props.leftX;
        const found = _.find(this.props.selectedIntervals, (range: SelectedRange) => {
            return range.from <= realRatio && range.to >= realRatio;
        });
        if (found) {
            console.log('from', found, (found.from - this.props.leftX) / visibleRange);
            this.props.startPlayback((found.from - this.props.leftX) / visibleRange);
        } else {
            this.props.startPlayback(startFromRatio);
        }
    }

    handleWheel(e: React.SyntheticEvent<Event>) {
        const ne: WheelEvent = e.nativeEvent as WheelEvent;
        if (ne.shiftKey) {
            const left: number = this.findEventLocation(ne as MouseEvent);
            let leftX: number = this.props.leftX;
            let rightX: number = this.props.rightX;
            let scale: number = rightX - leftX;
            if (ne.deltaY > 0) {
                if (scale >= this.props.maxScale) {
                    return;
                }
                scale = scale * ZOOM_RATE * Math.max(ne.deltaY / ZOOM_PER, 1.0);
            } else {
                scale = scale / (ZOOM_RATE * Math.max(-ne.deltaY / ZOOM_PER, 1.0));
            }
            if (scale <= MIN_ZOOM) {
                scale = MIN_ZOOM;
            }
            if (scale >= this.props.maxScale) {
                scale = this.props.maxScale;
            }
            const scaleDif: number = rightX - leftX - scale;
            const right: number = 1 - left;
            leftX += scaleDif * left;
            rightX -= scaleDif * right;
            if (leftX < 0.0) {
                leftX = 0.0;
            }
            if (rightX > 1.0) {
                rightX = 1.0;
            }
            scale = rightX - leftX;
            if (this.props.maxScale && this.props.maxScale < scale) {
                scale = this.props.maxScale;
                rightX = leftX + scale;
            }
            this.updateScale(leftX, rightX);
        }
    }

    handleKeyDown(event: any) {
        const keycode: number = event.which || event.keyCode;
        const highlight: Timerange = _.find(this.props.annotations, (range) => range.highlighted);
        if (keycode === 27) { // Escape
            if (this.props.playing) {
                this.stopPlayback();
            } else if (highlight) {
                _.forEach(this.props.annotations, (range) => {
                    range.highlighted = false;
                });
            } else {
                this.clearSelection();
            }
        } else if ((keycode === 8 || keycode === 46) && !this.props.blockKeyEvents) { // Backspace or Delete
            if (highlight) {
                this.props.deleteHighlightedRanges();
            }
        } else if (keycode === 32 && !this.props.blockKeyEvents) { // Spacebar
            this.props.togglePlayback();
            event.preventDefault();
        }
    }

    select(e: React.SyntheticEvent<MouseEvent> | any) {
        const eventLocation: number = this.findEventLocation(e);
        if (eventLocation < 0) {
            return;
        }
        const selectionRanges: Array<{ from: number, to: number }> = [...this.state.selectionRanges];
        const negativeRange: { from: number, to: number } = this.state.negativeRange;
        if ((e as MouseEvent).ctrlKey) {
            negativeRange.to = eventLocation;
        } else if (selectionRanges && selectionRanges.length) {
            _.last(selectionRanges).to = eventLocation;
        }
        this.setState({ negativeRange, selectionRanges, selectionEnd: eventLocation });
    }

    startSelecting(e: React.SyntheticEvent<MouseEvent> | any) {
        if ((e.nativeEvent as MouseEvent).button !== 0) {
            return;
        }
        event.preventDefault();
        event.stopPropagation();
        const eventLocation: number = this.findEventLocation(e);
        if (!e.shiftKey && !e.ctrlKey) {
            window.setTimeout(() => {
                if (this.state.selecting) {
                    this.props.clearSelection();
                }
            }, 100);
        }
        window.addEventListener('mouseup', this.stopSelecting);
        window.addEventListener('mousemove', this.select);
        if ((e as MouseEvent).ctrlKey) {
            this.setState ({
                negativeRange: {from: eventLocation, to: eventLocation},
                selecting: true,
                selectionEnd: eventLocation,
                selectionStart: eventLocation,
            });
            return;
        }
        this.setState({
            selecting: true,
            selectionEnd: eventLocation,
            selectionStart: eventLocation,
        });
    }

    stopSelecting(event: React.SyntheticEvent<MouseEvent> | any): void {
        window.removeEventListener('mouseup', this.stopSelecting);
        window.removeEventListener('mousemove', this.select);
        event.preventDefault();
        event.stopPropagation();
        const selectionStart: number = Math.min(this.state.selectionStart, this.state.selectionEnd);
        const selectionEnd: number = Math.max(this.state.selectionStart, this.state.selectionEnd);
        const visibleRange: number = this.props.rightX - this.props.leftX;
        const realSelectionStart: number = selectionStart * visibleRange + this.props.leftX;
        const realSelectionEnd: number = selectionEnd * visibleRange + this.props.leftX;
        if (selectionStart === selectionEnd) {
            const found = _.find(this.props.selectedIntervals, (range: SelectedRange) => {
                return range.from <= realSelectionStart && range.to >= realSelectionStart;
            });
            if (found) {
                found.highlighted = true;
            } else {
                this.props.onSelect(realSelectionStart, realSelectionEnd);
            }
            this.setState({ selecting: false, negativeRange: null });
            return;
        }
        const negative = this.state.negativeRange ? {
            from: Math.min(this.state.negativeRange.from, this.state.negativeRange.to),
            to: Math.max(this.state.negativeRange.from, this.state.negativeRange.to),
        } : null;
        if (negative && this.props.onTrim) {
            negative.from = negative.from * visibleRange + this.props.leftX;
            negative.to = negative.to * visibleRange + this.props.leftX;
            this.props.onTrim(negative.from, negative.to);
        } else if (this.props.onSelect) {
            this.props.onSelect(realSelectionStart, realSelectionEnd);
        }
        this.setState({ selecting: false, negativeRange: null });
    }

    render() {
        return (
            <section
                className="timeVis"
                ref={(ref) => {
                    this.root = ref;
                }}
            >
                {!!this.props.channels.length &&
                    <div className="inner" ref={this.makeRef}>
                        {/*<div className="helpText">
                            {}
                            <p style={{ height: '40px', display: 'flex', alignItems: 'center', marginBottom: '0' }}>
                                {'Double click on a channel to play sound. Press spacebar to stop playback. ' +
                                'Click and drag to select.'}
                                <br/>
                                To see more instructions, please click question mark icon.
                            </p>
                            <Button
                                primary
                                className="help-button"
                                icon
                                onClick={() => this.helpDialog()}
                                style={{
                                    height: '24px',
                                    padding: '0px',
                                    width: '24px',
                                }}
                            >
                                help
                            </Button>
                        </div>*/}
                        {!!this.props.renderHelpDialog && this.props.renderHelpDialog()
                            // <SpecGuideDialog
                            //     visible={this.state.helpDialog}
                            //     onHide={this.closeDialogs}
                            // />
                        }
                        {_.map(this.props.channels, (channel: DataChannel, index: number) => {
                            if (!channel) {
                                return <div />;
                            }
                            let controls: JSX.Element = null;
                            if (this.props.channelControls && channel.name && this.props.channelControls[channel.name]) {
                                controls = this.props.channelControls[channel.name];
                            }
                            return (
                                <TimeChannel
                                    activeSelection={!this.state.selecting ? undefined :
                                        { from: this.state.selectionStart, to: this.state.selectionEnd }
                                    }
                                    annotations={this.props.annotations}
                                    channel={channel}
                                    chartType={this.props.chartType || 'bargraph'}
                                    contextMenuHandler={this.props.contextMenuHandler}
                                    controlContainer={controls}
                                    from={this.props.from}
                                    leftX={this.props.leftX}
                                    key={channel.guid + channel.title}
                                    clickHandler={undefined}
                                    getAnnotationColor={this.props.getAnnotationColor}
                                    getAnnotationHighlight={this.props.getAnnotationHighlight}
                                    height={this.props.channelHeight || undefined}
                                    highlightKey={this.props.highlightKey}
                                    highlightValue={this.props.highlightValue}
                                    indicatorX={this.props.indicatorX}
                                    doubleClickHandler={this.handleDoubleClick}
                                    keydownHandler={this.handleKeyDown}
                                    menu={index === 0 && this.props.selectionMenu ?
                                        this.props.selectionMenu : undefined}
                                    negativeRange={!!this.state.negativeRange}
                                    params={this.props.params}
                                    rightX={this.props.rightX}
                                    selections={this.props.selectedIntervals}
                                    selecting={this.state.selecting}
                                    setLeftAndRightHandler={this.handleSetLeftAndRight}
                                    soundUtils={this.soundUtils}
                                    startSelecting={this.startSelecting}
                                    subtitle={index === 0 ? this.props.subtitle : undefined}
                                    suppressAudio
                                    suppressEvents
                                    to={this.props.to}
                                    zoomHandler={this.props.zoomable ? this.handleWheel : undefined}
                                />
                            );
                        })}
                    </div>
                }
                {!this.props.hideTimeScale &&
                    <TimeAxis
                        from={this.props.from}
                        leftX={this.props.leftX}
                        rightX={this.props.rightX}
                        to={this.props.to}
                    />
                }
            </section>
        );
    }
}
