<script lang="ts">
  import { getContext, onDestroy } from 'svelte';
  import { SvelteMap } from 'svelte/reactivity';
  import { PUBLIC_LIVEKIT_ORIGIN } from '$env/static/public';

  import { Room } from 'livekit-client';
  import type {
    RemoteParticipant,
    RemoteTrack,
    RemoteTrackPublication,
    LocalTrack
  } from 'livekit-client';

  const { getCurrentThreadId } = getContext('threads') as {
    getCurrentThreadId: () => number | null;
  };

  let isConnected = false;
  let error = '';
  let room: Room | null = null;

  let isSelfMuted = false;
  let isOthersMuted = false;
  let isSelfVideoEnabled = true;
  let isMinimized = false;

  let participants: RemoteParticipant[] = [];
  let volumes: Record<string, number> = {};
  let audioElements = new SvelteMap<string, HTMLAudioElement>();
  let localVideoEl: HTMLVideoElement | null = null;

  // UI drag & resize state
  let isDragging = false;
  let isResizing = false;
  let dragStartX = 0;
  let dragStartY = 0;
  let initialX = 0;
  let initialY = 0;
  let initialWidth = 320;
  let initialHeight = 400;

  // Позиция по умолчанию - справа под навбаром (навбар ~ h-16 = 4rem = 64px)
  let position = { x: window.innerWidth - 336, y: 80 }; // 320px + 16px отступ
  let dimensions = { width: 320, height: 400 };

  const isBrowser = typeof document !== 'undefined';
  let pendingLocalVideoTrack: LocalTrack | null = null;

  async function getToken(threadId: number) {
    const res = await fetch('/api/thread/sfu/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ thread_id: threadId })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to get token');
    }

    const { token } = await res.json();
    return token;
  }

  function attachAudioTrack(track: RemoteTrack, participantId: string) {
    if (!isBrowser) return;
    const element = track.attach() as HTMLAudioElement;
    element.dataset.participant = participantId;
    element.muted = isOthersMuted;
    element.volume = volumes[participantId] ?? 1;
    element.style.display = 'none';
    document.body.appendChild(element);
    audioElements.set(participantId, element);
  }

  function attachVideoTrack(track: RemoteTrack, participantId: string) {
    if (!isBrowser) return;

    const element = track.attach() as HTMLVideoElement;
    element.autoplay = true;
    element.playsInline = true;
    element.muted = true;

    const tryAttach = () => {
      const container = document.querySelector(
        `.video-container[data-participant="${participantId}"]`
      ) as HTMLElement | null;

      if (container) {
        container.innerHTML = '';
        container.appendChild(element);
      } else {
        setTimeout(() => {
          tryAttach();
        }, 100);
      }
    };

    tryAttach();
  }

  function detachTrack(participantId: string) {
    if (!isBrowser) return;
    const audioEl = audioElements.get(participantId);
    if (audioEl) {
      audioEl.remove();
      audioElements.delete(participantId);
    }
  }

  function updateVolume(participantId: string, volume: number) {
    volumes = { ...volumes, [participantId]: volume };
    if (!isBrowser) return;
    const el = audioElements.get(participantId);
    if (el) {
      el.volume = volume;
    }
  }

  async function toggleSelfMute() {
    if (!room) return;
    isSelfMuted = !isSelfMuted;
    await room.localParticipant.setMicrophoneEnabled(!isSelfMuted);
  }

  function toggleOthersMute() {
    if (!isBrowser) return;
    isOthersMuted = !isOthersMuted;
    audioElements.forEach((el) => {
      el.muted = isOthersMuted;
    });
  }

  async function toggleSelfVideo() {
    if (!room) return;
    isSelfVideoEnabled = !isSelfVideoEnabled;
    await room.localParticipant.setCameraEnabled(isSelfVideoEnabled);
  }

  function toggleMinimize() {
    isMinimized = !isMinimized;
  }

  function handleParticipant(participant: RemoteParticipant) {
    // Для будущих треков (новые публикации от этого участника)
    participant.on('trackPublished', (pub: RemoteTrackPublication) => {
      const onSubscribed = (track: RemoteTrack) => {
        if (track.kind === 'audio') {
          attachAudioTrack(track, participant.identity);
        } else if (track.kind === 'video') {
          attachVideoTrack(track, participant.identity);
        }
        pub.off('subscribed', onSubscribed);
      };

      if (pub.isSubscribed && pub.track) {
        onSubscribed(pub.track);
      } else {
        pub.on('subscribed', onSubscribed);
        pub.setSubscribed(true);
      }

      pub.on('unsubscribed', () => {
        detachTrack(participant.identity);
      });
    });

    // Для уже существующих треков (на момент подключения)
    participant.trackPublications.forEach((pub) => {
      const onSubscribed = (track: RemoteTrack) => {
        if (track.kind === 'audio') {
          attachAudioTrack(track, participant.identity);
        } else if (track.kind === 'video') {
          attachVideoTrack(track, participant.identity);
        }
        pub.off('subscribed', onSubscribed);
      };

      if (pub.isSubscribed && pub.track) {
        onSubscribed(pub.track);
      } else {
        pub.on('subscribed', onSubscribed);
        pub.setSubscribed(true);
      }
    });

    if (!participants.some((p) => p.identity === participant.identity)) {
      participants = [...participants, participant];
    }
  }

  // Drag handlers
  function startDrag(e: MouseEvent) {
    isDragging = true;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    initialX = position.x;
    initialY = position.y;

    document.addEventListener('mousemove', handleDrag);
    document.addEventListener('mouseup', stopDrag);
    e.preventDefault();
  }

  function handleDrag(e: MouseEvent) {
    if (!isDragging) return;

    const deltaX = e.clientX - dragStartX;
    const deltaY = e.clientY - dragStartY;

    position.x = Math.max(0, Math.min(window.innerWidth - dimensions.width, initialX + deltaX));
    position.y = Math.max(0, Math.min(window.innerHeight - dimensions.height, initialY + deltaY));
  }

  function stopDrag() {
    isDragging = false;
    document.removeEventListener('mousemove', handleDrag);
    document.removeEventListener('mouseup', stopDrag);
  }

  // Resize handlers
  function startResize(e: MouseEvent) {
    isResizing = true;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    initialWidth = dimensions.width;
    initialHeight = dimensions.height;

    document.addEventListener('mousemove', handleResize);
    document.addEventListener('mouseup', stopResize);
    e.preventDefault();
    e.stopPropagation();
  }

  function handleResize(e: MouseEvent) {
    if (!isResizing) return;

    const deltaX = e.clientX - dragStartX;
    const deltaY = e.clientY - dragStartY;

    dimensions.width = Math.max(280, Math.min(600, initialWidth + deltaX));
    dimensions.height = Math.max(200, Math.min(800, initialHeight + deltaY));
  }

  function stopResize() {
    isResizing = false;
    document.removeEventListener('mousemove', handleResize);
    document.removeEventListener('mouseup', stopResize);
  }

  async function joinRoom() {
    if (!isBrowser) return;
    try {
      const token = await getToken(getCurrentThreadId()!);
      room = new Room();

      room.on('participantConnected', (p) => handleParticipant(p));
      room.on('participantDisconnected', (p) => {
        participants = participants.filter((part) => part.identity !== p.identity);
        detachTrack(p.identity);
      });

      room.on('connected', () => {
        room!.remoteParticipants.forEach((p) => handleParticipant(p));
      });

      await room.connect(PUBLIC_LIVEKIT_ORIGIN, token);

      // Создаем все треки через createTracks для правильной синхронизации
      const tracks = await room.localParticipant.createTracks({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          googEchoCancellation: true,
          googAutoGainControl: true,
          googNoiseSuppression: true,
          sampleRate: 48000,
          channelCount: 1
        },
        video: isSelfVideoEnabled
      });

      // Публикуем все треки сразу
      await room.localParticipant.publishTracks(tracks);

      // Находим видео трек для локального превью
      const videoTrack = tracks.find((track) => track.kind === 'video');
      if (videoTrack) {
        pendingLocalVideoTrack = videoTrack;
        if (localVideoEl) {
          videoTrack.attach(localVideoEl);
        }
      }

      isConnected = true;
      error = '';
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      error = err.message || 'Connection failed';
      console.error('Join error:', err);
      leaveRoom();
    }
  }

  function leaveRoom() {
    if (!isBrowser) return;

    if (room) {
      room.disconnect();
      room = null;
    }
    participants = [];
    audioElements.forEach((el) => el.remove());
    audioElements.clear();
    document.querySelectorAll('.video-container').forEach((el) => {
      (el as HTMLElement).innerHTML = '';
    });
    if (localVideoEl) {
      localVideoEl.srcObject = null;
      localVideoEl.load();
    }
    isConnected = false;
    isSelfMuted = false;
    isOthersMuted = false;
    isSelfVideoEnabled = true;
    volumes = {};
  }

  $: {
    if (localVideoEl && pendingLocalVideoTrack) {
      pendingLocalVideoTrack.attach(localVideoEl);
      pendingLocalVideoTrack = null;
    }
  }

  onDestroy(() => {
    leaveRoom();
  });
