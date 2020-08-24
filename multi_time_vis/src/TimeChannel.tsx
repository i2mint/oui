import * as React from 'react';

import * as _ from 'lodash';
import SoundUtility from 'otosense-sound-utils';

import {
    createBargraph,
    createHeatmap,
    createWinnersChart,
    drawSpectrogram,
    drawWaveform,
    DEFAULT_CHUNK_SIZE_MCS,
    DEFAULT_WINDOW_SIZE,
} from './processing';
import { SelectedRange, Timerange } from './MultiTimeVis';

const PROGRESS_INTERVAL: number = 100;

export interface DataPoint {
    bt?: number;
    time?: number;
    tt?: number;
    value: any;
    length?: number;
    [fieldName: string]: any;
}

export interface WinnerDataPoint {
    time: number;
    winner?: string;
}

export interface AudioChannel {
    audioData?: AudioBuffer;
    buffer?: ArrayBuffer;
    chartType?: string;
    closable?: boolean;
    from?: number;
    image?: string;
    onClose?: () => void;
    subtitle?: string;
    title?: string;
    to?: number;
    type: 'audio';
    url?: string;
    windowSize?: number;
    [fieldName: string]: any;
}

export interface DataChannel {
    bargraphMax?: number;
    bargraphMin?: number;
    chartType?: string;
    closable?: boolean;
    data: DataPoint[];
    filterParams?: any;
    filters?: ((filterParams: any, data: DataPoint[]) => DataPoint[])[];
    from?: number;
    getColor?: (value: any) => string;
    hash?: string;
    image?: string;
    onClose?: () => void;
    renderTooltip?: (bt: number) => JSX.Element;
    subtitle?: string;
    title?: string;
    to?: number;
    type: 'data';
    [fieldName: string]: any;
}

export interface WinnersChannel {
    categories: string[];
    chartType: 'winners';
    closable?: boolean;
    color?: string;
    data: WinnerDataPoint[];
    from?: number;
    image?: string;
    onClose?: () => void;
    subtitle?: string;
    title?: string;
    to?: number;
    type: 'data';
    [fieldName: string]: any;
}

interface RequiredProps {
    channel: DataChannel | AudioChannel | WinnersChannel;
    from: number;
    to: number;
}

interface IProps extends RequiredProps {
    activeSelection?: { from: number, to: number };
    annotations?: Timerange[];
    chartType?: string;
    contextMenuHandler?: (e: any) => void;
    clickHandler?: (e: any) => void;
    controlContainer?: JSX.Element;
    doubleClickHandler?: (e: any) => void;
    enablePlayback?: boolean;
    getAnnotationColor?: (item: any) => string;
    getAnnotationHighlight?: (item: any) => boolean;
    hasOptions?: boolean;
    height?: number;
    hideTooltips?: boolean;
    highlightKey?: string;
    highlightValue?: string;
    indicatorX?: number;
    leftX?: number;
    keydownHandler?: (e: any) => void;
    mouseOutHandler?: (e: any) => void;
    menu?: JSX.Element;
    negativeRange?: boolean;
    optionHandler?: (e: any) => void;
    params?: any;
    playing?: boolean;
    renderCloseButton?: () => JSX.Element;
    renderProgress?: () => JSX.Element;
    rightX?: number;
    rowDragHandler?: (e: any) => void;
    selecting?: boolean;
    selections?: SelectedRange[];
    setLeftAndRightHandler?: (left: number, right: number) => void;
    soundUtils?: SoundUtility;
    startSelecting?: (event: React.SyntheticEvent<MouseEvent>) => void;
    subtitle?: string;
    suppressAudio?: boolean;
    suppressDrawing?: boolean;
    suppressEvents?: boolean;
    suppressPlayOnSpace?: boolean;
    title?: string;
    // thresholdHandler?: (channel: DataChannel, y: number, event: any) => void;
    zoomHandler?: (e: any) => void;
}

interface IState {
    hoverY: number;
    image?: string;
    indicatorX?: number;
    tooltipItem: JSX.Element;
    tooltipX: number;
    tooltipY: number;
}

export default class TimeChannel extends React.Component<IProps, Partial<IState>> {
    canvas: any;
    container: any;
    soundUtils: SoundUtility;

    _playing: boolean;
    _scrolling: number;

    // throttledImageHover = _.throttle((offsetY: number) => {
    //     this.setState({ hoverY: offsetY });
    // }, 40);

