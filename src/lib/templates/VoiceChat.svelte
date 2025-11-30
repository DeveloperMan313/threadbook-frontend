<script lang="ts">
  import { onDestroy, untrack } from 'svelte';
  import { SvelteMap } from 'svelte/reactivity';
  import { PUBLIC_LIVEKIT_ORIGIN } from '$env/static/public';
  import { Room } from 'livekit-client';
  import type {
    RemoteParticipant,
    RemoteTrack,
    RemoteTrackPublication,
    LocalTrack,
    LocalVideoTrack
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
  import { stateVoiceThreadId } from '$lib/states';
  import { ThreadApi } from '$lib/api';
  import { DeepFilterNet3Processor as DeepFilterNoiseFilterProcessor } from 'deepfilternet3-noise-filter';

  let isConnected = $state(false);
  let error = $state('');
  let showError = $state(false);
  let room = $state<Room | null>(null);

  let isSelfMuted = $state(false);
  let isOthersMuted = $state(false);
  let isSelfVideoEnabled = $state(true);

  let hasMic = $state(true);
  let hasCamera = $state(true);

  type ViewMode = 'normal' | 'fullscreen' | 'minimized';
  let viewMode = $state<ViewMode>('normal');

  let isFullscreen = $derived(viewMode === 'fullscreen');
  let isMinimized = $derived(viewMode === 'minimized');

  let participants = $state<RemoteParticipant[]>([]);
  let volumes = $state<Record<string, number>>({});
  let audioElements = new SvelteMap<string, HTMLAudioElement>();
  let localVideoEl = $state<HTMLVideoElement | null>(null);
  let localVideoTrack = $state<LocalVideoTrack | null>(null);

  let dfnProcessor: DeepFilterNoiseFilterProcessor | null = null;

  let x = $state(32);
  let y = $state(80);
  let width = $state(420);
  let height = $state(520);

  let isDragging = false;
  let isResizing = false;
  let dragStartX = 0;
  let dragStartY = 0;
  let startX = 0;
  let startY = 0;
  let startW = 0;
  let startH = 0;

  let showVolumeSliderFor = $state<Record<string, boolean>>({});
  let volumeDisplayFor = $state<
    Record<string, { value: string; timeout?: ReturnType<typeof setTimeout> }>
  >({});

  const isBrowser = typeof document !== 'undefined';

  type VideoTile = {
    id: string;
    isLocal: boolean;
  };

  let videoTiles = $state<VideoTile[]>([]);

  function recomputeVideoTiles() {
    if (!room || !isConnected) {
      videoTiles = [];
      return;
    }
    const tiles: VideoTile[] = [];
    const localId = room.localParticipant.identity;
    if (localId) {
      tiles.push({ id: localId, isLocal: true });
    }
    participants.forEach((p) => {
      tiles.push({ id: p.identity, isLocal: false });
    });
    videoTiles = tiles;
  }

  function setDefaultPosition() {
    if (!isBrowser) return;
    const w = 420;
    const h = 520;
    width = w;
    height = h;
    x = window.innerWidth - w - 24;
    y = 80;
  }

  if (isBrowser) setDefaultPosition();

  $effect(() => {
    if (isFullscreen && isBrowser) {
      x = 0;
      y = 0;
      width = window.innerWidth;
      height = window.innerHeight;
    }
  });

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
    if (room && participantId === room.localParticipant.identity) return;
    const element = track.attach() as HTMLVideoElement;
    element.autoplay = true;
    element.playsInline = true;
    element.muted = false;

    const tryAttach = () => {
      const container = document.querySelector(
        `.video-container[data-participant="${participantId}"]`
      ) as HTMLElement | null;
      if (container) {
        container.innerHTML = '';
        element.classList.add('video-element');
        container.appendChild(element);
      } else {
        if (!room) return;
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
    if (container) (container as HTMLElement).innerHTML = '';
  }

  function updateVolume(id: string, vol: number) {
    volumes = { ...volumes, [id]: vol };
    const el = audioElements.get(id);
    if (el) el.volume = vol;

    if (volumeDisplayFor[id]?.timeout) clearTimeout(volumeDisplayFor[id].timeout);
    volumeDisplayFor[id] = {
      value: `${Math.round(vol * 100)}%`,
      timeout: setTimeout(() => {
        volumeDisplayFor = {
          ...volumeDisplayFor,
          [id]: { value: '', timeout: undefined }
        };
      }, 1500)
    };
  }

  function toggleVolumeSlider(id: string) {
    showVolumeSliderFor = {
      ...showVolumeSliderFor,
      [id]: !showVolumeSliderFor[id]
    };
  }

  async function toggleSelfMute() {
    if (!room || !hasMic) return;
    isSelfMuted = !isSelfMuted;
    await room.localParticipant.setMicrophoneEnabled(!isSelfMuted);
  }

  function toggleOthersMute() {
    isOthersMuted = !isOthersMuted;
    audioElements.forEach((el) => (el.muted = isOthersMuted));
  }

  async function toggleSelfVideo() {
    if (!room || !hasCamera) return;
    const next = !isSelfVideoEnabled;
    isSelfVideoEnabled = next;
    await room.localParticipant.setCameraEnabled(next);

    if (next) {
      const iter = room.localParticipant.videoTrackPublications.values().next();
      const pub = iter.value as RemoteTrackPublication | undefined;
      const track = pub?.track as LocalVideoTrack | undefined;
      if (track) {
        localVideoTrack = track;
        if (localVideoEl) {
          track.attach(localVideoEl);
        }
      }
    }
  }

  function setViewMode(next: ViewMode) {
    if (next === 'normal' && isBrowser) {
      setDefaultPosition();
    }
    viewMode = next;
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
      recomputeVideoTiles();
    }
  }

  function onToolbarPointerDown(e: PointerEvent) {
    if (viewMode !== 'normal') return;
    if (!isBrowser) return;
    isDragging = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    startX = x;
    startY = y;
  }

  function onResizeHandlePointerDown(e: PointerEvent) {
    if (viewMode !== 'normal') return;
    if (!isBrowser) return;
    isResizing = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    startW = width;
    startH = height;
    e.stopPropagation();
  }

  function onWindowPointerMove(e: PointerEvent) {
    if (!isBrowser) return;
    if (isDragging) {
      const dx = e.clientX - dragStartX;
      const dy = e.clientY - dragStartY;
      const maxX = window.innerWidth - width;
      const maxY = window.innerHeight - height;
      x = Math.max(0, Math.min(maxX, startX + dx));
      y = Math.max(0, Math.min(maxY, startY + dy));
    } else if (isResizing) {
      const dx = e.clientX - dragStartX;
      const dy = e.clientY - dragStartY;
      const nextW = Math.max(380, Math.min(900, startW + dx));
      const nextH = Math.max(340, Math.min(900, startH + dy));
      width = nextW;
      height = nextH;
      const maxX = Math.max(0, window.innerWidth - width);
      const maxY = Math.max(0, window.innerHeight - height);
      x = Math.min(x, maxX);
      y = Math.min(y, maxY);
    }
  }

  function onWindowPointerUp() {
    isDragging = false;
    isResizing = false;
  }

  function classifyMediaError(err: unknown): 'none' | 'mic' | 'camera' | 'both' {
    const msg = (err as Error)?.message || '';
    if (!msg) return 'none';
    const lower = msg.toLowerCase();
    const noDevices =
      lower.includes('notfounderror') ||
      lower.includes('requested device not found') ||
      lower.includes('no devices found');
    if (noDevices) return 'both';
    return 'none';
  }

  async function joinRoom(roomThreadId: number) {
    if (!isBrowser) return;

    try {
      const resp = await ThreadApi.getSFUToken({ thread_id: roomThreadId });
      const token = resp.token;

      room = new Room();

      room.on('participantConnected', (p) => handleParticipant(p));
      room.on('participantDisconnected', (p) => {
        participants = participants.filter((part) => part.identity !== p.identity);
        detachTrack(p.identity);
        delete showVolumeSliderFor[p.identity];
        delete volumeDisplayFor[p.identity];
        delete volumes[p.identity];
        recomputeVideoTiles();
      });
      room.on('connected', () => {
        room!.remoteParticipants.forEach((p) => handleParticipant(p));
        recomputeVideoTiles();
      });
      room.on('disconnected', leaveRoom);

      const iceServers: RTCIceServer[] = [{ urls: ['stun:stun.l.google.com:19302'] }];

      if (
        resp.turn_urls &&
        resp.turn_urls.length > 0 &&
        resp.turn_username &&
        resp.turn_credential
      ) {
        iceServers.push({
          urls: resp.turn_urls,
          username: resp.turn_username,
          credential: resp.turn_credential
        });
      }

      await room.connect(PUBLIC_LIVEKIT_ORIGIN, token, {
        rtcConfig: { iceServers }
      });

      hasMic = true;
      hasCamera = true;

      try {
        const tracks = await room.localParticipant.createTracks({
          audio: isSelfMuted
            ? false
            : {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true,
                sampleRate: 48000,
                channelCount: 1
              },
          video: isSelfVideoEnabled ? true : false
        });

        if (tracks.length > 0) {
          await Promise.all(tracks.map((track) => room!.localParticipant.publishTrack(track)));

          const audioTrack = tracks.find((t) => t.kind === 'audio') as LocalTrack | undefined;
          if (audioTrack) {
            try {
              if (!dfnProcessor) {
                dfnProcessor = new DeepFilterNoiseFilterProcessor({
                  sampleRate: 48000,
                  noiseReductionLevel: 80
                });
                await dfnProcessor.initialize();
              }
              if ((audioTrack as any).setProcessor) {
                await (audioTrack as any).setProcessor(dfnProcessor);
              }
            } catch (e) {
              console.warn('DFN3 init/setProcessor failed, falling back to plain audio', e);
              if (dfnProcessor && typeof dfnProcessor.destroy === 'function') {
                try {
                  await dfnProcessor.destroy();
                } catch {
                  // ignore
                }
              }
              dfnProcessor = null;
            }
          }

          const videoTrack = tracks.find((track) => track.kind === 'video') as
            | LocalVideoTrack
            | undefined;
          if (videoTrack) {
            localVideoTrack = videoTrack;
            if (localVideoEl) {
              videoTrack.attach(localVideoEl);
            }
          }
        }
      } catch (mediaErr) {
        console.warn('Media devices error:', mediaErr);
        const kind = classifyMediaError(mediaErr);
        if (kind === 'both') {
          hasMic = false;
          hasCamera = false;
        }
        if (!hasMic) isSelfMuted = true;
        if (!hasCamera) isSelfVideoEnabled = false;

        error = 'Не удалось получить доступ к устройствам';
        showError = true;
        setTimeout(() => {
          showError = false;
        }, 2000);
      }

      isConnected = true;
      recomputeVideoTiles();
    } catch (err) {
      error = (err as Error).message || 'Connection failed';
      console.error('Join error:', err);
      await leaveRoom();
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
    localVideoTrack = null;

    if (dfnProcessor && typeof dfnProcessor.destroy === 'function') {
      try {
        await dfnProcessor.destroy();
      } catch (e) {
        console.warn('DFN3 destroy failed', e);
      }
    }
    dfnProcessor = null;

    isConnected = false;
    isSelfMuted = false;
    isOthersMuted = false;
    isSelfVideoEnabled = true;
    hasMic = true;
    hasCamera = true;
    volumes = {};
    showVolumeSliderFor = {};
    volumeDisplayFor = {};
    videoTiles = [];

    stateVoiceThreadId.id = null;
    viewMode = 'normal';
    setDefaultPosition();
  }

  $effect(() => {
    const vtId = stateVoiceThreadId.id;
    untrack(async () => {
      if (isConnected) {
        const voiceThreadIdCopy = vtId;
        await leaveRoom();
        stateVoiceThreadId.id = voiceThreadIdCopy;
      }
    }).then(() => {
      if (vtId) {
        joinRoom(vtId);
      }
    });
  });

  $effect(() => {
    if (localVideoEl && localVideoTrack) {
      localVideoTrack.attach(localVideoEl);
    }
  });

  $effect(() => {
    participants;
    if (isConnected && room) {
      recomputeVideoTiles();
    }
  });

  onDestroy(() => {
    leaveRoom();
  });
</script>

<svelte:window
  onpointermove={onWindowPointerMove}
  onpointerup={onWindowPointerUp}
  onpointercancel={onWindowPointerUp}
/>

<div
  class="voicechat-root fixed overflow-hidden rounded-xl border border-border bg-background text-sm shadow-xl transition-[width,height] duration-150"
  style="
    width: {isFullscreen ? '100vw' : `${width}px`};
    height: {isMinimized ? 'auto' : isFullscreen ? '100vh' : `${height}px`};
  "
  class:invisible={stateVoiceThreadId.id === null}
>
  <div
    class="voicechat-position-wrapper"
    style="transform: translate({isFullscreen ? 0 : x}px, {isFullscreen ? 0 : y}px);"
  >
    <div class="voicechat-card">
      <div
        role="toolbar"
        class="flex cursor-move items-center justify-between border-b border-border px-3 py-2 select-none"
        onpointerdown={onToolbarPointerDown}
      >
        <h3 class="text-lg font-semibold">Voice Chat</h3>
        <div class="flex items-center gap-1">
          {#if viewMode === 'normal'}
            <button
              class="rounded p-1 hover:bg-accent"
              onclick={(e) => {
                e.stopPropagation();
                setViewMode('fullscreen');
              }}
              title="Fullscreen"
            >
              <Maximize2 size={18} />
            </button>
            <button
              class="rounded p-1 hover:bg-accent"
              onclick={(e) => {
                e.stopPropagation();
                setViewMode('minimized');
              }}
              title="Minimize"
            >
              <Minimize2 size={18} />
            </button>
          {:else if viewMode === 'fullscreen'}
            <button
              class="rounded p-1 hover:bg-accent"
              onclick={(e) => {
                e.stopPropagation();
                setViewMode('normal');
              }}
              title="Exit fullscreen"
            >
              <Minimize2 size={18} />
            </button>
          {:else}
            <button
              class="rounded p-1 hover:bg-accent"
              onclick={(e) => {
                e.stopPropagation();
                setViewMode('normal');
              }}
              title="Expand"
            >
              <Maximize2 size={18} />
            </button>
          {/if}
        </div>
      </div>

      {#if !isMinimized}
        <div class="flex h-[calc(100%-60px)] flex-col">
          {#if isConnected}
            <div class="flex-1 overflow-y-auto px-2 py-2">
              <div class="videos-grid {isFullscreen ? 'videos-grid-fullscreen' : ''}">
                {#each videoTiles as tile (tile.id)}
                  <div class="video-tile">
                    <div class="video-inner">
                      <div class="video-container" data-participant={tile.id}>
                        {#if tile.isLocal}
                          {#if hasCamera && isSelfVideoEnabled}
                            <video
                              bind:this={localVideoEl}
                              autoplay
                              playsinline
                              muted
                              class="video-element"
                            ></video>
                          {:else}
                            <div class="video-placeholder">
                              <VideoOff size={32} />
                            </div>
                          {/if}
                        {/if}
                      </div>

                      <span class="video-label">
                        {tile.isLocal ? 'You' : tile.id}
                      </span>

                      {#if !tile.isLocal}
                        <div
                          class="video-overlay"
                          role="button"
                          tabindex="0"
                          aria-label="Настройка громкости участника {tile.id}"
                          oncontextmenu={(e) => {
                            e.preventDefault();
                            toggleVolumeSlider(tile.id);
                          }}
                          onkeydown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              toggleVolumeSlider(tile.id);
                            }
                          }}
                        ></div>

                        {#if showVolumeSliderFor[tile.id]}
                          <div class="volume-popover">
                            <input
                              type="range"
                              min="0"
                              max="1"
                              step="0.01"
                              class="volume-range"
                              value={volumes[tile.id] ?? 1}
                              oninput={(e) => {
                                const val = parseFloat((e.target as HTMLInputElement).value);
                                updateVolume(tile.id, val);
                              }}
                            />
                            {#if volumeDisplayFor[tile.id]?.value}
                              <span class="volume-value">
                                {volumeDisplayFor[tile.id].value}
                              </span>
                            {/if}
                          </div>
                        {/if}
                      {/if}
                    </div>
                  </div>
                {/each}
              </div>
            </div>
          {/if}

          <div class="mt-auto flex flex-wrap justify-center gap-3 border-t border-border px-3 py-2">
            <button
              class="rounded-full p-3 transition-colors {isSelfMuted || !hasMic
                ? 'bg-destructive text-white hover:bg-destructive/90'
                : 'bg-secondary hover:bg-secondary/80'} disabled:opacity-50"
              onclick={toggleSelfMute}
              disabled={!isConnected || !hasMic}
            >
              {#if isSelfMuted || !hasMic}
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
              class="rounded-full p-3 transition-colors {!isSelfVideoEnabled || !hasCamera
                ? 'bg-destructive text-white hover:bg-destructive/90'
                : 'bg-secondary hover:bg-secondary/80'} disabled:opacity-50"
              onclick={toggleSelfVideo}
              disabled={!isConnected || !hasCamera}
            >
              {#if !isSelfVideoEnabled || !hasCamera}
                <VideoOff size={20} />
              {:else}
                <Video size={20} />
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
        <div class="flex flex-col gap-1 py-2">
          {#if isConnected}
            <div class="videos-grid-min">
              {#each videoTiles as tile (tile.id)}
                <div class="video-tile-min">
                  <div class="video-inner-min">
                    <div class="video-container" data-participant={tile.id}></div>
                    <span class="video-label-min">
                      {tile.isLocal ? 'You' : tile.id}
                    </span>
                  </div>
                </div>
              {/each}
            </div>
          {/if}

          <div class="flex justify-center gap-2 pb-1">
            <button
              class="rounded-full p-2 transition-colors {isSelfMuted || !hasMic
                ? 'bg-destructive text-white hover:bg-destructive/90'
                : 'bg-secondary hover:bg-secondary/80'} disabled:opacity-50"
              onclick={toggleSelfMute}
              disabled={!isConnected || !hasMic}
            >
              {#if isSelfMuted || !hasMic}
                <MicOff size={16} />
              {:else}
                <Mic size={16} />
              {/if}
            </button>
            <button
              class="rounded-full bg-destructive p-2 text-white transition-colors hover:bg-destructive/90"
              onclick={leaveRoom}
            >
              {#if isConnected}
                <LogOut size={16} />
              {:else}
                <LogIn size={16} />
              {/if}
            </button>
          </div>
        </div>
      {/if}

      {#if viewMode === 'normal'}
        <div
          class="resize-handle absolute right-0 bottom-0 h-4 w-4 cursor-se-resize"
          onpointerdown={onResizeHandlePointerDown}
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
  </div>
</div>

<style>
  .voicechat-root {
    inset: 0;
    pointer-events: none;
  }
  .voicechat-position-wrapper {
    position: absolute;
    top: 0;
    left: 0;
    pointer-events: none;
    will-change: transform;
  }
  .voicechat-card {
    width: 100%;
    height: 100%;
    pointer-events: auto;
  }

  .videos-grid {
    display: grid;
    width: 100%;
    height: 100%;
    gap: 8px;
    place-items: center;
    justify-content: center;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  }

  .videos-grid-fullscreen {
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  }

  .video-tile {
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .video-inner {
    position: relative;
    width: 100%;
    max-width: 420px;
    aspect-ratio: 16 / 9;
    border-radius: 8px;
    overflow: hidden;
    background: #000;
    display: flex;
  }

  .video-placeholder {
    width: 100%;
    height: 100%;
    background: #222;
    color: #888;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .video-container {
    position: relative;
    flex: 1;
    height: 100%;
    background: #000;
  }

  .video-element {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .video-label {
    position: absolute;
    left: 6px;
    bottom: 6px;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 11px;
    background: rgba(0, 0, 0, 0.6);
    color: #fff;
    pointer-events: none;
  }

  .video-overlay {
    position: absolute;
    inset: 0;
  }

  .volume-popover {
    position: absolute;
    right: 6px;
    bottom: 6px;
    padding: 4px;
    border-radius: 6px;
    background: rgba(0, 0, 0, 0.75);
    color: #fff;
    width: 96px;
  }

  .volume-range {
    width: 100%;
    cursor: pointer;
    accent-color: currentColor;
  }

  .volume-value {
    display: block;
    margin-top: 2px;
    text-align: center;
    font-size: 10px;
  }

  .videos-grid-min {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 4px;
    padding: 4px 6px;
  }

  .video-tile-min {
    width: 72px;
    height: 40px;
    border-radius: 6px;
    overflow: hidden;
    background: #000;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .video-inner-min {
    position: relative;
    width: 100%;
    height: 100%;
  }

  .video-label-min {
    position: absolute;
    left: 3px;
    bottom: 3px;
    padding: 1px 4px;
    border-radius: 4px;
    font-size: 9px;
    background: rgba(0, 0, 0, 0.6);
    color: #fff;
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

  @media (max-width: 600px) {
    .videos-grid {
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    }
  }
</style>
