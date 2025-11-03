'use strict';

var _documentCurrentScript = typeof document !== 'undefined' ? document.currentScript : null;
class AssetLoader {
    constructor(config = {}) {
        this.packageName = 'deepfilternet3-workers';
        this.cdnUrl = config.cdnUrl ?? 'https://cdn.jsdelivr.net/npm';
        this.version = config.version ?? 'latest';
    }
    getCdnUrl(relativePath) {
        return `${this.cdnUrl}/${this.packageName}@${this.version}/dist/${relativePath}`;
    }
    getAssetUrls() {
        return {
            wasm: this.getCdnUrl('pkg/df_bg.wasm'),
            model: this.getCdnUrl('models/DeepFilterNet3_onnx.tar.gz')
        };
    }
    async fetchAsset(url) {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch asset: ${response.statusText}`);
        }
        return response.arrayBuffer();
    }
}
let defaultLoader = null;
function getAssetLoader(config) {
    if (!defaultLoader || config) {
        defaultLoader = new AssetLoader(config);
    }
    return defaultLoader;
}

const WorkerMessageTypes = {
    INIT: 'INIT',
    SET_SUPPRESSION_LEVEL: 'SET_SUPPRESSION_LEVEL',
    STOP: 'STOP',
    SET_BYPASS: 'SET_BYPASS',
    FETCH_WASM: 'FETCH_WASM',
    SETUP_AWP: 'SETUP_AWP',
    ERROR: 'ERROR'
};

class WorkerManager {
    constructor(config) {
        this.config = config;
        this.assetLoader = getAssetLoader(config.assetConfig);
    }
    static async getSharedAssets() {
        if (WorkerManager.assets)
            return WorkerManager.assets;
        const loader = getAssetLoader();
        const assetUrls = loader.getAssetUrls();
        const [wasmBytes, modelBytes] = await Promise.all([
            loader.fetchAsset(assetUrls.wasm),
            loader.fetchAsset(assetUrls.model)
        ]);
        WorkerManager.assets = { wasmBytes, modelBytes, assetUrls };
        return WorkerManager.assets;
    }
    async createWorkerFromBlob() {
        if (WorkerManager.worker) {
            WorkerManager.worker.terminate();
        }
        WorkerManager.workerReadyPromise = new Promise((resolve) => {
            WorkerManager.workerReadyResolve = resolve;
        });
        const worker = new Worker(new URL('./DeepFilterWorker.js', (typeof document === 'undefined' ? require('u' + 'rl').pathToFileURL(__filename).href : (_documentCurrentScript && _documentCurrentScript.tagName.toUpperCase() === 'SCRIPT' && _documentCurrentScript.src || new URL('index.js', document.baseURI).href))), {
            type: this.config.type,
            name: this.config.name
        });
        worker.onmessage = (event) => this.handleWorkerMessage(event);
        WorkerManager.worker = worker;
        return worker;
    }
    handleWorkerMessage(event) {
        if (event.data.type === WorkerMessageTypes.FETCH_WASM) {
            void this.sendAssetsToWorker();
        }
        else if (event.data.type === WorkerMessageTypes.SETUP_AWP) {
            WorkerManager.workerReadyResolve?.();
            WorkerManager.workerReadyResolve = null;
        }
    }
    async sendAssetsToWorker() {
        if (!WorkerManager.worker)
            return;
        const assets = await WorkerManager.getSharedAssets();
        WorkerManager.worker.postMessage({
            command: WorkerMessageTypes.INIT,
            bytes: assets.wasmBytes,
            model_bytes: assets.modelBytes,
            rawSab: this.config.rawSab,
            denoisedSab: this.config.denoisedSab,
            suppression_level: this.config.suppressionLevel
        });
    }
    static getSharedWorker() {
        return WorkerManager.worker;
    }
    static isWorkerReady() {
        return WorkerManager.worker !== null;
    }
    static async waitForWorkerReady() {
        if (WorkerManager.workerReadyPromise) {
            await WorkerManager.workerReadyPromise;
        }
    }
    static clearSharedWorker() {
        WorkerManager.worker?.terminate();
        WorkerManager.worker = null;
    }
    static cleanupAssets() {
        WorkerManager.assets = null;
    }
}
WorkerManager.worker = null;
WorkerManager.assets = null;
WorkerManager.workerReadyPromise = null;
WorkerManager.workerReadyResolve = null;

class DeepFilterNet3Processor {
    constructor(config = {}) {
        this.workerManager = null;
        this.rawSab = null;
        this.denoisedSab = null;
        this.isInitialized = false;
        this.bypassEnabled = false;
        const { sampleRate = 48000, noiseReductionLevel = 50 } = config;
        const bufferSize = sampleRate * 2;
        this.rawSab = new SharedArrayBuffer(8 + (bufferSize + 1) * 4);
        this.denoisedSab = new SharedArrayBuffer(8 + (bufferSize + 1) * 4);
        this.workerManager = new WorkerManager({
            name: 'DF3Worker',
            type: 'classic',
            suppressionLevel: noiseReductionLevel,
            sampleRate,
            rawSab: this.rawSab,
            denoisedSab: this.denoisedSab
        });
    }
    async initialize() {
        if (this.isInitialized)
            return;
        if (!this.workerManager) {
            throw new Error('WorkerManager not initialized');
        }
        await WorkerManager.getSharedAssets();
        await this.workerManager.createWorkerFromBlob();
        this.isInitialized = true;
    }
    async createAudioWorkletNode(audioContext) {
        this.ensureInitialized();
        await WorkerManager.waitForWorkerReady();
        const workletUrl = new URL('./DeepFilterWorklet.js', (typeof document === 'undefined' ? require('u' + 'rl').pathToFileURL(__filename).href : (_documentCurrentScript && _documentCurrentScript.tagName.toUpperCase() === 'SCRIPT' && _documentCurrentScript.src || new URL('index.js', document.baseURI).href)));
        await audioContext.audioWorklet.addModule(workletUrl);
        return this.createWorkletNode(audioContext);
    }
    setSuppressionLevel(level) {
        const worker = WorkerManager.getSharedWorker();
        if (!worker || typeof level !== 'number' || isNaN(level))
            return;
        const clampedLevel = Math.max(0, Math.min(100, Math.floor(level)));
        worker.postMessage({
            command: WorkerMessageTypes.SET_SUPPRESSION_LEVEL,
            level: clampedLevel
        });
    }
    destroy() {
        if (!this.isInitialized)
            return;
        WorkerManager.clearSharedWorker();
        WorkerManager.cleanupAssets();
        this.workerManager = null;
        this.rawSab = null;
        this.denoisedSab = null;
        this.isInitialized = false;
    }
    isReady() {
        return this.isInitialized && WorkerManager.isWorkerReady();
    }
    setNoiseSuppressionEnabled(enabled) {
        const worker = WorkerManager.getSharedWorker();
        if (!worker)
            return;
        this.bypassEnabled = !enabled;
        worker.postMessage({
            command: WorkerMessageTypes.SET_BYPASS,
            bypass: !enabled
        });
    }
    isNoiseSuppressionEnabled() {
        return !this.bypassEnabled;
    }
    ensureInitialized() {
        if (!this.isInitialized) {
            throw new Error('Processor not initialized. Call initialize() first.');
        }
    }
    createWorkletNode(audioContext) {
        return new AudioWorkletNode(audioContext, 'deepfilter-audio-processor', {
            processorOptions: {
                rawSab: this.rawSab,
                denoisedSab: this.denoisedSab
            }
        });
    }
}

class DeepFilterNoiseFilterProcessor {
    constructor(options = {}) {
        this.name = 'deepfilternet3-noise-filter';
        this.audioContext = null;
        this.sourceNode = null;
        this.workletNode = null;
        this.destination = null;
        this.enabled = true;
        this.init = async (opts) => {
            const track = opts.track ?? opts.mediaStreamTrack;
            if (!track) {
                throw new Error('DeepFilterNoiseFilterProcessor.init: missing MediaStreamTrack');
            }
            this.originalTrack = track;
            await this.ensureGraph();
        };
        this.restart = async () => {
            await this.teardownGraph();
            await this.ensureGraph();
        };
        this.setEnabled = async (enable) => {
            this.enabled = enable;
            this.processor.setNoiseSuppressionEnabled(enable);
            return this.enabled;
        };
        this.destroy = async () => {
            await this.teardownGraph();
            this.processor.destroy();
        };
        const cfg = {
            sampleRate: options.sampleRate ?? 48000,
            noiseReductionLevel: options.noiseReductionLevel ?? 80
        };
        this.enabled = options.enabled ?? true;
        this.processor = new DeepFilterNet3Processor(cfg);
    }
    static isSupported() {
        return typeof AudioContext !== 'undefined' && typeof SharedArrayBuffer !== 'undefined';
    }
    setSuppressionLevel(level) {
        this.processor.setSuppressionLevel(level);
    }
    isEnabled() {
        return this.enabled;
    }
    isNoiseSuppressionEnabled() {
        return this.processor.isNoiseSuppressionEnabled();
    }
    async ensureGraph() {
        if (!this.originalTrack) {
            throw new Error('No source track');
        }
        this.audioContext ?? (this.audioContext = new AudioContext({ sampleRate: 48000 }));
        if (this.audioContext.state !== 'running') {
            try {
                await this.audioContext.resume();
            }
            catch {
                // Ignore resume errors
            }
        }
        await this.processor.initialize();
        await WorkerManager.waitForWorkerReady();
        const node = await this.processor.createAudioWorkletNode(this.audioContext);
        this.sourceNode = this.audioContext.createMediaStreamSource(new MediaStream([this.originalTrack]));
        this.destination = this.audioContext.createMediaStreamDestination();
        this.sourceNode.connect(node).connect(this.destination);
        this.workletNode = node;
        this.processedTrack = this.destination.stream.getAudioTracks()[0];
        await this.setEnabled(this.enabled);
    }
    async teardownGraph() {
        try {
            if (this.workletNode) {
                this.workletNode.disconnect();
                this.workletNode = null;
            }
            if (this.sourceNode) {
                this.sourceNode.disconnect();
                this.sourceNode = null;
            }
            if (this.destination) {
                this.destination.disconnect();
                this.destination = null;
            }
        }
        catch {
            // Ignore disconnect errors
        }
    }
}
function DeepFilterNoiseFilter(options) {
    return new DeepFilterNoiseFilterProcessor(options);
}

exports.AssetLoader = AssetLoader;
exports.DeepFilterNet3Processor = DeepFilterNet3Processor;
exports.DeepFilterNoiseFilter = DeepFilterNoiseFilter;
exports.DeepFilterNoiseFilterProcessor = DeepFilterNoiseFilterProcessor;
exports.WorkerMessageTypes = WorkerMessageTypes;
exports.getAssetLoader = getAssetLoader;