    constructor(props) {
        super(props);
        this.state = {
            hoverY: null,
            image: '',
            indicatorX: 0,
            tooltipItem: null,
            tooltipX: null,
            tooltipY: null,
        };

        if (props.soundUtils) {
            this.soundUtils = props.soundUtils;
        }
    }

    componentDidMount(): void {
        if (this.props.channel &&
            !this.props.channel.image &&
            !this.props.suppressDrawing) {
            this.createImage(this.props);
        }

        if (this.props.enablePlayback && !this.props.suppressPlayOnSpace) {
            window.addEventListener('keydown', this.togglePlaybackOnKeydown);
        }
    }

    componentWillReceiveProps(newProps: IProps): void {
        if (newProps.channel !== this.props.channel) {
            if (newProps.channel &&
                newProps.channel.type === 'audio' &&
                !newProps.suppressAudio &&
                !this.soundUtils) {
                this.soundUtils = new SoundUtility();
            }
            if (newProps.channel &&
                newProps.channel !== this.props.channel &&
                !newProps.channel.image &&
                !newProps.suppressDrawing
                ) {
                this.createImage(newProps);
            }
        }
    }

    assignContainerRef: (ref: any) => void = (ref: any) => {
        this.container = ref;
    }

    assignCanvasRef: (ref: any) => void = (ref: any) => {
        this.canvas = ref;
    }

    showTooltip: (event: any) => void = (event: any) => {
        const channel: DataChannel = this.props.channel as DataChannel;
        const rect: ClientRect = this.container.getBoundingClientRect();
        const e: MouseEvent = event.nativeEvent as MouseEvent;
        const zoomedRatio: number = (e.pageX - rect.left) / rect.width;
        const viewRatio: number = this.rightX - this.leftX;
        const unzoomedRatio: number = zoomedRatio * viewRatio + this.leftX;
        const btOffset: number = unzoomedRatio * (this.props.to - this.props.from);
        const bt: number = btOffset + this.props.from;
        const tooltipItem: JSX.Element = channel.renderTooltip(bt);
        if (!tooltipItem) {
            return;
        }
        this.setState({
            tooltipItem,
            tooltipX: e.clientX,
            tooltipY: e.clientY,
        });
    }

    hideTooltip: VoidFunction = () => {
        this.setState({ tooltipItem: null });
    }

    createAudioImage: (props: IProps) => void = (props: IProps) => {
        if (!this.soundUtils) {
            this.soundUtils = new SoundUtility();
        }
        const channel: AudioChannel = props.channel as AudioChannel;
        if (channel.chartType === 'spectrogram') {
            let promise: Promise<[any[], AudioBuffer]>;
            if (channel.buffer) {
                promise = this.soundUtils.getSpectrogramTransformAndAudioBuffer(channel.buffer, true);
            } else if (channel.url) {
                promise = this.soundUtils.getSpectrogramTransformAndAudioBufferFromUrl(channel.url, true);
            } else {
                return;
            }
            promise.then(([spectrogramData, audioBuffer]) => {
                channel.audioData = audioBuffer;
                const image: string = drawSpectrogram(spectrogramData);
                channel.image = image;
                this.setState({ image });
            })
        } else {
            let promise: Promise<AudioBuffer>;
            if (channel.buffer) {
                promise = this.soundUtils.getAudioBuffer(channel.buffer, true);
            } else if (channel.url) {
                promise = this.soundUtils.getAudioBufferFromUrl(channel.url, true);
            }
            promise.then((audioBuffer: AudioBuffer) => {
                const audioData: Float32Array = audioBuffer.getChannelData(0);
                const image: string = drawWaveform(audioData, { windowSize: channel.windowSize || DEFAULT_WINDOW_SIZE });
                channel.image = image;
                this.setState({ image });
            });
        }
    }

    createImage: (props: IProps) => void = (props: IProps) => {
        const chunkSize: number = this.props.params ? this.props.params.chunkSize :
            DEFAULT_CHUNK_SIZE_MCS;
        const chartType: string = props.channel.chartType || props.chartType;
        let image: string = '';
        switch (chartType) {
            case 'audio':
            case 'spectrogram':
            case 'peaks':
                if (props.channel.image) {
                    image = props.channel.image;
                    break;
                } else {
                    return this.createAudioImage(props);
                }
            case 'heatmap':
                image = createHeatmap(
                    props.channel as DataChannel,
                    props.from,
                    props.to,
                    chunkSize);
                break;
            case 'winners':
                const channel: WinnersChannel = props.channel as WinnersChannel;
                if (channel.categories.length) {
                    image = createWinnersChart(
                        props.channel as WinnersChannel,
                        props.from,
                        props.to,
                        props.height / channel.categories.length,
                        chunkSize);
                }
                break;
            case 'bargraph':
            default:
                image = createBargraph(
                    props.channel as DataChannel,
                    props.from,
                    props.to,
                    chunkSize);
        }
        this.setState({ image });
        props.channel.image = image;
    }

