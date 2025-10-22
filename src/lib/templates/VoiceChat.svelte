<script lang="ts">
  import { onDestroy } from 'svelte';
  import { SvelteMap } from 'svelte/reactivity';
  import { PUBLIC_LIVEKIT_ORIGIN } from '$env/static/public';
  import { LocalAudioTrack, Room } from 'livekit-client';
  import { DeepFilterNoiseFilterProcessor } from 'deepfilternet3-noise-filter';
  import type {
    RemoteParticipant,
    RemoteTrack,
    RemoteTrackPublication,
    LocalTrack
  } from 'livekit-client';

  let isConnected = false;
  let error = '';
  const THREAD_ID = 1;
  let room: Room | null = null;

  let isSelfMuted = false;
  let isOthersMuted = false;
  let participants: RemoteParticipant[] = [];
  let volumes: Record<string, number> = {};
  let audioElements = new SvelteMap<string, HTMLAudioElement>();
  let localVideoEl: HTMLVideoElement | null = null;

  const isBrowser = typeof document !== 'undefined';
  let pendingLocalVideoTrack: LocalTrack | null = null;

  async function getToken() {
    const res = await fetch('/api/thread/sfu/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ thread_id: THREAD_ID })
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
    element.className = 'video-preview';

    const container = document.querySelector(
      `.video-container[data-participant="${participantId}"]`
    );
    if (container) {
      container.innerHTML = '';
      container.appendChild(element);
    }
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

  function handleParticipant(participant: RemoteParticipant) {
    // Обработка будущих публикаций
    participant.on('trackPublished', (pub: RemoteTrackPublication) => {
      pub.on('subscribed', (track: RemoteTrack) => {
        if (track.kind === 'audio') {
          attachAudioTrack(track, participant.identity);
        } else if (track.kind === 'video') {
          attachVideoTrack(track, participant.identity);
        }
      });

      pub.on('unsubscribed', () => {
        detachTrack(participant.identity);
      });
    });

    // Обработка УЖЕ существующих публикаций
    participant.trackPublications.forEach((pub) => {
      if (pub.isSubscribed && pub.track) {
        if (pub.track.kind === 'audio') {
          attachAudioTrack(pub.track, participant.identity);
        } else if (pub.track.kind === 'video') {
          attachVideoTrack(pub.track, participant.identity);
        }
      } else if (!pub.isSubscribed) {
        // Подписываемся явно, если ещё не подписаны
        pub.setSubscribed(true);
      }
    });

    if (!participants.some((p) => p.identity === participant.identity)) {
      participants = [...participants, participant];
    }
  }

  async function joinRoom() {
    if (!isBrowser) return;
    try {
      const token = await getToken();
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

      const videoTracks = await room.localParticipant.createTracks({ video: true, audio: false });
      let audioTrack = null;

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const micTrack = stream.getAudioTracks()[0];

        if (!micTrack) throw new Error('No audio track from microphone');

        audioTrack = new LocalAudioTrack(micTrack);

        // DeepFilterNet3
        const processor = new DeepFilterNoiseFilterProcessor({
          sampleRate: 48000,
          noiseReductionLevel: 80,
          enabled: true
        });

        await processor.init({ track: micTrack });
        await audioTrack.setProcessor(processor);
      } catch (err) {
        console.warn('DeepFilterNet3 failed, falling back to standard audio:', err);

        // Fallback
        const fallbackTracks = await room.localParticipant.createTracks({
          audio: {
            autoGainControl: true,
            echoCancellation: true,
            noiseSuppression: true
          },
          video: false
        });
        audioTrack = fallbackTracks[0];
      }

      const tracks = [...videoTracks, audioTrack].filter(Boolean);

      for (const track of tracks) {
        await room.localParticipant.publishTrack(track);
        if (track.kind === 'video') {
          pendingLocalVideoTrack = track;
          if (localVideoEl) {
            track.attach(localVideoEl);
          }
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

<div
  class="fixed top-4 right-4 z-50 w-64 rounded-lg border-2 border-border bg-background p-3 text-sm shadow-lg"
>
  <h3 class="mb-2 text-xl font-medium">Голосовой чат</h3>

  {#if error}
    <p class="mb-2 text-sm text-destructive">{error}</p>
  {/if}

  {#if isConnected}
    <div class="mb-2 overflow-hidden rounded bg-black">
      <video
        bind:this={localVideoEl}
        class="block h-24 w-full object-cover"
        autoplay
        playsinline
        muted
      ></video>
    </div>
  {/if}

  <div class="mb-2">
    <button
      class="mb-1 w-full cursor-pointer rounded bg-gray-800 px-2 py-1 text-xs text-white transition-opacity duration-200 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      on:click={toggleSelfMute}
      disabled={!isConnected}
    >
      {isSelfMuted ? 'Размутить себя' : 'Заглушить себя'}
    </button>
    <button
      class="mb-1 w-full cursor-pointer rounded bg-gray-600 px-2 py-1 text-xs text-white transition-opacity duration-200 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      on:click={toggleOthersMute}
      disabled={!isConnected}
    >
      {isOthersMuted ? 'Включить других' : 'Заглушить всех'}
    </button>
  </div>

  <div class="my-2 max-h-60 overflow-y-auto">
    {#each participants as p (p.sid)}
      {#if room && p.identity !== room.localParticipant.identity}
        <div class="mb-2 flex flex-col items-center gap-1 rounded bg-gray-100 p-1">
          <div
            class="video-container w-full overflow-hidden rounded bg-black"
            data-participant={p.identity}
          ></div>
          <div class="flex w-full items-center gap-1">
            <span class="flex-1 overflow-hidden text-xs text-ellipsis whitespace-nowrap"
              >{p.identity}</span
            >
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              class="h-5 w-20"
              bind:value={volumes[p.identity]}
              on:input={(e) =>
                updateVolume(p.identity, parseFloat((e.target as HTMLInputElement).value))}
            />
          </div>
        </div>
      {/if}
    {/each}
  </div>

  <button
    class="w-full cursor-pointer rounded bg-black px-2 py-1 text-xs text-white transition-opacity duration-200 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
    on:click={isConnected ? leaveRoom : joinRoom}
    disabled={error !== ''}
  >
    {isConnected ? 'Выйти' : 'Войти'}
  </button>
</div>
