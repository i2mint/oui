window['AudioContext'] = window['AudioContext'] || window['webkitAudioContext'];

import * as _ from 'lodash';

import fftWorker from './fft-webworker';
const fftWorkerCode: string = fftWorker as any;
const blob = new Blob([fftWorkerCode], { type: 'application/javascript'});
const url: any = window['URL'] || window['webkitURL'];
const blobUrl: string = url.createObjectURL(blob);

export const DFLT_SR: number = 44100;

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
            if (this.bufferSource) {
                this.bufferSource.onended = null;
                this.bufferSource.stop(0);
            }
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

/**
 * Creates a WAV (RIFF) audio file header for a given set of parameters
 * @param sr The sample rate
 * @param bit_depth The bit_depth
 * @param bufferSize The size of the audio data in bytes
 * @returns The header as a 44-byte UInt8Array
 */
export function generateWAVHeader(sr: number, bit_depth: number, bufferSize: number): Uint8Array {
    const arrayBuffer: ArrayBuffer = new ArrayBuffer(44);
    const view: DataView = new DataView(arrayBuffer);
    const textEncoder: TextEncoder = new TextEncoder();
    // bytes 1-4: 'RIFF'
    const RIFF: Uint8Array = textEncoder.encode('RIFF');
    _.forEach(RIFF, (letter: number, index: number) => view.setUint8(index, letter));
    // bytes 5-8: total file size, including header
    if (bufferSize > 0) {
        view.setUint32(4, bufferSize + 44 - 8, true);
    } else {
        view.setUint32(4, -1, true);
    }
    // bytes 9-12: 'WAVE'
    const WAVE: Uint8Array = textEncoder.encode('WAVE');
    _.forEach(WAVE, (letter: number, index: number) => view.setUint8(index + 8, letter));
    // bytes 13-16: 'fmt' plus null
    const fmt: Uint8Array = textEncoder.encode('fmt ');
    _.forEach(fmt, (letter: number, index: number) => view.setUint8(index + 12, letter));
    // bytes 17-20: length of format section (16)
    view.setUint32(16, 16, true);
    // bytes 21-22: format type (1 for PCM)
    view.setUint16(20, 1, true);
    // bytes 23-24: number of channels
    view.setUint16(22, 1, true);
    // bytes 25-28: sample rate
    view.setUint32(24, sr, true);
    // bytes 29-32: total bytes per second
    view.setUint32(28, (bit_depth * sr) / 8, true);
    // bytes 33-34: bytes per sample times channels
    view.setUint16(32, bit_depth / 8, true);
    // bytes 35-36: bits per sample
    view.setUint16(34, bit_depth, true);
    // bytes 37-40: 'data'
    const data: Uint8Array = textEncoder.encode('data');
    _.forEach(data, (letter: number, index: number) => view.setUint8(index + 36, letter));
    // bytes 41-44: audio data size
    view.setUint32(40, bufferSize, true);
    return new Uint8Array(arrayBuffer);
}

export function bytesToMcs(bytes: number, bit_depth: number, sr: number): number {
    const samples: number = bytes / (bit_depth / 8);
    return (samples / sr) * 1000000;
}
