<script lang="ts">
  import { onDestroy, untrack } from 'svelte';
  import { SvelteMap } from 'svelte/reactivity';
  import { PUBLIC_LIVEKIT_ORIGIN } from '$env/static/public';
  import { Room, RoomEvent, Track, type RemoteAudioTrack } from 'livekit-client';
  import type { RemoteParticipant, RemoteTrack, RemoteTrackPublication } from 'livekit-client';
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
  import * as m from '$lib/paraglide/messages';

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
  let audioTracks = new SvelteMap<string, RemoteAudioTrack>();
  let localVideoEl = $state<HTMLVideoElement | null>(null);
  let localVideoTrack = $state<any | null>(null);

  let dfnProcessor: DeepFilterNoiseFilterProcessor | null = null;

  let isDragging = false;
  let isResizing = false;
  let dragStartX = 0;
  let dragStartY = 0;
  let initialX = 0;
  let initialY = 0;
  let initialWidth = 360;
  let initialHeight = 420;

  let position = $state({ x: 32, y: 80 });
  let dimensions = $state({ width: 420, height: 520 });

  let showVolumeSliderFor = $state<Record<string, boolean>>({});
  let volumeDisplayFor = $state<
    Record<string, { value: string; timeout?: ReturnType<typeof setTimeout> }>
  >({});

  const isBrowser = typeof document !== 'undefined';

  type VideoTile = {
    sid: string;
    identity: string;
    isLocal: boolean;
  };

  let videoTiles = $state<VideoTile[]>([]);

  let currentThreadId: number | null = null;
  let isSwitchingRoom = false;

  function recomputeVideoTiles() {
    if (!room || !isConnected) {
      videoTiles = [];
      return;
    }
    const tiles: VideoTile[] = [];

    const local = room.localParticipant;
    if (local.sid) {
      tiles.push({ sid: local.sid, identity: local.identity, isLocal: true });
    }

    participants.forEach((p) => {
      if (p.sid) {
        tiles.push({ sid: p.sid, identity: p.identity, isLocal: false });
      }
    });

    videoTiles = tiles;
  }

  function setDefaultPosition() {
    if (!isBrowser) return;
    const w = 420;
    const h = 520;
    dimensions = { width: w, height: h };
    position.x = window.innerWidth - w - 24;
    position.y = 80;
  }

  if (isBrowser) setDefaultPosition();

  $effect(() => {
    if (isFullscreen && isBrowser) {
      position = { x: 0, y: 0 };
      dimensions = { width: window.innerWidth, height: window.innerHeight };
    }
  });

  function attachAudioTrack(track: RemoteTrack, participantSid: string) {
    if (!isBrowser || !participantSid) return;

    if (audioElements.has(participantSid)) {
      detachTrack(participantSid, false, true);
    }

    const element = track.attach() as HTMLAudioElement;
    element.autoplay = true;
    element.muted = false;
    element.volume = 1.0;
    element.style.display = 'none';
    element.dataset.participant = participantSid;
    document.body.appendChild(element);
    audioElements.set(participantSid, element);

    if (track.kind === 'audio') {
      audioTracks.set(participantSid, track as RemoteAudioTrack);
      applyVolumeForParticipant(participantSid);
    }
  }

  function attachVideoTrack(track: RemoteTrack, participantSid: string) {
    if (!isBrowser || !participantSid) return;

    const element = track.attach() as HTMLVideoElement;
    element.autoplay = true;
    element.playsInline = true;
    element.muted = false;

    let attempts = 0;

    const tryAttach = () => {
      const container = document.querySelector(
        `.video-container[data-participant="${participantSid}"]`
      ) as HTMLElement | null;

      if (container) {
        container.querySelectorAll('video').forEach((v) => v.remove());
        element.classList.add('video-element');
        container.appendChild(element);
      } else if (attempts < 20) {
        attempts += 1;
        setTimeout(tryAttach, 100);
      }
    };

    tryAttach();
  }

  function detachTrack(
    participantSid: string,
    removeVideo: boolean = true,
    removeAudio: boolean = true
  ) {
    if (!isBrowser || !participantSid) return;

    if (removeAudio) {
      const audioEl = audioElements.get(participantSid);
      if (audioEl) {
        try {
          audioEl.remove();
        } catch {
          // ignore
        }
        audioElements.delete(participantSid);
      }

      audioTracks.delete(participantSid);
    }

    if (removeVideo) {
      const container = document.querySelector(
        `.video-container[data-participant="${participantSid}"]`
      ) as HTMLElement | null;

      if (container) {
        container.querySelectorAll('video').forEach((v) => {
          try {
            v.remove();
          } catch {
            // ignore
          }
        });
      }
    }

    if (volumeDisplayFor[participantSid]?.timeout) {
      clearTimeout(volumeDisplayFor[participantSid].timeout);
      const newVolumeDisplay = { ...volumeDisplayFor };
      delete newVolumeDisplay[participantSid];
      volumeDisplayFor = newVolumeDisplay;
    }
  }

  function applyVolumeForParticipant(sid: string) {
    const audioTrack = audioTracks.get(sid);
    if (!audioTrack) return;

    const volPercent = volumes[sid] ?? 100;

    const normalized = Math.max(0, Math.min(200, volPercent));
    const gain = normalized <= 100 ? normalized / 100 : 1.0;

    const finalVol = isOthersMuted ? 0 : gain;

    try {
      audioTrack.setVolume(finalVol);
    } catch (e) {
      console.warn('Failed to set volume:', e);
    }
  }

  function updateVolume(id: string, volPercent: number) {
    const clamped = Math.max(0, Math.min(200, volPercent));
    volumes = { ...volumes, [id]: clamped };

    applyVolumeForParticipant(id);

    if (volumeDisplayFor[id]?.timeout) {
      clearTimeout(volumeDisplayFor[id].timeout);
    }
    volumeDisplayFor = {
      ...volumeDisplayFor,
      [id]: {
        value: `${Math.round(clamped)}%`,
        timeout: setTimeout(() => {
          const newVolumeDisplay = { ...volumeDisplayFor };
          delete newVolumeDisplay[id];
          volumeDisplayFor = newVolumeDisplay;
        }, 3000)
      }
    };
  }

  function toggleVolumeSlider(id: string) {
    const newValue = !showVolumeSliderFor[id];
    showVolumeSliderFor = {
      ...showVolumeSliderFor,
      [id]: newValue
    };

    if (newValue) {
      setTimeout(() => {
        showVolumeSliderFor = {
          ...showVolumeSliderFor,
          [id]: false
        };
      }, 3000);
    }
  }

  async function toggleSelfMute() {
    if (!room) return;
    if (!hasMic) return;

    const next = !isSelfMuted;
    isSelfMuted = next;
    await room.localParticipant.setMicrophoneEnabled(!next);
  }

  function toggleOthersMute() {
    isOthersMuted = !isOthersMuted;
    audioTracks.forEach((_, sid) => {
      applyVolumeForParticipant(sid);
    });
  }

  async function toggleSelfVideo() {
    if (!room) return;
    if (!hasCamera) return;

    const next = !isSelfVideoEnabled;
    isSelfVideoEnabled = next;
    const pub = await room.localParticipant.setCameraEnabled(next);
    const track = pub?.track ?? null;
    localVideoTrack = track;
    if (localVideoEl && track) {
      track.attach(localVideoEl);
    }
  }

  function setViewMode(next: ViewMode) {
    if (next === 'normal' && isBrowser) {
      setDefaultPosition();
    }
    viewMode = next;
  }

  function startDrag(e: MouseEvent) {
    if (viewMode !== 'normal') return;
    isDragging = true;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    initialX = position.x;
    initialY = position.y;
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
  }

  function startResize(e: MouseEvent) {
    if (viewMode !== 'normal') return;
    isResizing = true;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    initialWidth = dimensions.width;
    initialHeight = dimensions.height;
    e.preventDefault();
    e.stopPropagation();
  }

  function handleResize(e: MouseEvent) {
    if (!isResizing) return;
    const deltaX = e.clientX - dragStartX;
    const deltaY = e.clientY - dragStartY;
    const nextW = Math.max(380, Math.min(900, initialWidth + deltaX));
    const nextH = Math.max(340, Math.min(900, initialHeight + deltaY));
    dimensions.width = nextW;
    dimensions.height = nextH;
    position.x = Math.min(position.x, window.innerWidth - dimensions.width);
    position.y = Math.min(position.y, window.innerHeight - dimensions.height);
  }

  function stopResize() {
    isResizing = false;
  }

  async function subscribeToExistingTracks() {
    if (!room) return;
    room.remoteParticipants.forEach((participant) => {
      participant.trackPublications.forEach((pub) => {
        if (!pub.isSubscribed) {
          pub.setSubscribed(true);
        }
      });
    });
  }

  async function joinRoom(roomThreadId: number) {
    if (!isBrowser) return;

    try {
      const resp = await ThreadApi.getSFUToken({ thread_id: roomThreadId });
      const token = resp.token;

      const newRoom = new Room();
      room = newRoom;

      newRoom.on(RoomEvent.ParticipantConnected, (participant) => {
        if (!participants.some((p) => p.sid === participant.sid)) {
          participants = [...participants, participant as RemoteParticipant];
          recomputeVideoTiles();
        }
      });

      newRoom.on(RoomEvent.ParticipantDisconnected, (participant) => {
        detachTrack(participant.sid, true, true);
        participants = participants.filter((p) => p.sid !== participant.sid);
        recomputeVideoTiles();
      });

      newRoom.on(RoomEvent.TrackSubscribed, (track, pub, participant) => {
        if (track.kind === 'audio') {
          attachAudioTrack(track, participant.sid);
        } else if (track.kind === 'video' && pub.source === Track.Source.Camera) {
          attachVideoTrack(track, participant.sid);
        }
      });

      newRoom.on(RoomEvent.TrackUnsubscribed, (track, pub, participant) => {
        if (track.kind === 'audio') {
          detachTrack(participant.sid, false, true);
        } else if (track.kind === 'video' && pub.source === Track.Source.Camera) {
          detachTrack(participant.sid, true, false);
        }
      });

      newRoom.on(RoomEvent.Disconnected, () => {
        isConnected = false;
      });

      await newRoom.connect(PUBLIC_LIVEKIT_ORIGIN, token);

      hasMic = true;
      hasCamera = true;

      const p = newRoom.localParticipant;

      participants = Array.from(newRoom.remoteParticipants.values()) as RemoteParticipant[];

      await subscribeToExistingTracks();

      recomputeVideoTiles();

      try {
        if (isSelfVideoEnabled) {
          await p.setCameraEnabled(true);
        } else {
          await p.setCameraEnabled(false);
        }
        hasCamera = p.isCameraEnabled ?? false;
      } catch (e) {
        console.warn('Camera enable failed:', e);
        hasCamera = false;
        isSelfVideoEnabled = false;
      }

      try {
        if (!isSelfMuted) {
          await p.setMicrophoneEnabled(true);
        } else {
          await p.setMicrophoneEnabled(false);
        }
        hasMic = p.isMicrophoneEnabled ?? false;
      } catch (e) {
        console.warn('Mic enable failed:', e);
        hasMic = false;
        isSelfMuted = true;
      }

      if (hasMic) {
        try {
          const micPub = p.getTrackPublication(Track.Source.Microphone) as
            | RemoteTrackPublication
            | undefined;
          const audioTrack = micPub?.track;

          if (audioTrack && (audioTrack as any).getProcessor === undefined) {
            if (!dfnProcessor) {
              dfnProcessor = new DeepFilterNoiseFilterProcessor({
                sampleRate: 48000,
                noiseReductionLevel: 80,
                assetConfig: {
                  cdnUrl: 'https://threadbook.ru/deepfilternet3'
                }
              });
              await dfnProcessor.initialize();
            }
            if ((audioTrack as any).setProcessor) {
              await (audioTrack as any).setProcessor(dfnProcessor);
            }
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

      const camPub = p.getTrackPublication(Track.Source.Camera) as
        | RemoteTrackPublication
        | undefined;
      const camTrack = camPub?.track;
      if (camTrack) {
        localVideoTrack = camTrack;
        if (localVideoEl) {
          camTrack.attach(localVideoEl);
        }
      }

      isConnected = true;
      recomputeVideoTiles();
    } catch (err) {
      error = (err as Error).message || 'Connection failed';
      console.error('Join error:', err);
      await leaveRoom(false);
    }
  }

  async function leaveRoom(resetThreadId: boolean = true) {
    if (!isBrowser) return;
    if (room) {
      try {
        await room.disconnect();
      } catch {
        // ignore
      }
      room = null;
    }
    participants = [];

    audioElements.forEach((el) => {
      try {
        el.remove();
      } catch {
        // ignore
      }
    });
    audioElements.clear();
    audioTracks.clear();

    document.querySelectorAll('.video-container').forEach((el) => {
      (el as HTMLElement).querySelectorAll('video').forEach((v) => {
        try {
          v.remove();
        } catch {
          // ignore
        }
      });
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

    if (resetThreadId) {
      stateVoiceThreadId.id = null;
      currentThreadId = null;
    }
    viewMode = 'normal';
    setDefaultPosition();
  }

  $effect(() => {
    const vtId = stateVoiceThreadId.id;
    untrack(async () => {
      if (isSwitchingRoom) return;

      const nextId = vtId ?? null;
      if (nextId === currentThreadId && isConnected) {
        return;
      }

      isSwitchingRoom = true;

      if (isConnected) {
        await leaveRoom(false);
      }

      currentThreadId = nextId;

      if (nextId !== null) {
        await joinRoom(nextId);
      }

      isSwitchingRoom = false;
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
  onmousemove={(e) => {
    if (isDragging) handleDrag(e);
    if (isResizing) handleResize(e);
  }}
  onmouseup={() => {
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
  class:invisible={stateVoiceThreadId.id === null}
>
  <!-- svelte-ignore a11y_interactive_supports_focus -->
  <div
    role="toolbar"
    class="flex cursor-move items-center justify-between border-b border-border px-3 py-2 select-none"
    onmousedown={startDrag}
  >
    <h3 class="text-lg font-semibold">{m.voice_chat()}</h3>
    <div class="flex items-center gap-1">
      {#if viewMode === 'normal'}
        <button
          class="rounded p-1 hover:bg-accent"
          onclick={(e) => {
            e.stopPropagation();
            setViewMode('fullscreen');
          }}
          title={m.fullscreen()}
        >
          <Maximize2 size={18} />
        </button>
        <button
          class="rounded p-1 hover:bg-accent"
          onclick={(e) => {
            e.stopPropagation();
            setViewMode('minimized');
          }}
          title={m.minimize()}
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
          title={m.exit_fullscreen()}
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
          title={m.expand()}
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
          <div class="videos-grid" class:videos-grid-fullscreen={isFullscreen}>
            {#each videoTiles as tile (tile.sid)}
              <div class="video-tile">
                <div class="video-inner">
                  <div class="video-container" data-participant={tile.sid}>
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
                          <VideoOff size={64} />
                        </div>
                      {/if}
                    {:else if participants
                      .find((p) => p.sid === tile.sid)
                      ?.getTrackPublication(Track.Source.Camera)?.isSubscribed}
                      <!-- Attach Here -->
                    {:else}
                      <div class="video-placeholder">
                        <VideoOff size={64} />
                      </div>
                    {/if}
                  </div>

                  <span class="video-label">
                    {tile.isLocal ? m.you() : tile.identity}
                  </span>

                  {#if !tile.isLocal}
                    <!-- svelte-ignore a11y_no_static_element_interactions -->
                    <div
                      class="video-overlay"
                      oncontextmenu={(e) => {
                        e.preventDefault();
                        toggleVolumeSlider(tile.sid);
                      }}
                    ></div>

                    {#if showVolumeSliderFor[tile.sid]}
                      <div class="volume-popover-bottom">
                        <input
                          type="range"
                          min="0"
                          max="200"
                          step="1"
                          class="volume-range"
                          value={volumes[tile.sid] ?? 100}
                          oninput={(e) => {
                            const val = parseFloat((e.target as HTMLInputElement).value);
                            updateVolume(tile.sid, val);
                          }}
                        />
                      </div>
                    {/if}

                    {#if volumeDisplayFor[tile.sid]?.value}
                      <span class="volume-value-display">
                        {volumeDisplayFor[tile.sid].value}
                      </span>
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
          onclick={() => leaveRoom()}
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
          {#each videoTiles as tile (tile.sid)}
            <div class="video-tile-min">
              <div class="video-inner-min">
                <div class="video-container" data-participant={tile.sid}></div>
                <span class="video-label-min">
                  {tile.isLocal ? m.you() : tile.identity}
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
          onclick={() => leaveRoom()}
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
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
      class="absolute right-0 bottom-0 h-4 w-4 cursor-se-resize"
      onmousedown={(e) => {
        e.stopPropagation();
        startResize(e);
      }}
      title={m.drag_to_resize()}
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
        <path d="M21 21h-8a 8 8 0 0 1-8-8v0" />
      </svg>
    </div>
  {/if}
</div>

<style>
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
    width: 100%;
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
    background: #000;
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
    display: flex;
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

  .volume-popover-bottom {
    position: absolute;
    bottom: 6px;
    left: 50%;
    transform: translateX(-50%);
    padding: 4px;
    border-radius: 6px;
    background: rgba(0, 0, 0, 0.75);
    color: #fff;
    width: 96px;
    z-index: 10;
  }

  .volume-range {
    width: 100%;
    cursor: pointer;
    accent-color: currentColor;
  }

  .volume-value-display {
    position: absolute;
    bottom: 6px;
    right: 6px;
    padding: 2px 6px;
    border-radius: 4px;
    background: rgba(0, 0, 0, 0.75);
    color: #fff;
    font-size: 10px;
    pointer-events: none;
    z-index: 5;
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
    background: #222;
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
