import { TrackProcessor, Track, AudioProcessorOptions } from 'livekit-client';

interface DeepFilterNet3ProcessorConfig {
    sampleRate?: number;
    noiseReductionLevel?: number;
}
declare class DeepFilterNet3Processor {
    private workerManager;
    private rawSab;
    private denoisedSab;
    private isInitialized;
    private bypassEnabled;
    constructor(config?: DeepFilterNet3ProcessorConfig);
    initialize(): Promise<void>;
    createAudioWorkletNode(audioContext: AudioContext): Promise<AudioWorkletNode>;
    setSuppressionLevel(level: number): void;
    destroy(): void;
    isReady(): boolean;
    setNoiseSuppressionEnabled(enabled: boolean): void;
    isNoiseSuppressionEnabled(): boolean;
    private ensureInitialized;
    private createWorkletNode;
}

interface DeepFilterNoiseFilterOptions {
    sampleRate?: number;
    frameSize?: number;
    enableNoiseReduction?: boolean;
    noiseReductionLevel?: number;
    assetResolver?: unknown;
    enabled?: boolean;
}
declare class DeepFilterNoiseFilterProcessor implements TrackProcessor<Track.Kind.Audio, AudioProcessorOptions> {
    name: string;
    processedTrack?: MediaStreamTrack;
    audioContext: AudioContext | null;
    sourceNode: MediaStreamAudioSourceNode | null;
    workletNode: AudioWorkletNode | null;
    destination: MediaStreamAudioDestinationNode | null;
    processor: DeepFilterNet3Processor;
    enabled: boolean;
    originalTrack?: MediaStreamTrack;
    constructor(options?: DeepFilterNoiseFilterOptions);
    static isSupported(): boolean;
    init: (opts: {
        track?: MediaStreamTrack;
        mediaStreamTrack?: MediaStreamTrack;
    }) => Promise<void>;
    restart: () => Promise<void>;
    setEnabled: (enable: boolean) => Promise<boolean>;
    setSuppressionLevel(level: number): void;
    isEnabled(): boolean;
    isNoiseSuppressionEnabled(): boolean;
    destroy: () => Promise<void>;
    private ensureGraph;
    private teardownGraph;
}
declare function DeepFilterNoiseFilter(options?: DeepFilterNoiseFilterOptions): DeepFilterNoiseFilterProcessor;

interface AssetConfig {
    cdnUrl?: string;
    version?: string;
}
interface AssetUrls {
    wasm: string;
    model: string;
}
declare class AssetLoader {
    private readonly packageName;
    private readonly version;
    private readonly cdnUrl;
    constructor(config?: AssetConfig);
    private getCdnUrl;
    getAssetUrls(): AssetUrls;
    fetchAsset(url: string): Promise<ArrayBuffer>;
}
declare function getAssetLoader(config?: AssetConfig): AssetLoader;

declare const WorkerMessageTypes: {
    readonly INIT: "INIT";
    readonly SET_SUPPRESSION_LEVEL: "SET_SUPPRESSION_LEVEL";
    readonly STOP: "STOP";
    readonly SET_BYPASS: "SET_BYPASS";
    readonly FETCH_WASM: "FETCH_WASM";
    readonly SETUP_AWP: "SETUP_AWP";
    readonly ERROR: "ERROR";
};
type WorkerMessageType = typeof WorkerMessageTypes[keyof typeof WorkerMessageTypes];

export { AssetLoader, DeepFilterNet3Processor, DeepFilterNoiseFilter, DeepFilterNoiseFilterProcessor, WorkerMessageTypes, getAssetLoader };
export type { AssetConfig, DeepFilterNet3ProcessorConfig, DeepFilterNoiseFilterOptions, WorkerMessageType };
