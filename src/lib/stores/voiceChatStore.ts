import { writable } from 'svelte/store';
import type { Room, RemoteParticipant } from 'livekit-client';

export type VoiceChatState = {
    room: Room | null;
    isConnected: boolean;
    error: string;
    isSelfMuted: boolean;
    isSelfVideoEnabled: boolean;
    isScreenSharing: boolean;
    hasMic: boolean;
    hasCamera: boolean;
    participants: RemoteParticipant[];
    activeSpeakerId: string | null;
    isMinimized: boolean;
    position: { x: number; y: number };
};

function createVoiceChatStore() {
    const getInitialPosition = () => {
        if (typeof window === 'undefined') return { x: 0, y: 20 };
        return { x: window.innerWidth - 320, y: 20 };
    };

    const initialState: VoiceChatState = {
        room: null,
        isConnected: false,
        error: '',
        isSelfMuted: false,
        isSelfVideoEnabled: true,
        isScreenSharing: false,
        hasMic: true,
        hasCamera: true,
        participants: [],
        activeSpeakerId: null,
        isMinimized: false,
        position: getInitialPosition()
    };

    const { subscribe, set, update } = writable<VoiceChatState>(initialState);

    return {
        subscribe,
        join: () => update(s => ({ ...s, error: '' })),
        leave: () => set(initialState),
        toggleMinimized: () => update(s => ({ ...s, isMinimized: !s.isMinimized })),
        setPosition: (x: number, y: number) => update(s => ({ ...s, position: { x, y } })),
        updateRoom: (room: Room | null) => update(s => ({ ...s, room, isConnected: !!room })),
        setError: (error: string) => update(s => ({ ...s, error })),
        setHasMic: (hasMic: boolean) => update(s => ({ ...s, hasMic })),
        setHasCamera: (hasCamera: boolean) => update(s => ({ ...s, hasCamera })),
        setIsSelfMuted: (muted: boolean) => update(s => ({ ...s, isSelfMuted: muted })),
        setIsSelfVideoEnabled: (enabled: boolean) => update(s => ({ ...s, isSelfVideoEnabled: enabled })),
        setIsScreenSharing: (sharing: boolean) => update(s => ({ ...s, isScreenSharing: sharing })),
        setParticipants: (participants: RemoteParticipant[]) => update(s => ({ ...s, participants })),
        setActiveSpeaker: (id: string | null) => update(s => ({ ...s, activeSpeakerId: id }))
    };
}

export const voiceChatStore = createVoiceChatStore();