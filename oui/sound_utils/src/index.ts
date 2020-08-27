window['AudioContext'] = window['AudioContext'] || window['webkitAudioContext'];

import fftWorker from './fft-webworker';
const fftWorkerCode: string = fftWorker as any;
const blob = new Blob([fftWorkerCode], { type: 'application/javascript'});
const url: any = window['URL'] || window['webkitURL'];
const blobUrl: string = url.createObjectURL(blob);

export default class SoundUtility {
    interruptWorkers: boolean = false;
    workers: Set<Worker> = new Set();

    audioContext: AudioContext;
    bufferSource: AudioBufferSourceNode;
    currentBuffer: AudioBuffer;
    onEnded: VoidFunction = null;

    constructor() {
        if (AudioContext) {
            if (!window['audioContext']) {
                window['audioContext'] = new AudioContext();
            }
            this.audioContext = window['audioContext'];
        }
    }

    getSpectrogramTransformAndAudioBuffer(data: ArrayBuffer, saveBuffer?: boolean): Promise<[any[], AudioBuffer]> {
        if (!window['Worker'] || this.interruptWorkers) { // return early if in test environment
            return Promise.resolve(null);
        }
        let audioBuffer: AudioBuffer;
        let worker: Worker;
        return new Promise<[string, AudioBuffer]>((resolve, reject) => {
            worker = new Worker(blobUrl);
            this.workers.add(worker);
            worker.addEventListener('message', (event: MessageEvent) => {
                resolve([event.data, audioBuffer]);
                worker.terminate();
                this.workers.delete(worker);
            });
            this.audioContext.decodeAudioData(data, (buffer: AudioBuffer) => {
                if (saveBuffer) {
                    this.currentBuffer = buffer;
                }
                audioBuffer = buffer;
                const bufferData: Float32Array = buffer.getChannelData(0);
                worker.postMessage(bufferData);
            });
        }).catch((error: Error) => {
            console.error(error);
            if (worker) {
                this.workers.delete(worker);
            }
            return null;
        });
    }

    getSpectrogramTransformAndAudioBufferFromUrl(url: string, saveBuffer?: boolean): Promise<[any[], AudioBuffer]> {
        return fetch(url).then((response: Response) => response.arrayBuffer())
            .then((data: ArrayBuffer) => this.getSpectrogramTransformAndAudioBuffer(data, saveBuffer));
    }

    getAudioBuffer(data: ArrayBuffer, saveBuffer?: boolean): Promise<AudioBuffer> {
        return new Promise<AudioBuffer>((resolve, reject) => {
            this.audioContext.decodeAudioData(data, (buffer: AudioBuffer) => {
                if (saveBuffer) {
                    this.currentBuffer = buffer;
                    resolve(buffer);
                }
            });
        });
    }

    getAudioBufferFromUrl(url: string, saveBuffer?: boolean): Promise<AudioBuffer> {
        return fetch(url).then((response: Response) => response.arrayBuffer())
            .then((data: ArrayBuffer) => this.getAudioBuffer(data, saveBuffer));
    }

    refreshNode: VoidFunction = () => {
        if (!this.currentBuffer) {
            return;
        }
        this.bufferSource = this.audioContext.createBufferSource();
        this.bufferSource.connect(this.audioContext.destination);
        this.bufferSource.buffer = this.currentBuffer;
    }

    play: (startOffset: number, endOffset?: number) => void =
    (startOffset: number, endOffset?: number) => {
        if (!this.currentBuffer) {
            return;
        }
        this.refreshNode();
        const startTime: number = (startOffset || 0) / 1000;
        const duration: number = endOffset ? (endOffset / 1000) - startTime : undefined;
        this.bufferSource.onended = this.handleEnded.bind(this);
        this.bufferSource.start(0, startTime, duration);
        console.log({ playing: this.bufferSource, startTime, duration });
        window['audioBuffer'] = this.currentBuffer;
    }

    stop: VoidFunction = () => {
        try {
            this.bufferSource.onended = null;
            this.bufferSource.stop(0);
        } catch (e) {
            console.warn(e);
        }
        this.handleEnded();
    }

    handleEnded(): void {
        if (this.onEnded) {
            console.log('ended!');
            this.onEnded();
        }
    }
}
