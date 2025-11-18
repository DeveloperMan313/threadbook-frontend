<script lang="ts">
  import { onDestroy, untrack } from 'svelte';
  import { SvelteMap } from 'svelte/reactivity';
  import { PUBLIC_LIVEKIT_ORIGIN } from '$env/static/public';
  import { Room, Track, ConnectionQuality } from 'livekit-client';
  import type {
    RemoteParticipant,
    RemoteTrack,
    RemoteTrackPublication,
    LocalTrack,
    Participant
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
    LogOut,
    AlertTriangle,
    Users,
    Signal
  } from '@lucide/svelte';
  import { voiceThreadId } from '$lib/writables';
  import { ThreadApi } from '$lib/api';

  $effect(() => {
    untrack(async () => {
      if (isConnected) {
        const voiceThreadIdCopy = $voiceThreadId;
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
  let connectionQuality = $state<ConnectionQuality>(ConnectionQuality.Good);
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
  let cleanupTimeout: ReturnType<typeof setTimeout> | null = null;
  let hasInitializedMedia = false;

  // Event handlers that need to be stored for proper cleanup
  let participantConnectedHandler: (participant: Participant) => void;
  let participantDisconnectedHandler: (participant: Participant) => void;
  let disconnectedHandler: () => void;
  let reconnectingHandler: () => void;
  let reconnectedHandler: () => void;
  let connectionQualityChangedHandler: (
    quality: ConnectionQuality,
    participant: Participant
  ) => void;

  function setDefaultPosition() {
    if (isBrowser) {
      position.x = Math.max(0, window.innerWidth - dimensions.width - 16);
      position.y = 80;
    }
  }

  if (isBrowser) setDefaultPosition();

  if (isBrowser) {
    const updatePositionOnResize = () => {
      if (isFullscreen) {
        dimensions = { width: window.innerWidth, height: window.innerHeight };
        position = { x: 0, y: 0 };
      } else {
        position.x = Math.min(position.x, window.innerWidth - dimensions.width);
        position.y = Math.min(position.y, window.innerHeight - dimensions.height);
        position.x = Math.max(0, position.x);
        position.y = Math.max(0, position.y);
      }
    };
    window.addEventListener('resize', updatePositionOnResize);
    onDestroy(() => {
      window.removeEventListener('resize', updatePositionOnResize);
      if (cleanupTimeout) clearTimeout(cleanupTimeout);
    });
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
      try {
        audioEl.pause();
        const stream = audioEl.srcObject as MediaStream | null;
        if (stream) {
          stream.getTracks().forEach((track) => track.stop());
        }
        audioEl.srcObject = null;
        audioEl.remove();
      } catch (e) {
        console.warn(`Error cleaning up audio for ${participantId}:`, e);
      }
      audioElements.delete(participantId);
    }

    const container = document.querySelector(
      `.video-container[data-participant="${participantId}"]`
    ) as HTMLElement | null;

    if (container) {
      container.querySelectorAll('video').forEach((video) => {
        const stream = video.srcObject as MediaStream | null;
        if (stream) {
          stream.getTracks().forEach((track) => track.stop());
        }
        video.srcObject = null;
      });
      container.innerHTML = '';
    }
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
    e.stopPropagation();
    showVolumeSliderFor = { ...showVolumeSliderFor, [id]: !showVolumeSliderFor[id] };
  }

  async function toggleSelfMute() {
    if (!room?.localParticipant) return;

    isSelfMuted = !isSelfMuted;
    try {
      await room.localParticipant.setMicrophoneEnabled(!isSelfMuted);
    } catch (err) {
      console.error('Failed to toggle mic:', err);
      isSelfMuted = !isSelfMuted;
      error = 'Failed to toggle microphone. Please check permissions.';
    }
  }

  function toggleOthersMute() {
    isOthersMuted = !isOthersMuted;
    audioElements.forEach((el) => {
      if (el) el.muted = isOthersMuted;
    });
  }

  async function toggleSelfVideo() {
    if (!room?.localParticipant) return;

    isSelfVideoEnabled = !isSelfVideoEnabled;
    try {
      await room.localParticipant.setCameraEnabled(isSelfVideoEnabled);
    } catch (err) {
      console.error('Failed to toggle video:', err);
      isSelfVideoEnabled = !isSelfVideoEnabled;
      error = 'Failed to toggle camera. Please check permissions.';
    }
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
        track.on('muted', () => {
          if (track.kind === 'audio') {
            const el = audioElements.get(participant.identity);
            if (el && !isOthersMuted) {
              el.volume = 0;
            }
          }
        });

        track.on('unmuted', () => {
          if (track.kind === 'audio') {
            const el = audioElements.get(participant.identity);
            if (el && !isOthersMuted) {
              el.volume = volumes[participant.identity] ?? 1;
            }
          }
        });
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
        track.on('muted', () => {
          if (track.kind === 'audio') {
            const el = audioElements.get(participant.identity);
            if (el && !isOthersMuted) {
              el.volume = 0;
            }
          }
        });

        track.on('unmuted', () => {
          if (track.kind === 'audio') {
            const el = audioElements.get(participant.identity);
            if (el && !isOthersMuted) {
              el.volume = volumes[participant.identity] ?? 1;
            }
          }
        });
        pub.off('subscribed', onSubscribed);
      };

      if (pub.isSubscribed && pub.track) {
        onSubscribed(pub.track);
      } else {
        pub.on('subscribed', onSubscribed);
        pub.setSubscribed(true);
      }
    });

    if (!participants.some((p) => p.sid === participant.sid)) {
      participants = [...participants, participant];
    }
  }

  function handleParticipantDisconnected(participant: RemoteParticipant) {
    participants = participants.filter((part) => part.sid !== participant.sid);
    detachTrack(participant.identity);
    delete showVolumeSliderFor[participant.identity];
    delete volumeDisplayFor[participant.identity];
    delete volumes[participant.identity];
  }

  function handleRoomDisconnected() {
    leaveRoom();
  }

  function handleRoomReconnecting() {
    error = 'Reconnecting to voice chat...';
    connectionQuality = ConnectionQuality.Poor;
  }

  function handleRoomReconnected() {
    error = '';
    connectionQuality = ConnectionQuality.Good;
  }

  function handleConnectionQualityChanged(quality: ConnectionQuality, participant: Participant) {
    if (participant.isLocal) {
      connectionQuality = quality;
      if (quality === ConnectionQuality.Poor) {
        console.warn('Poor connection quality detected');
      }
    }
  }

  function startDrag(e: MouseEvent) {
    if (isFullscreen || isMinimized) return;
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
    if (!isBrowser) {
      error = 'Voice chat is only available in browser environments.';
      return;
    }

    try {
      const token = (await ThreadApi.getSFUToken({ thread_id: roomThreadId })).token;
      room = new Room({
        adaptiveStream: true,
        dynacast: true,
        stopLocalTrackOnUnpublish: true
      });

      // Create named handler functions for proper cleanup
      participantConnectedHandler = (participant: Participant) =>
        handleParticipant(participant as RemoteParticipant);
      participantDisconnectedHandler = (participant: Participant) =>
        handleParticipantDisconnected(participant as RemoteParticipant);
      disconnectedHandler = handleRoomDisconnected;
      reconnectingHandler = handleRoomReconnecting;
      reconnectedHandler = handleRoomReconnected;
      connectionQualityChangedHandler = handleConnectionQualityChanged;

      // Set up event listeners with named handlers
      room.on('participantConnected', participantConnectedHandler);
      room.on('participantDisconnected', participantDisconnectedHandler);
      room.on('disconnected', disconnectedHandler);
      room.on('reconnecting', reconnectingHandler);
      room.on('reconnected', reconnectedHandler);
      room.on('connectionQualityChanged', connectionQualityChangedHandler);

      await room.connect(PUBLIC_LIVEKIT_ORIGIN, token);

      // Subscribe to existing participants
      room.remoteParticipants.forEach((p) => handleParticipant(p));

      // Get local tracks - handle permissions properly
      const tracks: LocalTrack[] = [];

      try {
        // Try to get audio track
        const audioTracks = await room.localParticipant.createTracks({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          },
          video: false
        });
        tracks.push(...audioTracks);
        isSelfMuted = audioTracks.length === 0;
      } catch (err) {
        console.warn('Audio track creation failed — proceeding without mic', err);
        isSelfMuted = true;
      }

      // Only try to get video track if it's enabled
      if (isSelfVideoEnabled) {
        try {
          const videoTracks = await room.localParticipant.createTracks({
            audio: false,
            video: true
          });
          tracks.push(...videoTracks);
          isSelfVideoEnabled = videoTracks.length > 0;
        } catch (err) {
          console.warn('Video track creation failed — proceeding without camera', err);
          isSelfVideoEnabled = false;
        }
      }

      // Publish tracks
      for (const track of tracks) {
        try {
          await room.localParticipant.publishTrack(track);
        } catch (err) {
          console.error('Failed to publish track:', err, track);
          track.stop();
        }
      }

      // Attach local video if available
      const videoTrack = tracks.find((t) => t.kind === 'video');
      if (videoTrack && localVideoEl) {
        try {
          videoTrack.attach(localVideoEl);
        } catch (err) {
          console.error('Failed to attach local video:', err);
        }
      }

      isConnected = true;
      error = '';
    } catch (err) {
      error = (err as Error).message || 'Connection failed';
      console.error('Join error:', err);

      // Fallback: try to connect as listener only
      if (!hasInitializedMedia) {
        hasInitializedMedia = true;
        console.log('Retrying connection as listener only');
        try {
          await fallbackListenerOnlyConnection(roomThreadId);
        } catch (fallbackErr) {
          console.error('Listener-only connection also failed:', fallbackErr);
          error = error + ' (Listener mode also failed)';
          await leaveRoom();
        }
      } else {
        await leaveRoom();
      }
    }
  }

  async function fallbackListenerOnlyConnection(roomThreadId: number) {
    const token = (await ThreadApi.getSFUToken({ thread_id: roomThreadId })).token;
    room = new Room({
      adaptiveStream: true,
      dynacast: true
    });

    // Create named handler functions for proper cleanup
    participantConnectedHandler = (participant: Participant) =>
      handleParticipant(participant as RemoteParticipant);
    participantDisconnectedHandler = (participant: Participant) =>
      handleParticipantDisconnected(participant as RemoteParticipant);
    disconnectedHandler = handleRoomDisconnected;
    reconnectingHandler = handleRoomReconnecting;
    reconnectedHandler = handleRoomReconnected;
    connectionQualityChangedHandler = handleConnectionQualityChanged;

    // Set up event listeners with named handlers
    room.on('participantConnected', participantConnectedHandler);
    room.on('participantDisconnected', participantDisconnectedHandler);
    room.on('disconnected', disconnectedHandler);
    room.on('reconnecting', reconnectingHandler);
    room.on('reconnected', reconnectedHandler);
    room.on('connectionQualityChanged', connectionQualityChangedHandler);

    await room.connect(PUBLIC_LIVEKIT_ORIGIN, token);

    // Subscribe to existing participants
    room.remoteParticipants.forEach((p) => handleParticipant(p));

    isConnected = true;
    error = 'Connected as listener only (no microphone/camera access)';
  }

  async function leaveRoom() {
    if (!isBrowser) return;

    try {
      if (room) {
        // Clean up event listeners properly with named handlers
        room.off('participantConnected', participantConnectedHandler);
        room.off('participantDisconnected', participantDisconnectedHandler);
        room.off('disconnected', disconnectedHandler);
        room.off('reconnecting', reconnectingHandler);
        room.off('reconnected', reconnectedHandler);
        room.off('connectionQualityChanged', connectionQualityChangedHandler);

        // Disconnect from room
        await room.disconnect();
        room = null;
      }

      // Clean up audio elements
      audioElements.forEach((el, id) => {
        try {
          el.pause();
          const stream = el.srcObject as MediaStream | null;
          if (stream) {
            stream.getTracks().forEach((track) => track.stop());
          }
          el.srcObject = null;
          el.remove();
        } catch (e) {
          console.warn(`Error cleaning up audio element for ${id}:`, e);
        }
      });
      audioElements.clear();

      // Clean up video containers
      document.querySelectorAll('.video-container').forEach((container) => {
        try {
          const videos = container.querySelectorAll('video');
          videos.forEach((video) => {
            const stream = video.srcObject as MediaStream | null;
            if (stream) {
              stream.getTracks().forEach((track) => track.stop());
            }
            video.srcObject = null;
          });
          (container as HTMLElement).innerHTML = '';
        } catch (e) {
          console.warn('Error cleaning up video container:', e);
        }
      });

      // Clean up local video
      if (localVideoEl) {
        try {
          const stream = localVideoEl.srcObject as MediaStream | null;
          if (stream) {
            stream.getTracks().forEach((track) => track.stop());
          }
          localVideoEl.srcObject = null;
          localVideoEl.load();
        } catch (e) {
          console.warn('Error cleaning up local video element:', e);
        }
      }

      // Reset state
      participants = [];
      volumes = {};
      showVolumeSliderFor = {};
      volumeDisplayFor = {};

      isConnected = false;
      isSelfMuted = false;
      isOthersMuted = false;
      isSelfVideoEnabled = true;
      connectionQuality = ConnectionQuality.Good;

      $voiceThreadId = null;
    } catch (err) {
      console.error('Error during leaveRoom:', err);
      // Force cleanup even on error
      room = null;
      isConnected = false;
      $voiceThreadId = null;
    }
  }

  $effect(() => {
    if (localVideoEl && room) {
      const videoPub = room.localParticipant.getTrackPublication(Track.Source.Camera);
      if (videoPub?.track) {
        try {
          if (localVideoEl.srcObject) {
            const stream = localVideoEl.srcObject as MediaStream;
            stream.getTracks().forEach((track) => track.stop());
          }
          videoPub.track.attach(localVideoEl);
        } catch (err) {
          console.error('Failed to attach local video:', err);
        }
      }
    }
  });

  onDestroy(() => {
    leaveRoom();
  });
