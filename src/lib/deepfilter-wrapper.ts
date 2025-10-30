export async function createDeepFilterProcessor(micTrack: MediaStreamTrack) {
    try {
        const { DeepFilterNoiseFilterProcessor } = await import('deepfilternet3-noise-filter');
        const processor = new DeepFilterNoiseFilterProcessor({
            sampleRate: 48000,
            noiseReductionLevel: 80,
            enabled: true
        });
        await processor.init({ track: micTrack });
        return processor;
    } catch (err) {
        console.warn('DeepFilterNet3 failed to load:', err);
        return null;
    }
}