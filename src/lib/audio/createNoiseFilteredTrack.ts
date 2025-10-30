type MediaStreamTrack = globalThis.MediaStreamTrack;

export async function createNoiseFilteredTrack(micTrack: MediaStreamTrack): Promise<MediaStreamTrack> {
    const { DeepFilterNoiseFilterProcessor } = await import('deepfilternet3-noise-filter');

    const dfProcessor = new DeepFilterNoiseFilterProcessor({
        sampleRate: 48000,
        noiseReductionLevel: 80,
        enabled: true
    });

    await dfProcessor.init({ track: micTrack });
    return dfProcessor.processedTrack!;
}