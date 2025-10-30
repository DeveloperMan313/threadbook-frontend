declare module 'deepfilternet3-noise-filter' {
    export interface DeepFilterConfig {
        sampleRate?: number;
        noiseReductionLevel?: number;
        enabled?: boolean;
        assetConfig?: {
            cdnUrl?: string;
            version?: string;
        };
    }

    export interface ProcessorInitOptions {
        track?: MediaStreamTrack;
        mediaStreamTrack?: MediaStreamTrack;
    }

    export class DeepFilterNet3Processor {
        constructor(config?: DeepFilterConfig);
        initialize(): Promise<void>;
        createAudioWorkletNode(audioContext: AudioContext): Promise<AudioWorkletNode>;
        setSuppressionLevel(level: number): void;
        destroy(): void;
        isReady(): boolean;
        setNoiseSuppressionEnabled(enabled: boolean): void;
        isNoiseSuppressionEnabled(): boolean;
    }

    export class DeepFilterNoiseFilterProcessor {
        constructor(options?: DeepFilterConfig);
        name: string;
        processedTrack?: MediaStreamTrack;

        init(opts: ProcessorInitOptions): Promise<void>;
        restart(): Promise<void>;
        setEnabled(enable: boolean): Promise<boolean>;
        destroy(): Promise<void>;
        setSuppressionLevel(level: number): void;
        isEnabled(): boolean;
        isNoiseSuppressionEnabled(): boolean;

        static isSupported(): boolean;
    }

    export function DeepFilterNoiseFilter(options?: DeepFilterConfig): DeepFilterNoiseFilterProcessor;

    export class AssetLoader {
        constructor(config?: { cdnUrl?: string; version?: string });
        getCdnUrl(relativePath: string): string;
        getAssetUrls(): { wasm: string; model: string };
        fetchAsset(url: string): Promise<ArrayBuffer>;
    }

    export function getAssetLoader(config?: { cdnUrl?: string; version?: string }): AssetLoader;

    export const WorkerMessageTypes: {
        INIT: string;
        SET_SUPPRESSION_LEVEL: string;
        STOP: string;
        SET_BYPASS: string;
        FETCH_WASM: string;
        SETUP_AWP: string;
        ERROR: string;
    };
}