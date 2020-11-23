import * as React from 'react';

import ScrollingTimeVis, { ScrollingVisProps } from './index';

interface IProps extends ScrollingVisProps {
    socket?: WebSocket;
    validateMessage?: (message: MessageEvent) => boolean;
    url?: string;
}

interface IState {
    data: any[];
    formatError: string;
}

export default class WebsocketScrollingVis extends React.Component<IProps, IState> {
    socket: WebSocket;

    constructor(props: IProps) {
        super(props);
        this.state = {
            data: [],
            formatError: '',
        };
    }

    componentDidMount() {
        this.launch();
    }

    componentWillUnmount() {
        this.closeSocket();
        window.removeEventListener('beforeunload', this.closeSocket);
    }

    closeSocket: VoidFunction = () => {
        if (this.socket) {
            this.socket.removeEventListener('message', this.handleWsMessage);
            this.socket.close();
        }
    }

    launch: VoidFunction = () => {
        console.log('launching');
        if (this.props.socket) {
            this.socket = this.props.socket;
        } else {
            this.socket = new WebSocket(this.props.url);
        }
        this.socket.addEventListener('message', this.handleWsMessage);
        window.addEventListener('beforeunload', this.closeSocket);
    }

    handleWsMessage: (message: MessageEvent) => void = (message: MessageEvent) => {
        if (this.props.validateMessage && !this.props.validateMessage(message)) {
            return;
        }
        try {
            const dataPoint: any = JSON.parse(message.data);
            this.handleDataPoint(dataPoint);
        } catch (error) {
            console.error('Invalid WebSocket message for streaming data.', error);
        }
    }

    handleDataPoint: (dataPoint: any) => void = (dataPoint: any) => {
        const data: any[] = this.state.data.slice();
        data.push(dataPoint);
        this.setState({ data });
    }

    render() {
        const { url, ...rest } = this.props;
        return (
            <React.Fragment>
                <ScrollingTimeVis
                    data={this.state.data}
                    {...rest}
                />
                {!!this.state.formatError && this.state.formatError}
            </React.Fragment>
        );
    }
}
