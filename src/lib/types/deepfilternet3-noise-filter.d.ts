declare module 'deepfilternet3-noise-filter' {
    export class DeepFilterNoiseFilterProcessor {
        constructor(options: { sampleRate: number; noiseReductionLevel?: number; enabled?: boolean });
        init(params: { track: MediaStreamTrack }): Promise<void>;
        processedTrack?: MediaStreamTrack;
        setSuppressionLevel(level: number): void;
        setEnabled(enabled: boolean): void;
        destroy(): void;
    }
}
