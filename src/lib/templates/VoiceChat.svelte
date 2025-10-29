<script lang="ts">
  import { onDestroy } from 'svelte';
  import { SvelteMap } from 'svelte/reactivity';
  import { PUBLIC_LIVEKIT_ORIGIN } from '$env/static/public';
  import { Room, LocalAudioTrack } from 'livekit-client';
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
    if (el) el.volume = volume;
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
    // Подписка на будущие публикации
    participant.on('trackPublished', (pub: RemoteTrackPublication) => {
      pub.setSubscribed(true); // сразу подписываемся
      pub.on('subscribed', (track: RemoteTrack) => {
        if (track.kind === 'audio') attachAudioTrack(track, participant.identity);
      });

      pub.on('unsubscribed', () => {
        detachTrack(participant.identity);
      });
    });

    // Подписка на уже существующие публикации
    participant.trackPublications.forEach((pub) => {
      if (!pub.isSubscribed) {
        pub.setSubscribed(true);
      }
      if (pub.isSubscribed && pub.track && pub.track.kind === 'audio') {
        attachAudioTrack(pub.track, participant.identity);
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

      let audioTrack: LocalTrack | null = null;
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const micTrack = stream.getAudioTracks()[0];
        if (!micTrack) throw new Error('No audio track from microphone');
        audioTrack = new LocalAudioTrack(micTrack);
      } catch (err) {
        console.warn('Failed to get microphone:', err);
        const fallbackTracks = await room.localParticipant.createTracks({
          audio: { autoGainControl: true, echoCancellation: true, noiseSuppression: true },
          video: false
        });
        audioTrack = fallbackTracks[0];
      }

      if (audioTrack) await room.localParticipant.publishTrack(audioTrack);

      isConnected = true;
      error = '';
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
    isConnected = false;
    isSelfMuted = false;
    isOthersMuted = false;
    volumes = {};
  }

  onDestroy(() => {
    leaveRoom();
  });
</script>

<div class="voice-chat">
  <h3 class="title">Голосовой чат</h3>

  {#if error}
    <p class="error">{error}</p>
  {/if}

  <div class="controls">
    <button class="button self-mute" on:click={toggleSelfMute} disabled={!isConnected}>
      {isSelfMuted ? 'Размутить себя' : 'Заглушить себя'}
    </button>
    <button class="button others-mute" on:click={toggleOthersMute} disabled={!isConnected}>
      {isOthersMuted ? 'Включить других' : 'Заглушить всех'}
    </button>
  </div>

  <div class="participants">
    {#each participants as p (p.sid)}
      {#if room && p.identity !== room.localParticipant.identity}
        <div class="participant">
          <div class="participant-info">
            <span class="identity">{p.identity}</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              bind:value={volumes[p.identity] ?? 1}
              on:input={(e) =>
                updateVolume(p.identity, parseFloat((e.target as HTMLInputElement).value))}
            />
          </div>
        </div>
      {/if}
    {/each}
  </div>

  <button
    class="button join-leave"
    on:click={isConnected ? leaveRoom : joinRoom}
    disabled={error !== ''}
  >
    {isConnected ? 'Выйти' : 'Войти'}
  </button>
</div>

<style>
  .voice-chat {
    position: fixed;
    top: 1rem;
    right: 1rem;
    background: #fff;
    border: 1px solid #ccc;
    border-radius: 8px;
    padding: 1rem;
    width: 16rem;
    font-size: 0.9rem;
    color: #000;
  }
  .title {
    font-size: 1rem;
    margin-bottom: 0.5rem;
  }
  .error {
    color: #d32f2f;
    margin-bottom: 0.5rem;
  }
  .button {
    width: 100%;
    padding: 0.5rem;
    margin-bottom: 0.5rem;
    border: none;
    border-radius: 4px;
    color: white;
    cursor: pointer;
  }
  .self-mute {
    background: #333;
  }
  .others-mute {
    background: #555;
  }
  .join-leave {
    background: #000;
  }
  .participants {
    max-height: 240px;
    overflow-y: auto;
    margin-bottom: 0.5rem;
  }
  .participant {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding: 0.5rem;
    background: #f0f0f0;
    border-radius: 4px;
  }
  .participant-info {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .identity {
    flex: 1;
    font-size: 0.8rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  input[type='range'] {
    width: 80px;
  }
</style>
