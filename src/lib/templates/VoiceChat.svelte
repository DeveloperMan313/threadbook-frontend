<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import { PUBLIC_LIVEKIT_ORIGIN } from '$env/static/public';
  import {
    Room,
    LocalAudioTrack,
    LocalVideoTrack,
    Track,
    type RemoteParticipant,
    type Participant,
    type TrackPublication
  } from 'livekit-client';

  import { voiceChatStore } from '$lib/stores/voiceChatStore';
  import type { VoiceChatState } from '$lib/stores/voiceChatStore';

  let isLoading = false;
  let volumes: Record<string, number> = {};
  let pinnedParticipantId: string | null = null;

  let state!: VoiceChatState;
  const unsubscribe = voiceChatStore.subscribe((s) => (state = s));

  let localVideoEl: HTMLVideoElement | null = null;
  let chatRef: HTMLDivElement | null = null;

  let audioElements = new Map<string, HTMLAudioElement>();
  const isBrowser = typeof document !== 'undefined';

  const THREAD_ID = 1;

  async function getToken() {
    const res = await fetch('/api/thread/sfu/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ thread_id: THREAD_ID })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Не удалось получить токен');
    }
    const { token } = await res.json();
    return token;
  }

  function attachAudioTrack(track: Track, participantId: string) {
    if (!isBrowser) return;
    const el = track.attach() as HTMLAudioElement;
    el.dataset.participant = participantId;
    el.muted = false;
    el.volume = volumes[participantId] ?? 1;
    el.style.display = 'none';
    document.body.appendChild(el);
    audioElements.set(participantId, el);
  }

  function attachVideoTrack(track: Track, participantId: string) {
    if (!isBrowser) return;
    const el = track.attach() as HTMLVideoElement;
    el.autoplay = true;
    el.playsInline = true;
    el.muted = true;
    el.className = 'w-full h-full object-cover rounded';
    const container = document.querySelector(
      `.video-container[data-participant="${participantId}"]`
    );
    if (container) {
      container.innerHTML = '';
      container.appendChild(el);
    }
  }

  function detachTrack(participantId: string) {
    const el = audioElements.get(participantId);
    if (el) {
      el.remove();
      audioElements.delete(participantId);
    }
  }

  function updateVolume(participantId: string, volume: number) {
    volumes[participantId] = volume;
    const el = audioElements.get(participantId);
    if (el) el.volume = volume;
  }

  async function toggleSelfMute() {
    if (!state.room || !state.hasMic) return;
    const newMuted = !state.isSelfMuted;
    await state.room.localParticipant.setMicrophoneEnabled(!newMuted);
    voiceChatStore.setIsSelfMuted(newMuted);
  }

  async function toggleSelfVideo() {
    if (!state.room || !state.hasCamera) return;
    const newEnabled = !state.isSelfVideoEnabled;
    await state.room.localParticipant.setCameraEnabled(newEnabled);
    voiceChatStore.setIsSelfVideoEnabled(newEnabled);
  }

  function handleParticipant(participant: RemoteParticipant) {
    participant.trackPublications.forEach((pub) => {
      if (pub.track) {
        if (pub.track.kind === 'audio') attachAudioTrack(pub.track, participant.identity);
        else if (pub.track.kind === 'video') attachVideoTrack(pub.track, participant.identity);
      }
    });
  }

  async function joinRoom() {
    if (!isBrowser || isLoading) return;
    isLoading = true;
    voiceChatStore.setError('');

    try {
      const token = await getToken();
      const newRoom = new Room({ adaptiveStream: true, dynacast: true });

      newRoom.on('participantConnected', handleParticipant);
      newRoom.on('participantDisconnected', (p) => {
        voiceChatStore.setParticipants(
          state.participants.filter((part) => part.identity !== p.identity)
        );
        detachTrack(p.identity);
      });

      newRoom.once('disconnected', leaveRoom);

      await newRoom.connect(PUBLIC_LIVEKIT_ORIGIN, token);

      await new Promise<void>((resolve) => {
        newRoom.once('connected', () => resolve());
      });

      // Микрофон
      let audioTrack: LocalAudioTrack | null = null;
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (stream.getAudioTracks().length > 0) {
          audioTrack = new LocalAudioTrack(stream.getAudioTracks()[0]);
          await newRoom.localParticipant.publishTrack(audioTrack);
        }
      } catch (err) {
        console.warn('Микрофон недоступен:', err);
        voiceChatStore.setHasMic(false);
      }

      // Камера
      let videoTrack: LocalVideoTrack | null = null;
      if (state.isSelfVideoEnabled) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          if (stream.getVideoTracks().length > 0) {
            videoTrack = new LocalVideoTrack(stream.getVideoTracks()[0]);
            await newRoom.localParticipant.publishTrack(videoTrack);
            if (videoTrack && localVideoEl) {
              videoTrack.attach(localVideoEl);
            }
          }
        } catch (err) {
          console.warn('Камера недоступна:', err);
          voiceChatStore.setHasCamera(false);
          voiceChatStore.setIsSelfVideoEnabled(false);
        }
      }

      voiceChatStore.updateRoom(newRoom);
    } catch (err: any) {
      voiceChatStore.setError(err?.message || 'Не удалось подключиться');
      console.error('Ошибка подключения:', err);
      leaveRoom();
    } finally {
      isLoading = false;
    }
  }

  function leaveRoom() {
    if (state.room) {
      state.room.localParticipant.trackPublications.forEach((pub: TrackPublication) => {
        pub.track?.stop?.();
        pub.track?.detach?.();
      });
      try {
        state.room.disconnect();
      } catch {}
    }

    audioElements.forEach((el) => el.remove());
    audioElements.clear();

    voiceChatStore.leave();
    volumes = {};
    pinnedParticipantId = null;
  }

  onMount(() => {
    if (state.isConnected && state.room) {
      state.room.remoteParticipants.forEach(handleParticipant);
    }
    return () => unsubscribe();
  });
