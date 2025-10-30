declare module 'deepfilternet3-worker-test' {
    export class DeepFilterNet3Worker {
        constructor(options?: {
            sampleRate?: number;
            aggressive?: number;
            modelUrl?: string;
        });

        start(): Promise<void>;
        connectInput(track: MediaStreamTrack): void;
        getProcessedTrack(): MediaStreamTrack | null;
        stop(): void;
    }
}
