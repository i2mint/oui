import * as React from 'react';

import ScrollingTimeVis, { ScrollingVisProps } from './index';

interface IProps extends ScrollingVisProps {
    headers?: any;
    method?: string;
    stream?: ReadableStream;
    requestBody?: any;
    url?: string;
}

interface IState {
    data: any[];
    formatError: string;
}

export default class HtmlScrollingVis extends React.Component<IProps, IState> {
    currentString: string = '';
    formatVerified: boolean = false;
    objectOpen: boolean = false;
    reader: ReadableStreamReader;
    stream: ReadableStream;
    xhr: XMLHttpRequest;

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

    launch: VoidFunction = () => {
        console.log('launching');
        if (this.props.stream) {
            this.handleStream(this.props.stream);
        } else {
            const fetchOptions: any = {};
            if (this.props.headers) {
                fetchOptions.headers = this.props.headers;
            }
            if (this.props.method) {
                fetchOptions.method = this.props.method;
            }
            if (this.props.requestBody) {
                fetchOptions.body = JSON.stringify(this.props.requestBody);
            }
            console.log('fetching');
            fetch(this.props.url, fetchOptions)
            .then((response: Response) => this.handleStream(response.body));
        }
    }

    handleStream: (stream: ReadableStream) => void = (stream: ReadableStream) => {
        console.log('stream started');
        this.stream = stream;
        this.reader = stream.getReader();
        this.handleChunk();
    }

    handleChunk: VoidFunction = () => {
        if (!this.reader) {
            return;
        }
        this.reader.read()
        .then(({ done, value }) => {
            let formattedValue: string = String.fromCharCode(...value);
            console.log({ formattedValue });
            if (done) {
                this.currentString += formattedValue;
                this.flushStringBuffer();
                return;
            }
            formattedValue = formattedValue.replace(/\s/g, '');
            // if (!this.formatVerified) {
            //     if (formattedValue[0] !== '{') {
            //         this.setState({ formatError: `Expected {, received a value starting with ${formattedValue}`})
            //         if (this.stream) {
            //             this.stream.cancel();
            //         }
            //         return;
            //     } else {
            //         this.formatVerified = true;
            //     }
            // }
            while (formattedValue) {
                if (!this.objectOpen) {
                    if (formattedValue[0] !== '{') {
                        this.setState({ formatError: `Expected {, received a value starting with ${formattedValue}` })
                        if (this.stream) {
                            this.stream.cancel();
                        }
                        return;
                    }
                    this.currentString = '{';
                    formattedValue = formattedValue.slice(1);
                    this.objectOpen = true;
                }
                const objectCloseIndex: number = formattedValue.indexOf('}');
                if (objectCloseIndex >= 0) {
                    this.currentString += formattedValue.slice(0, objectCloseIndex + 1);
                    let dataPoint: any;
                    try {
                        dataPoint = JSON.parse(this.currentString);
                    } catch (error) {
                        console.error(error);
                        this.setState({ formatError: `Expected a JSON object, received ${this.currentString}` });
                        if (this.stream) {
                            this.stream.cancel();
                        }
                        return;
                    }
                    this.handleDataPoint(dataPoint);
                    this.objectOpen = false;
                    formattedValue = formattedValue.slice(objectCloseIndex + 1);
                } else {
                    this.currentString += formattedValue;
                    formattedValue = '';
                }
            }
            this.handleChunk();
        });
    }

    flushStringBuffer: VoidFunction = () => {
        return;
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