</script>

<svelte:window
  on:mousemove={(e: MouseEvent) => {
    if (isDragging) handleDrag(e);
    if (isResizing) handleResize(e);
  }}
  on:mouseup={() => {
    if (isDragging) stopDrag();
    if (isResizing) stopResize();
  }}
/>

<div
  class="fixed z-[100] overflow-hidden rounded-xl border border-border bg-background text-sm shadow-xl transition-all duration-300"
  style="
    left: {position.x}px;
    top: {position.y}px;
    width: {dimensions.width}px;
    height: {isMinimized ? 'auto' : isFullscreen ? '100vh' : `${dimensions.height}px`};
  "
  class:invisible={$voiceThreadId === null}
>
  <div
    role="toolbar"
    class="flex cursor-move items-center justify-between border-b border-border px-3 py-2 select-none"
    onmousedown={startDrag}
  >
    <div class="flex items-center gap-2">
      {#if error}
        <div class="flex items-center gap-1 text-yellow-500">
          <AlertTriangle size={16} />
          <span class="text-xs">{error}</span>
        </div>
      {:else if connectionQuality === ConnectionQuality.Poor}
        <div class="flex items-center gap-1 text-yellow-500">
          <Signal size={16} />
          <span class="text-xs">Poor connection</span>
        </div>
      {/if}
      <h3 class="flex items-center gap-2 text-lg font-semibold">
        <Users size={18} class="text-secondary" />
        Voice Chat ({participants.length + 1})
      </h3>
    </div>
    <div class="flex items-center gap-1">
      <button
        class="rounded p-1 hover:bg-accent"
        onclick={(e: MouseEvent) => {
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
        onclick={(e: MouseEvent) => {
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
          <span
            class="absolute bottom-1 left-1 flex items-center gap-1 rounded bg-black/60 px-1 text-xs text-white"
          >
            <span>You</span>
            {#if connectionQuality === ConnectionQuality.Poor}
              <span class="text-yellow-500">
                <Signal size={12} />
              </span>
            {/if}
          </span>
        </div>
      {/if}

      <div class="mb-3 flex-1 overflow-auto">
        {#if isFullscreen}
          <div class="flex min-h-0 flex-row gap-4 overflow-x-auto p-2 pb-4">
            {#each participants as p (p.sid)}
              {#if room && p.sid !== room.localParticipant.sid}
                <div class="flex w-80 flex-shrink-0 flex-col items-center">
                  <div
                    class="relative aspect-video w-full cursor-pointer overflow-hidden rounded-lg bg-black transition-colors hover:ring-2 hover:ring-accent"
                    oncontextmenu={(e: MouseEvent) => {
                      e.preventDefault();
                      toggleVolumeSlider(p.identity, e);
                    }}
                  >
                    <div
                      class="video-container absolute inset-0"
                      data-participant={p.identity}
                    ></div>
                    <span
                      class="absolute bottom-1 left-1 flex items-center gap-1 rounded bg-black/60 px-1 text-xs text-white"
                    >
                      {p.identity}
                      {#if p.connectionQuality === ConnectionQuality.Poor}
                        <span class="text-yellow-500">
                          <Signal size={12} />
                        </span>
                      {/if}
                    </span>
                  </div>

                  {#if showVolumeSliderFor[p.identity]}
                    <div class="mt-1 w-full rounded bg-black/30 p-1">
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        class="h-1.5 w-full cursor-pointer accent-primary"
                        value={volumes[p.identity] ?? 1}
                        oninput={(e: Event) => {
                          e.stopPropagation();
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
            {#if participants.length === 0}
              <div
                class="flex w-full items-center justify-center py-8 text-center text-muted-foreground"
              >
                No other participants in the voice chat
              </div>
            {/if}
          </div>
        {:else}
          <div class="flex min-h-0 flex-row flex-wrap justify-center gap-2 p-2">
            {#each participants as p (p.sid)}
              {#if room && p.sid !== room.localParticipant.sid}
                <div class="flex w-24 flex-col items-center gap-1">
                  <div
                    class="relative aspect-video w-full cursor-pointer overflow-hidden rounded-lg bg-black transition-colors hover:ring-2 hover:ring-accent"
                    oncontextmenu={(e: MouseEvent) => {
                      e.preventDefault();
                      toggleVolumeSlider(p.identity, e);
                    }}
                  >
                    <div
                      class="video-container absolute inset-0"
                      data-participant={p.identity}
                    ></div>
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
                        oninput={(e: Event) => {
                          e.stopPropagation();
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
            {#if participants.length === 0}
              <div
                class="flex w-full items-center justify-center py-4 text-center text-muted-foreground"
              >
                No other participants in the voice chat
              </div>
            {/if}
          </div>
        {/if}
      </div>

      <div class="mt-auto flex flex-wrap justify-center gap-2 border-t border-border px-2 py-2">
        <button
          class="flex h-12 w-12 flex-col items-center justify-center rounded-full transition-colors {isSelfMuted
            ? 'bg-destructive text-white hover:bg-destructive/90'
            : 'bg-secondary hover:bg-secondary/80'}"
          onclick={toggleSelfMute}
          title={isSelfMuted ? 'Unmute microphone' : 'Mute microphone'}
          disabled={!isConnected}
        >
          {#if isSelfMuted}
            <MicOff size={24} />
          {:else}
            <Mic size={24} />
          {/if}
          <span class="mt-1 text-[10px]">Mic</span>
        </button>

        <button
          class="flex h-12 w-12 flex-col items-center justify-center rounded-full transition-colors {isOthersMuted
            ? 'bg-destructive text-white hover:bg-destructive/90'
            : 'bg-secondary hover:bg-secondary/80'}"
          onclick={toggleOthersMute}
          title={isOthersMuted ? 'Unmute others' : 'Mute others'}
          disabled={!isConnected}
        >
          {#if isOthersMuted}
            <VolumeX size={24} />
          {:else}
            <Volume2 size={24} />
          {/if}
          <span class="mt-1 text-[10px]">Volume</span>
        </button>

        <button
          class="flex h-12 w-12 flex-col items-center justify-center rounded-full transition-colors {!isSelfVideoEnabled
            ? 'bg-destructive text-white hover:bg-destructive/90'
            : 'bg-secondary hover:bg-secondary/80'}"
          onclick={toggleSelfVideo}
          title={isSelfVideoEnabled ? 'Disable camera' : 'Enable camera'}
          disabled={!isConnected}
        >
          {#if isSelfVideoEnabled}
            <Video size={24} />
          {:else}
            <VideoOff size={24} />
          {/if}
          <span class="mt-1 text-[10px]">Camera</span>
        </button>

        <button
          class="flex h-12 w-12 flex-col items-center justify-center rounded-full bg-destructive text-white transition-colors hover:bg-destructive/90"
          onclick={leaveRoom}
          title={isConnected ? 'Leave voice chat' : 'Join voice chat'}
        >
          {#if isConnected}
            <LogOut size={24} />
          {:else}
            <LogIn size={24} />
          {/if}
          <span class="mt-1 text-[10px]">{isConnected ? 'Leave' : 'Join'}</span>
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
      onmousedown={(e: MouseEvent) => {
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

  /* Scrollbar for fullscreen carousel */
  .overflow-x-auto::-webkit-scrollbar {
    height: 6px;
  }
  .overflow-x-auto::-webkit-scrollbar-thumb {
    background: rgba(128, 128, 128, 0.3);
    border-radius: 3px;
  }
  .overflow-x-auto::-webkit-scrollbar-track {
    background: transparent;
  }

  /* Ensure video containers properly handle child elements */
  .video-container {
    width: 100%;
    height: 100%;
  }

  .video-container video {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  /* Smooth transitions for connection quality indicators */
  .connection-quality {
    transition: all 0.3s ease;
  }
</style>
