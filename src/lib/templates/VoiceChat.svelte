<script lang="ts">
  import { onDestroy, untrack } from 'svelte';
  import { SvelteMap } from 'svelte/reactivity';
  import { PUBLIC_LIVEKIT_ORIGIN } from '$env/static/public';
  import { Room } from 'livekit-client';
  import type {
    RemoteParticipant,
    RemoteTrack,
    RemoteTrackPublication,
    LocalTrack
  } from 'livekit-client';
  import {
    Mic,
    MicOff,
    Video,
    VideoOff,
    Maximize2,
    Minimize2,
    Volume2,
    VolumeX,
    LogIn,
    LogOut
  } from '@lucide/svelte';
  import { voiceThreadId } from '$lib/writables';

  $effect(() => {
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    $voiceThreadId;
    untrack(async () => {
      if (isConnected) {
        const voiceThreadIdCopy = $voiceThreadId; // HACK, cuz leaveRoom() sets it to null
        await leaveRoom();
        $voiceThreadId = voiceThreadIdCopy;
      }
    }).then(() => {
      if ($voiceThreadId) {
        joinRoom($voiceThreadId);
      }
    });
  });

  let isConnected = $state(false);
  let error = $state('');
  let room = $state<Room | null>(null);

  let isSelfMuted = $state(false);
  let isOthersMuted = $state(false);
  let isSelfVideoEnabled = $state(true);
  let isMinimized = $state(false);
  let isFullscreen = $state(false);

  let participants = $state<RemoteParticipant[]>([]);
  let volumes = $state<Record<string, number>>({});
  let audioElements = new SvelteMap<string, HTMLAudioElement>();
  let localVideoEl = $state<HTMLVideoElement | null>(null);

  let isDragging = false;
  let isResizing = false;
  let dragStartX = 0;
  let dragStartY = 0;
  let initialX = 0;
  let initialY = 0;
  let initialWidth = 360;
  let initialHeight = 420;

  let position = $state({ x: 0, y: 0 });
  let dimensions = $state({ width: 360, height: 420 });

  let showVolumeSliderFor = $state<Record<string, boolean>>({});
  let volumeDisplayFor = $state<
    Record<string, { value: string; timeout?: ReturnType<typeof setTimeout> }>
  >({});

  const isBrowser = typeof document !== 'undefined';
  let pendingLocalVideoTrack: LocalTrack | null = null;

  function setDefaultPosition() {
    if (isBrowser) {
      position.x = window.innerWidth - dimensions.width - 16;
      position.y = 80;
    }
  }

  if (isBrowser) setDefaultPosition();

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
        setTimeout(tryAttach, 100);
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
    const container = document.querySelector(
      `.video-container[data-participant="${participantId}"]`
    );
    if (container) container.innerHTML = '';
  }

  function updateVolume(id: string, vol: number) {
    volumes = { ...volumes, [id]: vol };
    const el = audioElements.get(id);
    if (el) el.volume = vol;

    if (volumeDisplayFor[id]?.timeout) clearTimeout(volumeDisplayFor[id].timeout);
    volumeDisplayFor[id] = {
      value: `${Math.round(vol * 100)}%`,
      timeout: setTimeout(() => {
        volumeDisplayFor = { ...volumeDisplayFor, [id]: { value: '', timeout: undefined } };
      }, 1500)
    };
  }

  function toggleVolumeSlider(id: string, e: MouseEvent) {
    e.preventDefault();
    showVolumeSliderFor = { ...showVolumeSliderFor, [id]: !showVolumeSliderFor[id] };
  }

  async function toggleSelfMute() {
    if (!room) return;
    isSelfMuted = !isSelfMuted;
    await room.localParticipant.setMicrophoneEnabled(!isSelfMuted);
  }

  function toggleOthersMute() {
    isOthersMuted = !isOthersMuted;
    audioElements.forEach((el) => (el.muted = isOthersMuted));
  }

  async function toggleSelfVideo() {
    if (!room) return;
    isSelfVideoEnabled = !isSelfVideoEnabled;
    await room.localParticipant.setCameraEnabled(isSelfVideoEnabled);
  }

  function toggleMinimize() {
    isMinimized = !isMinimized;
  }

  function toggleFullscreen() {
    isFullscreen = !isFullscreen;
    if (isFullscreen) {
      position = { x: 0, y: 0 };
      dimensions = { width: window.innerWidth, height: window.innerHeight };
    } else {
      dimensions = { width: 360, height: 420 };
      setDefaultPosition();
    }
  }

  function handleParticipant(participant: RemoteParticipant) {
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

  function startDrag(e: MouseEvent) {
    if (isFullscreen) return;
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

  function startResize(e: MouseEvent) {
    if (isFullscreen || isMinimized) return;
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
    dimensions.width = Math.max(280, Math.min(800, initialWidth + deltaX));
    dimensions.height = Math.max(200, Math.min(800, initialHeight + deltaY));
    position.x = Math.min(position.x, window.innerWidth - dimensions.width);
    position.y = Math.min(position.y, window.innerHeight - dimensions.height);
  }

  function stopResize() {
    isResizing = false;
    document.removeEventListener('mousemove', handleResize);
    document.removeEventListener('mouseup', stopResize);
  }

  async function joinRoom(roomThreadId: number) {
    if (!isBrowser) return;
    try {
      const token = await getToken(roomThreadId);
      room = new Room();

      room.on('participantConnected', (p) => handleParticipant(p));
      room.on('participantDisconnected', (p) => {
        participants = participants.filter((part) => part.identity !== p.identity);
        detachTrack(p.identity);
        delete showVolumeSliderFor[p.identity];
        delete volumeDisplayFor[p.identity];
        delete volumes[p.identity];
      });

      room.on('connected', () => {
        room!.remoteParticipants.forEach((p) => handleParticipant(p));
      });

      room.on('disconnected', leaveRoom);

      await room.connect(PUBLIC_LIVEKIT_ORIGIN, token);

      const tracks = await room.localParticipant.createTracks({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000,
          channelCount: 1
        },
        video: isSelfVideoEnabled
      });

      await Promise.all(tracks.map((track) => room!.localParticipant.publishTrack(track)));

      const videoTrack = tracks.find((track) => track.kind === 'video');
      if (videoTrack) {
        pendingLocalVideoTrack = videoTrack;
        if (localVideoEl) {
          videoTrack.attach(localVideoEl);
        }
      }

      isConnected = true;
      error = '';
    } catch (err) {
      error = (err as Error).message || 'Connection failed';
      console.error('Join error:', err);
      leaveRoom();
    }
  }

  async function leaveRoom() {
    if (!isBrowser) return;
    if (room) {
      await room.disconnect();
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
    pendingLocalVideoTrack = null;

    isConnected = false;
    isSelfMuted = false;
    isOthersMuted = false;
    isSelfVideoEnabled = true;
    volumes = {};
    showVolumeSliderFor = {};
    volumeDisplayFor = {};

    $voiceThreadId = null;
  }

  $effect(() => {
    if (localVideoEl && pendingLocalVideoTrack) {
      pendingLocalVideoTrack.attach(localVideoEl);
      pendingLocalVideoTrack = null;
    }
  });

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
  class="fixed overflow-hidden rounded-xl border border-border bg-background text-sm shadow-xl transition-all duration-300"
  style="
    left: {position.x}px;
    top: {position.y}px;
    width: {dimensions.width}px;
    height: {isMinimized ? 'auto' : isFullscreen ? '100vh' : `${dimensions.height}px`};
    z-index: 100;
  "
  class:invisible={$voiceThreadId === null}
>
  <div
    role="toolbar"
    class="flex cursor-move items-center justify-between border-b border-border px-3 py-2 select-none"
    onmousedown={startDrag}
  >
    <h3 class="text-lg font-semibold">Voice Chat</h3>
    <div class="flex items-center gap-1">
      <button
        class="rounded p-1 hover:bg-accent"
        onclick={(e) => {
          e.stopPropagation();
          toggleFullscreen();
        }}
        title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
      >
        {#if isFullscreen}
          <Minimize2 size={18} />
        {:else}
          <Maximize2 size={18} />
        {/if}
      </button>
      <button
        class="rounded p-1 hover:bg-accent"
        onclick={(e) => {
          e.stopPropagation();
          toggleMinimize();
        }}
        title={isMinimized ? 'Expand' : 'Collapse'}
      >
        {#if isMinimized}
          <Maximize2 size={18} />
        {:else}
          <Minimize2 size={18} />
        {/if}
      </button>
    </div>
  </div>

  {#if error}
    <p class="p-2 text-sm text-destructive">{error}</p>
  {/if}

  {#if !isMinimized}
    <div class="flex flex-col" style="height: calc(100% - 60px);">
      {#if isConnected}
        <div class="relative mb-3 aspect-video overflow-hidden rounded-lg bg-black">
          <video
            bind:this={localVideoEl}
            autoplay
            playsinline
            muted
            class="h-full w-full object-cover"
          ></video>
          <span class="absolute bottom-1 left-1 rounded bg-black/60 px-1 text-xs text-white"
            >You</span
          >
        </div>
      {/if}

      <div class="mb-3 flex-1 overflow-auto">
        <div class="flex flex-row flex-wrap justify-center gap-2">
          {#each participants as p (p.sid)}
            {#if room && p.identity !== room.localParticipant.identity}
              <div class="flex w-24 flex-col items-center gap-1">
                <div
                  class="relative aspect-video w-full cursor-pointer overflow-hidden rounded-lg bg-black transition-colors hover:ring-2 hover:ring-accent"
                  oncontextmenu={(e) => {
                    e.preventDefault();
                    toggleVolumeSlider(p.identity, e);
                  }}
                >
                  <div class="video-container absolute inset-0" data-participant={p.identity}></div>
                  <span
                    class="absolute bottom-1 left-1 rounded bg-black/60 px-1 text-xs text-white"
                  >
                    {p.identity}
                  </span>
                </div>

                {#if showVolumeSliderFor[p.identity]}
                  <div class="w-full rounded bg-black/30 p-1">
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      class="h-1.5 w-full cursor-pointer accent-primary"
                      value={volumes[p.identity] ?? 1}
                      oninput={(e) => {
                        const val = parseFloat((e.target as HTMLInputElement).value);
                        updateVolume(p.identity, val);
                      }}
                    />
                    {#if volumeDisplayFor[p.identity]?.value}
                      <span class="mt-0.5 block text-center text-[10px] text-white">
                        {volumeDisplayFor[p.identity].value}
                      </span>
                    {/if}
                  </div>
                {/if}
              </div>
            {/if}
          {/each}
        </div>
      </div>

      <div class="mt-auto flex flex-wrap justify-center gap-3 border-t border-border py-2">
        <button
          class="rounded-full p-3 transition-colors {isSelfMuted
            ? 'bg-destructive text-white hover:bg-destructive/90'
            : 'bg-secondary hover:bg-secondary/80'}"
          onclick={toggleSelfMute}
          disabled={!isConnected}
        >
          {#if isSelfMuted}
            <MicOff size={20} />
          {:else}
            <Mic size={20} />
          {/if}
        </button>

        <button
          class="rounded-full p-3 transition-colors {isOthersMuted
            ? 'bg-destructive text-white hover:bg-destructive/90'
            : 'bg-secondary hover:bg-secondary/80'}"
          onclick={toggleOthersMute}
          disabled={!isConnected}
        >
          {#if isOthersMuted}
            <VolumeX size={20} />
          {:else}
            <Volume2 size={20} />
          {/if}
        </button>

        <button
          class="rounded-full p-3 transition-colors {!isSelfVideoEnabled
            ? 'bg-destructive text-white hover:bg-destructive/90'
            : 'bg-secondary hover:bg-secondary/80'}"
          onclick={toggleSelfVideo}
          disabled={!isConnected}
        >
          {#if isSelfVideoEnabled}
            <Video size={20} />
          {:else}
            <VideoOff size={20} />
          {/if}
        </button>

        <button
          class="rounded-full bg-destructive p-3 text-white transition-colors hover:bg-destructive/90"
          onclick={leaveRoom}
        >
          {#if isConnected}
            <LogOut size={20} />
          {:else}
            <LogIn size={20} />
          {/if}
        </button>
      </div>
    </div>
  {:else}
    <div class="flex justify-center gap-2 py-2">
      <button
        class="rounded-full p-2 transition-colors {isSelfMuted
          ? 'bg-destructive text-white hover:bg-destructive/90'
          : 'bg-secondary hover:bg-secondary/80'}"
        onclick={toggleSelfMute}
        disabled={!isConnected}
      >
        {#if isSelfMuted}
          <MicOff size={16} />
        {:else}
          <Mic size={16} />
        {/if}
      </button>
      <button
        class="rounded-full bg-destructive p-3 text-white transition-colors hover:bg-destructive/90"
        onclick={leaveRoom}
      >
        {#if isConnected}
          <LogOut size={16} />
        {:else}
          <LogIn size={16} />
        {/if}
      </button>
    </div>
  {/if}

  {#if !isMinimized && !isFullscreen}
    <div
      class="absolute right-0 bottom-0 h-4 w-4 cursor-se-resize"
      onmousedown={(e) => {
        e.stopPropagation();
        startResize(e);
      }}
      title="Drag to resize"
    >
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        class="text-muted-foreground"
      >
        <path d="m21 11-8-8-8 8" />
        <path d="M21 21h-8a8 8 0 0 1-8-8v0" />
      </svg>
    </div>
  {/if}
</div>

<style>
  .aspect-video {
    aspect-ratio: 16 / 9;
  }

  input[type='range']::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: currentColor;
    cursor: pointer;
  }

  input[type='range']::-moz-range-thumb {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: currentColor;
    cursor: pointer;
    border: none;
  }
</style>