    // imageHover(event: any) {
    //     const e: MouseEvent = event as MouseEvent;
    //     if (e.ctrlKey) {
    //         event.stopPropagation();
    //         this.throttledImageHover(event.nativeEvent.offsetY);
    //     } else if (this.state.hoverY) {
    //         this.setState({ hoverY: null });
    //     }
    // }

    // hideImageHover(event: any) {
    //     event.stopPropagation();
    //     this.hideTooltip();
    //     this.setState({ hoverY: null });
    //     this.props.mouseOutHandler(event);
    // }

    // clickHandler(event: any) {
    //     this.props.clickHandler(event);
    //     if ((event as MouseEvent).ctrlKey) {
    //         this.props.thresholdHandler(this.props.channel as DataChannel,
    //             this.state.hoverY / event.target.getBoundingClientRect().height, event);
    //     }
    // }

    setIndicatorOnClick: (event: MouseEvent) => void = (event: MouseEvent) => {
        const rect: ClientRect = this.container.getBoundingClientRect();
        const eventLeftPx: number = event.pageX - rect.left;
        const ratio: number = eventLeftPx / rect.width;
        this.setState({ indicatorX: ratio });
    }

    playbackOnDoubleClick: (event: MouseEvent) => void = (event: MouseEvent) => {
        event.preventDefault();
        if (this._playing) {
            this.stopPlayback();
        }
        const rect: ClientRect = this.container.getBoundingClientRect();
        const eventLeftPx: number = event.pageX - rect.left;
        const ratio: number = eventLeftPx / rect.width;
        this.setState({ indicatorX: ratio }, this.startPlaybackFromIndicator);
    }

    startPlaybackFromIndicator: VoidFunction = () => {
        if (!this.soundUtils || !this.soundUtils.currentBuffer) {
            return;
        }
        this.soundUtils.onEnded = this.stopIndicator;
        const startOffset: number = this.indicatorX * ((this.props.to - this.props.from) / 1000);
        this._playing = true;
        this.soundUtils.play(startOffset);
        this.scrollIndicator();
    }

    togglePlaybackOnKeydown: (event: KeyboardEvent) => void = (event: KeyboardEvent) => {
        const keycode: number = event.which || event.keyCode;
        if (keycode === 32) { // Spacebar
            event.preventDefault();
            if (this._playing) {
                this.stopPlayback();
                this.stopIndicator();
            } else if (!this.props.suppressPlayOnSpace) {
                this.startPlaybackFromIndicator();
            }
        }
    }

    stopPlayback: VoidFunction = () => {
        this._playing = false;
        this.soundUtils.stop();
    }

    scrollIndicator: VoidFunction = () => {
        const duration: number = this.props.to - this.props.from;
        let progressMs: number = this.state.indicatorX * duration / 1000;
        let now: number = performance.now();
        const scroll: VoidFunction = () => {
            const newNow: number = performance.now();
            const delta: number = newNow - now;
            progressMs += delta;
            const indicatorX: number = progressMs / ((this.props.to - this.props.from) / 1000);
            this.setState({ indicatorX });
            now = newNow;
        };
        if (this._scrolling) {
            this.stopIndicator();
        }
        this._scrolling = window.setInterval(scroll, PROGRESS_INTERVAL);
    }

    stopIndicator: VoidFunction = () => {
        if (this._scrolling) {
            window.clearInterval(this._scrolling);
            this._scrolling = null;
        }
    }