</script>

{#if !state.isMinimized}
  <div
    bind:this={chatRef}
    role="dialog"
    aria-label="Голосовой чат"
    aria-modal="false"
    tabindex="0"
    class="fixed z-50 rounded-xl border border-gray-700 bg-gray-900 text-white shadow-xl select-none focus:ring-2 focus:ring-cyan-500 focus:outline-none"
    style="left: {state.position.x}px; top: {state.position.y}px; width: 288px;"
  >
    <!-- Заголовок -->
    <div class="flex cursor-move items-center justify-between rounded-t-xl p-4 pb-3">
      <h3 class="font-semibold text-cyan-400">Голосовой чат</h3>
      <button
        class="rounded text-gray-400 hover:text-white focus:ring-2 focus:ring-cyan-400 focus:outline-none"
        aria-label="Свернуть чат"
        on:click={voiceChatStore.toggleMinimized}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <path d="M5 12h14" />
        </svg>
      </button>
    </div>

    <div class="px-4 pb-4">
      {#if state.error}
        <div
          class="mb-3 rounded bg-red-900/50 p-2 text-sm text-red-200"
          role="alert"
          aria-live="polite"
        >
          {state.error}
        </div>
      {/if}

      {#if state.isConnected}
        <div class="relative mb-3 aspect-video overflow-hidden rounded-lg bg-black">
          <video
            bind:this={localVideoEl}
            autoplay
            playsinline
            muted
            class="h-full w-full object-cover"
            aria-label="Ваше видео"
          ></video>
          <div class="absolute right-2 bottom-2 flex gap-1" aria-hidden="true">
            {#if state.hasMic}
              <span class="rounded bg-black/70 px-1 text-xs text-white">
                {state.isSelfMuted ? '🔇' : '🎤'}
              </span>
            {/if}
          </div>
        </div>
      {/if}

      <div class="mb-3 grid grid-cols-2 gap-2">
        <button
          class="flex items-center justify-center gap-1 rounded bg-gray-800 py-2 text-xs hover:bg-gray-700 focus:ring-2 focus:ring-cyan-400 focus:outline-none disabled:opacity-50"
          on:click={toggleSelfMute}
          disabled={!state.isConnected || !state.hasMic}
        >
          {state.isSelfMuted ? 'Размутить' : 'Заглушить'}
        </button>

        <button
          class="flex items-center justify-center gap-1 rounded bg-gray-800 py-2 text-xs hover:bg-gray-700 focus:ring-2 focus:ring-cyan-400 focus:outline-none disabled:opacity-50"
          on:click={toggleSelfVideo}
          disabled={!state.isConnected || !state.hasCamera}
        >
          {state.isSelfVideoEnabled ? 'Выкл. камеру' : 'Вкл. камеру'}
        </button>
      </div>

      <div class="mb-3 max-h-40 space-y-2 overflow-y-auto">
        {#each state.participants as p (p.identity)}
          {#if state.room && p.identity !== state.room.localParticipant.identity}
            <div class="group relative rounded bg-gray-800 p-2">
              <div
                class="video-container relative mb-1 aspect-video w-full rounded bg-black"
                data-participant={p.identity}
                aria-label={`Видео участника ${p.identity}`}
              ></div>
              <div class="text-xs">{p.identity}</div>
            </div>
          {/if}
        {/each}
      </div>

      <button
        class="w-full rounded bg-cyan-600 py-2 text-sm font-medium hover:bg-cyan-500 focus:ring-2 focus:ring-cyan-400 focus:outline-none disabled:opacity-50"
        on:click={state.isConnected ? leaveRoom : joinRoom}
        disabled={isLoading || (state.error !== '' && !state.isConnected)}
      >
        {isLoading ? 'Подключение…' : state.isConnected ? 'Выйти' : 'Войти в чат'}
      </button>
    </div>
  </div>
{/if}

<style>
  .video-container {
    position: relative;
  }
</style>