</script>

<svelte:window
  on:mousemove={(e) => {
    if (isDragging) handleDrag(e);
    if (isResizing) handleResize(e);
  }}
  on:mouseup={() => {
    if (isDragging) stopDrag();
    if (isResizing) stopResize();
  }}
/>

<div
  class="fixed rounded-lg border-2 border-gray-300 bg-white text-sm shadow-lg"
  style="left: {position.x}px; top: {position.y}px; width: {dimensions.width}px; height: {isMinimized
    ? 'auto'
    : dimensions.height + 'px'}; z-index: 50;"
>
  <!-- Header with drag handle and minimize button -->
  <div
    role="application"
    aria-label="Voice chat window controls"
    class="flex cursor-move items-center justify-between border-b border-gray-300 p-3"
    on:mousedown={startDrag}
  >
    <h3 class="text-xl font-medium text-gray-800">Голосовой чат</h3>
    <button
      class="cursor-pointer rounded p-1 transition-colors duration-200 hover:bg-gray-200"
      on:click={toggleMinimize}
      aria-label={isMinimized ? 'Развернуть окно' : 'Свернуть окно'}
    >
      {#if isMinimized}
        <!-- Expand icon -->
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path
            d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"
          />
        </svg>
      {:else}
        <!-- Minimize icon -->
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path
            d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"
          />
        </svg>
      {/if}
    </button>
  </div>

  {#if error}
    <p class="p-3 text-sm text-red-600">{error}</p>
  {/if}

  {#if !isMinimized}
    <!-- Main content -->
    <div class="flex flex-col p-3" style="height: calc(100% - 60px);">
      {#if isConnected}
        <!-- Local video preview -->
        <div class="mb-3 overflow-hidden rounded bg-black">
          <video
            bind:this={localVideoEl}
            class="block h-24 w-full object-cover"
            autoplay
            playsinline
            muted
          ></video>
        </div>
      {/if}

      <!-- Participants grid - horizontal layout -->
      <div class="mb-3 flex-1 overflow-auto">
        <div class="flex flex-row flex-wrap gap-2">
          {#each participants as p (p.sid)}
            {#if room && p.identity !== room.localParticipant.identity}
              <div class="flex w-32 flex-col items-center gap-1 rounded bg-gray-100 p-2">
                <div
                  class="video-container h-20 w-full overflow-hidden rounded bg-black"
                  data-participant={p.identity}
                ></div>
                <div class="flex w-full flex-col items-center gap-1">
                  <span
                    class="w-full overflow-hidden text-center text-xs text-ellipsis whitespace-nowrap text-gray-700"
                    >{p.identity}</span
                  >
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    class="h-2 w-full"
                    bind:value={volumes[p.identity]}
                    on:input={(e) =>
                      updateVolume(p.identity, parseFloat((e.target as HTMLInputElement).value))}
                  />
                </div>
              </div>
            {/if}
          {/each}
        </div>
      </div>

      <!-- Control buttons at bottom -->
      <div class="flex justify-center gap-2 border-t border-gray-300 pt-3">
        <button
          class="flex cursor-pointer flex-col items-center gap-1 rounded bg-blue-600 p-2 text-white transition-colors duration-200 hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400 disabled:opacity-50"
          on:click={toggleSelfMute}
          disabled={!isConnected}
          title={isSelfMuted ? 'Размутить себя' : 'Заглушить себя'}
        >
          {#if isSelfMuted}
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="m12 8-6 6" /><path d="m18 8-6 6" /><path d="M2 2l20 20" />
            </svg>
          {:else}
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" /><path
                d="M19 10v2a7 7 0 0 1-14 0v-2"
              /><path d="M12 19v3" />
            </svg>
          {/if}
          <span class="text-xs">{isSelfMuted ? 'Вкл' : 'Выкл'}</span>
        </button>

        <button
          class="flex cursor-pointer flex-col items-center gap-1 rounded bg-purple-600 p-2 text-white transition-colors duration-200 hover:bg-purple-700 disabled:cursor-not-allowed disabled:bg-gray-400 disabled:opacity-50"
          on:click={toggleOthersMute}
          disabled={!isConnected}
          title={isOthersMuted ? 'Включить других' : 'Заглушить всех'}
        >
          {#if isOthersMuted}
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M17 6h4" /><path d="M21 10v4" /><path d="M17 18h4" /><path
                d="M21 2l-4 4"
              /><path d="M21 22l-4-4" />
              <path d="M12 8v8a4 4 0 0 0 4 4h1a4 4 0 0 0 4-4V8a4 4 0 0 0-4-4h-1a4 4 0 0 0-4 4Z" />
            </svg>
          {:else}
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" /><path
                d="M19 10v2a7 7 0 0 1-14 0v-2"
              />
              <path d="M12 19v3" />
            </svg>
          {/if}
          <span class="text-xs">Все</span>
        </button>

        <button
          class="flex cursor-pointer flex-col items-center gap-1 rounded bg-green-600 p-2 text-white transition-colors duration-200 hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-400 disabled:opacity-50"
          on:click={toggleSelfVideo}
          disabled={!isConnected}
          title={isSelfVideoEnabled ? 'Выключить видео' : 'Включить видео'}
        >
          {#if isSelfVideoEnabled}
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="m22 8-6 4 6 4V8Z" /><rect x="2" y="6" width="14" height="12" rx="2" ry="2" />
            </svg>
          {:else}
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="m2 2 20 20" /><path d="M22 8v8a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2v-2.34" />
              <path d="m16 10 3-3-3-3v6Z" /><path d="M2 8v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
            </svg>
          {/if}
          <span class="text-xs">Видео</span>
        </button>

        <button
          class="flex cursor-pointer flex-col items-center gap-1 rounded {isConnected
            ? 'bg-red-600 hover:bg-red-700'
            : 'bg-blue-600 hover:bg-blue-700'} p-2 text-white transition-colors duration-200 disabled:cursor-not-allowed disabled:bg-gray-400 disabled:opacity-50"
          on:click={isConnected ? leaveRoom : joinRoom}
          disabled={error !== ''}
          title={isConnected ? 'Выйти' : 'Войти'}
        >
          {#if isConnected}
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M10 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h4" /><path d="m17 16 4-4-4-4" /><path
                d="M21 12H9"
              />
            </svg>
          {:else}
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M22 12h-4" /><path d="M16 6l4 4-4 4" /><path d="M18 12h-8" />
              <path d="M6 6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-4" />
            </svg>
          {/if}
          <span class="text-xs">{isConnected ? 'Выйти' : 'Войти'}</span>
        </button>
      </div>
    </div>
  {:else}
    <!-- Minimized state - only buttons -->
    <div class="flex justify-center gap-2 p-3">
      <button
        class="flex cursor-pointer flex-col items-center gap-1 rounded bg-blue-600 p-2 text-white transition-colors duration-200 hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400 disabled:opacity-50"
        on:click={toggleSelfMute}
        disabled={!isConnected}
        title={isSelfMuted ? 'Размутить себя' : 'Заглушить себя'}
      >
        {#if isSelfMuted}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="m12 8-6 6" /><path d="m18 8-6 6" /><path d="M2 2l20 20" />
          </svg>
        {:else}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" /><path
              d="M19 10v2a7 7 0 0 1-14 0v-2"
            />
            <path d="M12 19v3" />
          </svg>
        {/if}
      </button>

      <button
        class="flex cursor-pointer flex-col items-center gap-1 rounded {isConnected
          ? 'bg-red-600 hover:bg-red-700'
          : 'bg-blue-600 hover:bg-blue-700'} p-2 text-white transition-colors duration-200 disabled:cursor-not-allowed disabled:bg-gray-400 disabled:opacity-50"
        on:click={isConnected ? leaveRoom : joinRoom}
        disabled={error !== ''}
        title={isConnected ? 'Выйти' : 'Войти'}
      >
        {#if isConnected}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M10 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h4" /><path d="m17 16 4-4-4-4" /><path
              d="M21 12H9"
            />
          </svg>
        {:else}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M22 12h-4" /><path d="M16 6l4 4-4 4" /><path d="M18 12h-8" />
            <path d="M6 6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-4" />
          </svg>
        {/if}
      </button>
    </div>
  {/if}

  <!-- Resize handle -->
  {#if !isMinimized}
    <div
      role="slider"
      aria-label="Resize voice chat window"
      class="absolute right-0 bottom-0 h-3 w-3 cursor-se-resize"
      on:mousedown={startResize}
    >
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        class="absolute right-0 bottom-0 text-gray-500"
      >
        <path d="m21 11-8-8-8 8" /><path d="M21 21h-8a8 8 0 0 1-8-8v0" />
      </svg>
    </div>
  {/if}
</div>

<style>
  /* Hide scrollbar for participants container */
  .flex-1.overflow-auto::-webkit-scrollbar {
    display: none;
  }

  .flex-1.overflow-auto {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
</style>