    getCanvasEventHandlers: () => { [key: string]: (event) => any } = () => {
        const handlers: any = {};
        if (this.props.suppressEvents) {
            return handlers;
        }
        if (this.props.enablePlayback) {
            handlers.onClick = this.setIndicatorOnClick;
            handlers.onDoubleClick = this.playbackOnDoubleClick;
        } else {
            if (this.props.clickHandler) {
                handlers.onClick = this.props.clickHandler;
            }
            if (this.props.doubleClickHandler) {
                handlers.onDoubleClick = this.props.doubleClickHandler;
            }
        }
        if (this.props.mouseOutHandler) {
            handlers.onMouseOut = this.props.mouseOutHandler;
        }
        if (this.props.contextMenuHandler) {
            handlers.onContextMenu = this.props.contextMenuHandler;
        }
        // if (this.props.onSelect && this.props.selecting) {
        //     handlers.onMouseMove = this.props.onSelect;
        // }
        if (this.props.startSelecting) {
            handlers.onMouseDown = this.props.startSelecting;
        }
        if (this.props.contextMenuHandler) {
            handlers.onContextMenu = this.props.contextMenuHandler;
        }
        if (this.props.zoomHandler) {
            handlers.onWheel = this.props.zoomHandler;
        }
        return handlers;
    }

    renderSelection: (selection: SelectedRange & Timerange) => JSX.Element =
        (selection: SelectedRange & Timerange) => {
        let fromRatio: number = selection.from;
        let toRatio: number = selection.to;
        if (!fromRatio) {
            if (!selection.bt) {
                return null;
            }
            fromRatio = (selection.bt - this.props.from) / (this.props.to - this.props.from);
        }
        if (!toRatio) {
            if (!selection.tt) {
                return null;
            }
            toRatio = (selection.tt - this.props.from) / (this.props.to - this.props.from);
        }
        if (fromRatio > this.rightX || toRatio < this.leftX) {
            return null;
        }
        const zoomedViewRatio: number = this.rightX - this.leftX;
        const from: number = Math.max(this.leftX, fromRatio);
        const to: number = Math.min(this.rightX, toRatio);
        const leftRatio: number = (from - this.leftX) / zoomedViewRatio;
        const widthRatio: number = (to - from) / zoomedViewRatio;
        const style: any = {
            left: leftRatio * 100 + '%',
            width: widthRatio * 100 + '%',
        };
        if (selection.color) {
            style.backgroundColor = selection.color;
        } else if (this.props.getAnnotationColor) {
            const color: string = this.props.getAnnotationColor(selection);
            if (color) {
                style.backgroundColor = color;
                style.opacity = 0.5;
            }
        }
        const key: string = `${fromRatio}|${toRatio}`;
        let className: string = 'selection';
        if (this.props.getAnnotationHighlight && this.props.getAnnotationHighlight(selection) ||
            this.getAnnotationHighlight(selection)) {
            className += ' annotation-highlight';
        }
        if ((selection as Timerange).highlighted) {
            className += ' highlighted';
        }
        return (<div key={key} style={style} className={className} />);
    }

    getAnnotationHighlight: (annotation: any) => boolean = (annotation: any) => {
        return !!this.props.highlightKey &&
            annotation[this.props.highlightKey] === this.props.highlightValue;
    }

    renderIndicator: () => JSX.Element = () => {
        const zoomedViewRatio: number = this.rightX - this.leftX;
        const zoomedIndicatorRatio: number = (this.indicatorX - this.leftX) / zoomedViewRatio;
        return (
            <div
                className="otv--indicator"
                style={{
                    left: zoomedIndicatorRatio * 100 + '%',
                }}
            />
        );
    }

    renderCloseButton: () => JSX.Element = () => {
        if (this.props.renderCloseButton) {
            return this.props.renderCloseButton();
        }
        return <button className="otv--lose-button" onClick={this.props.channel.onClose}>X</button>
    }

    get leftX(): number {
        return this.props.leftX || 0;
    }

    get rightX(): number {
        return this.props.rightX || 1;
    }

    get indicatorX(): number {
        return this.state.indicatorX || this.props.indicatorX || 0;
    }

