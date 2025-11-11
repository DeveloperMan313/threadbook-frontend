<script lang="ts">
  import { getContext, onDestroy } from 'svelte';
  import { SvelteMap } from 'svelte/reactivity';
  import { PUBLIC_LIVEKIT_ORIGIN } from '$env/static/public';
  import { Room, RoomEvent } from 'livekit-client';
  import type { RemoteParticipant, RemoteTrack, LocalTrack } from 'livekit-client';
  import {
    Mic,
    MicOff,
    Video,
    VideoOff,
    Users,
    Maximize2,
    Minimize2,
    Volume2,
    VolumeX,
    LogIn,
    LogOut
  } from '@lucide/svelte';

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
  let isFullscreen = false;

  let participants: RemoteParticipant[] = [];
  let volumes: Record<string, number> = {};
  let audioElements = new SvelteMap<string, HTMLAudioElement>();
  let localVideoEl: HTMLVideoElement | null = null;
  let pendingLocalVideoTrack: LocalTrack | null = null;

  let pinnedParticipant: string | null = null;
  let activeSpeakerId: string | null = null;

  let isDragging = false;
  let isResizing = false;
  let dragStart = { x: 0, y: 0 };
  let initialX = 0;
  let initialY = 0;
  let initialWidth = 360;
  let initialHeight = 420;

  let position = { x: 0, y: 0 };
  let dimensions = { width: 360, height: 420 };

  let showVolumeSliderFor: Record<string, boolean> = {};
  let volumeDisplayFor: Record<string, { value: string; timeout?: ReturnType<typeof setTimeout> }> =
    {};

  const isBrowser = typeof document !== 'undefined';

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
    if (!res.ok)
      throw new Error((await res.json().catch(() => ({}))).error || 'Failed to get token');
    const { token } = await res.json();
    return token;
  }

  function attachAudioTrack(track: RemoteTrack, id: string) {
    if (!isBrowser) return;
    const el = track.attach() as HTMLAudioElement;
    el.dataset.participant = id;
    el.muted = isOthersMuted;
    el.volume = volumes[id] ?? 1;
    el.style.display = 'none';
    document.body.appendChild(el);
    audioElements.set(id, el);
  }

  function attachVideoTrack(track: RemoteTrack, id: string) {
    if (!isBrowser) return;
    const el = track.attach() as HTMLVideoElement;
    el.autoplay = true;
    el.playsInline = true;
    el.muted = id === room?.localParticipant.identity;

    const tryAttach = () => {
      const container = document.querySelector(`.video-container[data-participant="${id}"]`);
      if (container) {
        container.innerHTML = '';
        container.appendChild(el);
      } else {
        setTimeout(tryAttach, 100);
      }
    };
    tryAttach();
  }

  function detachTrack(pid: string) {
    const el = audioElements.get(pid);
    if (el) {
      el.remove();
      audioElements.delete(pid);
    }
    const container = document.querySelector(`.video-container[data-participant="${pid}"]`);
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

  function handleParticipant(p: RemoteParticipant) {
    const subscribe = (track: RemoteTrack) => {
      if (track.kind === 'audio') attachAudioTrack(track, p.identity);
      else attachVideoTrack(track, p.identity);
    };

    p.on(RoomEvent.TrackSubscribed, subscribe);
    p.on(RoomEvent.TrackUnsubscribed, () => detachTrack(p.identity));

    if (!participants.find((x) => x.identity === p.identity)) participants = [...participants, p];
  }

  async function joinRoom() {
    if (isConnected) return;
    if (!PUBLIC_LIVEKIT_ORIGIN) {
      error = 'No LiveKit origin configured';
      return;
    }

    try {
      const threadId = getCurrentThreadId();
      if (!threadId) throw new Error('No thread ID');
      const token = await getToken(threadId);

      room = new Room();

      room.on(RoomEvent.ParticipantConnected, handleParticipant);
      room.on(RoomEvent.ParticipantDisconnected, (p) => {
        participants = participants.filter((x) => x.identity !== p.identity);
        detachTrack(p.identity);
        delete showVolumeSliderFor[p.identity];
        delete volumeDisplayFor[p.identity];
        delete volumes[p.identity];
      });
      room.on(RoomEvent.ActiveSpeakersChanged, (speakers) => {
        activeSpeakerId = speakers.length > 0 ? speakers[0].identity : null;
      });
      room.on(RoomEvent.Disconnected, leaveRoom);

      await room.connect(PUBLIC_LIVEKIT_ORIGIN, token);

      const audioTrackPromise = room.localParticipant
        .createTracks({
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
        })
        .catch(() => []);

      const videoTrackPromise = isSelfVideoEnabled
        ? room.localParticipant.createTracks({ video: true }).catch(() => [])
        : Promise.resolve([]);

      const [audioTracks, videoTracks] = await Promise.all([audioTrackPromise, videoTrackPromise]);
      const allTracks = [...audioTracks, ...videoTracks];
      await Promise.all(allTracks.map((track) => room!.localParticipant.publishTrack(track)));

      const videoTrack = videoTracks.find((t) => t.kind === 'video');
      if (videoTrack) {
        pendingLocalVideoTrack = videoTrack;
        if (localVideoEl) videoTrack.attach(localVideoEl);
      }

      room.remoteParticipants.forEach(handleParticipant);
      isConnected = true;
    } catch (e: any) {
      error = e.message || 'Connection failed';
      leaveRoom();
    }
  }

  function leaveRoom() {
    if (room) {
      room.removeAllListeners();
      room.disconnect();
      room = null;
    }
    participants = [];
    audioElements.forEach((a) => a.remove());
    audioElements.clear();
    document
      .querySelectorAll('.video-container')
      .forEach((el) => ((el as HTMLElement).innerHTML = ''));
    if (localVideoEl) {
      localVideoEl.srcObject = null;
      localVideoEl.load();
    }
    pendingLocalVideoTrack = null;

    isConnected = false;
    isSelfMuted = false;
    isSelfVideoEnabled = true;
    isOthersMuted = false;
    volumes = {};
    showVolumeSliderFor = {};
    volumeDisplayFor = {};
  }

  function handlePin(id: string) {
    pinnedParticipant = pinnedParticipant === id ? null : id;
  }

  $: if (localVideoEl && pendingLocalVideoTrack) {
    pendingLocalVideoTrack.attach(localVideoEl);
    pendingLocalVideoTrack = null;
  }

  function startDrag(e: MouseEvent) {
    if (isFullscreen) return;
    isDragging = true;
    dragStart = { x: e.clientX - position.x, y: e.clientY - position.y };
    initialX = position.x;
    initialY = position.y;
    document.addEventListener('mousemove', handleDrag);
    document.addEventListener('mouseup', stopDrag);
    e.preventDefault();
  }

  function handleDrag(e: MouseEvent) {
    if (!isDragging) return;
    position.x = Math.min(window.innerWidth - 100, Math.max(0, e.clientX - dragStart.x));
    position.y = Math.min(window.innerHeight - 50, Math.max(0, e.clientY - dragStart.y));
  }

  function stopDrag() {
    isDragging = false;
    document.removeEventListener('mousemove', handleDrag);
    document.removeEventListener('mouseup', stopDrag);
  }

  function startResize(e: MouseEvent) {
    if (isFullscreen || isMinimized) return;
    isResizing = true;
    dragStart = { x: e.clientX, y: e.clientY };
    initialWidth = dimensions.width;
    initialHeight = dimensions.height;
    document.addEventListener('mousemove', handleResize);
    document.addEventListener('mouseup', stopResize);
    e.preventDefault();
    e.stopPropagation();
  }

  function handleResize(e: MouseEvent) {
    if (!isResizing) return;
    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;

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

  onDestroy(() => {
    leaveRoom();
    document.removeEventListener('mousemove', handleDrag);
    document.removeEventListener('mouseup', stopDrag);
    document.removeEventListener('mousemove', handleResize);
    document.removeEventListener('mouseup', stopResize);
  });
</script>

<div
  class="fixed overflow-hidden rounded-xl border border-border bg-background text-sm shadow-xl transition-all duration-300"
  style="
    left: {position.x}px;
    top: {position.y}px;
    width: {dimensions.width}px;
    height: {isMinimized ? 'auto' : isFullscreen ? '100vh' : `${dimensions.height}px`};
    z-index: 100;
  "
>
  <div
    role="toolbar"
    class="flex cursor-move items-center justify-between border-b border-border px-3 py-2 select-none"
    on:mousedown={startDrag}
  >
    <h3 class="text-lg font-semibold">Voice Chat</h3>
    <div class="flex items-center gap-1">
      <button
        class="rounded p-1 hover:bg-accent"
        on:click|stopPropagation={toggleFullscreen}
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
        on:click|stopPropagation={toggleMinimize}
        title={isMinimized ? 'Expand' : 'Minimize'}
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
                  class="relative aspect-video w-full cursor-pointer overflow-hidden rounded-lg bg-black transition-all duration-300 hover:ring-2 hover:ring-accent
                    {activeSpeakerId === p.identity ? 'scale-[1.02] ring-2 ring-primary' : ''}"
                  on:click={() => handlePin(p.identity)}
                  on:contextmenu|preventDefault={(e) => toggleVolumeSlider(p.identity, e)}
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
                      on:input={(e) => {
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
          on:click={toggleSelfMute}
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
          on:click={toggleOthersMute}
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
          on:click={toggleSelfVideo}
          disabled={!isConnected}
        >
          {#if isSelfVideoEnabled}
            <Video size={20} />
          {:else}
            <VideoOff size={20} />
          {/if}
        </button>

        <button
          class="rounded-full p-3 text-white transition-colors {isConnected
            ? 'bg-destructive hover:bg-destructive/90'
            : 'bg-primary hover:bg-primary/90'}"
          on:click={isConnected ? leaveRoom : joinRoom}
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
        on:click={toggleSelfMute}
        disabled={!isConnected}
      >
        {#if isSelfMuted}
          <MicOff size={16} />
        {:else}
          <Mic size={16} />
        {/if}
      </button>
      <button
        class="rounded-full p-2 text-white transition-colors {isConnected
          ? 'bg-destructive hover:bg-destructive/90'
          : 'bg-primary hover:bg-primary/90'}"
        on:click={isConnected ? leaveRoom : joinRoom}
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
      on:mousedown|stopPropagation={startResize}
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