    render() {
        const channel: DataChannel | AudioChannel | WinnersChannel = this.props.channel;
        if (!channel) {
            return <div />;
        }
        let channelLeft: string;
        let channelWidth: string;
        const channelFrom: number = channel.from || this.props.from;
        const channelTo: number = channel.to || this.props.to;
        const channelDurationMcs: number = this.props.to - this.props.from;
        const displayFromMcs: number = this.leftX * channelDurationMcs + this.props.from;
        const displayToMcs: number = this.rightX * channelDurationMcs + this.props.from;
        const displayDurationMcs: number = Math.max(displayToMcs - displayFromMcs, 1);
        if (channel.type === 'audio') {
            channelLeft = (channelFrom - displayFromMcs) / displayDurationMcs * 100 + '%';
            channelWidth = (channelTo - channelFrom) / displayDurationMcs * 100 + '%';
        } else {
            channelLeft = (this.props.from - displayFromMcs) / displayDurationMcs * 100 + '%';
            channelWidth = channelDurationMcs / displayDurationMcs * 100 + '%';
        }
        const height: number = this.props.height || 50;
        let image: string = this.state.image;
        if (this.props.channel.image) {
            image = this.props.channel.image;
        }
        const displayIndicator: boolean = !!this.indicatorX &&
            this.indicatorX >= this.leftX &&
            this.indicatorX < this.rightX;
        const title: string = this.props.title || channel.title || '';
        const subtitle: string = this.props.subtitle || channel.subtitle || '';
        return (
            <div className="otv--vis-channel">
                {!!title || !!subtitle || !!this.props.controlContainer || !!this.props.menu || channel.closable &&
                    <div className="otv--channel-title">
                        {!!title && <div className="otv--title"><strong>{title}</strong></div>}
                        {!!subtitle && <div className="otv--subtitle">{subtitle}</div>}
                        {!!this.props.controlContainer && this.props.controlContainer}
                        {!!this.props.menu && this.props.menu}
                        {channel.closable && this.renderCloseButton()}
                    </div>
                }
                <div
                    className={`otv--canvas-container  otv--${this.props.channel.type}`}
                    {...this.getCanvasEventHandlers()}
                    id={title + '_cont'}
                    ref={this.assignContainerRef}
                    onMouseMove={!this.props.hideTooltips &&
                        (channel as DataChannel).renderTooltip ? this.showTooltip : undefined}
                    onMouseOut={!this.props.hideTooltips &&
                        (channel as DataChannel).renderTooltip ? this.hideTooltip : undefined}
                    style={{ height: `${height + 6}px` }}
                >
                    {!!image &&
                        <img
                            alt={`${title} visualization`}
                            className="otv--vis-image"
                            draggable={false}
                            id={this.props.channel.title + '_image'}
                            src={image}
                            style={{
                                height: `${height}px`,
                                imageRendering: this.props.channel.type === 'audio' ? 'crisp-edges' : 'pixelated',
                                left: channelLeft,
                                userSelect: 'none',
                                MozUserSelect: 'none',
                                WebkitUserSelect: 'none',
                                msUserSelect: 'none',
                                KhtmlUserSelect: 'none',
                                width: channelWidth,
                            }}
                        />
                    }
                    {/*this.state.hoverY !== null &&
                        <div
                            className="ctrlIndicator"
                            style={{
                                top: this.state.hoverY + 'px',
                            }}
                        />
                    */}
                    {!image && !!this.props.renderProgress && this.props.renderProgress()}
                    <div className="otv--overlay-selections">
                        {_.map(this.props.selections, this.renderSelection)}
                        {_.map(this.props.annotations, this.renderSelection)}
                    </div>
                    {!!this.props.activeSelection &&
                        <div className="otv--overlay-selections">
                            <div
                                style={{
                                    color: '#000',
                                    left: `${Math.min(this.props.activeSelection.from, this.props.activeSelection.to)
                                        * 100}%`,
                                    width: `${Math.abs(this.props.activeSelection.to -
                                        this.props.activeSelection.from) * 100}%`,
                                }}
                                className={`otv--selection otv--highlighted ${this.props.negativeRange ? 'otv--negative-range' : ''}`}
                            />
                        </div>
                    }
                    {displayIndicator && this.renderIndicator()}
                    {this.props.channel.chartType === 'winners' &&
                        <div className="otv--winners-labels">
                            {_.map((this.props.channel as WinnersChannel).categories, (category: string) => (
                                <div key={category} className="otv--category">
                                    <label>{category}</label>
                                </div>
                            ))}
                        </div>
                    }
                </div>
                {/*this.props.hasOptions &&
                    <div className={'buttonHolder'} >
                        <Button
                            className={'optionButton'}
                            icon
                            onClick={this.props.optionHandler}
                        >
                            more_vert
                        </Button>
                    </div>
                */}
                {!!this.state.tooltipItem &&
                    <div
                        className="otv--tooltip"
                        style={{
                            left: this.state.tooltipX - 40 + 'px',
                            top: this.state.tooltipY - 60 + 'px',
                        }}
                    >
                        {this.state.tooltipItem}
                    </div>
                }
            </div>
        );
    }
}
