<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { Room, RemoteParticipant, RemoteTrack, RemoteTrackPublication } from 'livekit-client';

  let isConnected = false;
  let error = '';
  const THREAD_ID = 1;
  let room: Room | null = null;

  let isSelfMuted = false;
  let isOthersMuted = false;
  let participants: RemoteParticipant[] = []; // ← массив вместо Map для реактивности
  let volumes: Record<string, number> = {};
  const audioElements = new Map<string, HTMLAudioElement>();

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

  function attachTrack(track: RemoteTrack, participant: RemoteParticipant) {
    const element = track.attach() as HTMLAudioElement;
    element.dataset.participant = participant.identity;
    element.muted = isOthersMuted;
    element.volume = volumes[participant.identity] ?? 1;
    element.style.display = 'none';
    document.body.appendChild(element);
    audioElements.set(participant.identity, element);
  }

  function detachTrack(participantId: string) {
    const el = audioElements.get(participantId);
    if (el) {
      el.remove();
      audioElements.delete(participantId);
    }
  }

  function updateVolume(participantId: string, volume: number) {
    // ← реактивное обновление объекта
    volumes = { ...volumes, [participantId]: volume };
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
    isOthersMuted = !isOthersMuted;
    audioElements.forEach((el) => {
      el.muted = isOthersMuted;
    });
  }

  function handleParticipant(participant: RemoteParticipant) {
    participant.on('trackPublished', (pub: RemoteTrackPublication) => {
      pub.on('subscribed', (track: RemoteTrack) => {
        if (track.kind === 'audio') {
          attachTrack(track, participant);
        }
      });

      pub.on('unsubscribed', () => {
        detachTrack(participant.identity);
      });
    });

    participant.on('trackUnpublished', (pub: RemoteTrackPublication) => {
      if (pub.kind === 'audio') {
        detachTrack(participant.identity);
      }
    });

    // Обработка уже существующих треков
    participant.trackPublications.forEach((pub) => {
      if (pub.track?.kind === 'audio') {
        attachTrack(pub.track, participant);
      }
    });

    // Добавляем только если ещё не в списке (реактивно)
    if (!participants.some((p) => p.identity === participant.identity)) {
      participants = [...participants, participant];
    }
  }

  async function joinRoom() {
    try {
      const token = await getToken();
      room = new Room();

      room.on('participantConnected', (p) => handleParticipant(p));
      room.on('participantDisconnected', (p) => {
        participants = participants.filter((part) => part.identity !== p.identity);
        detachTrack(p.identity);
      });

      room.on('connected', () => {
        // Очистка старых элементов
        audioElements.forEach((el) => el.remove());
        audioElements.clear();
        volumes = {};
        participants = [];

        // Обработка уже подключённых участников
        room!.remoteParticipants.forEach((p) => handleParticipant(p));
      });

      await room.connect('ws://localhost:7880', token);

      // Публикация локального аудио
      const tracks = await room.localParticipant.createTracks({
        // СЮДА ПОТОМ ИИ МОЖНО ИНТЕГРИРОВАТЬ, но работать он будет ток в Electron
        // Нужно предусмотреть тут if Electron -> flase флаги + DeepFilterNet else -> true флаги
        audio: {
          autoGainControl: true,
          echoCancellation: true,
          noiseSuppression: true
        },
        video: false
      });
      for (const track of tracks) {
        await room.localParticipant.publishTrack(track);
      }

      isConnected = true;
      error = '';
    } catch (err: any) {
      error = err.message || 'Connection failed';
      console.error('Join error:', err);
      leaveRoom();
    }
  }

  function leaveRoom() {
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
    {#each participants as p}
      {#if room && p.identity !== room.localParticipant.identity}
        <div class="participant">
          <span class="identity">{p.identity}</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            bind:value={volumes[p.identity]}
            on:input={(e) =>
              updateVolume(p.identity, parseFloat((e.target as HTMLInputElement).value))}
          />
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
    top: var(--m-4);
    right: var(--m-4);
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: var(--border-radius);
    padding: var(--m-3);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    z-index: 1000;
    width: 16rem;
    font-size: 0.9rem;
    color: #000;
  }

  .title {
    font-size: var(--font-medium);
    margin: 0 0 var(--m-2) 0;
    color: #000;
  }

  .error {
    color: #d32f2f;
    font-size: var(--font-small);
    margin-bottom: var(--m-2);
  }

  .button {
    width: 100%;
    padding: var(--m-1);
    margin-bottom: var(--m-1);
    border: none;
    border-radius: var(--border-radius);
    color: white;
    font-size: 0.85rem;
    cursor: pointer;
    transition: opacity 0.2s;
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

  .button:hover:not(:disabled) {
    opacity: 0.9;
  }

  .button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .controls {
    margin-bottom: var(--m-2);
  }

  .participants {
    margin: var(--m-2) 0;
    max-height: 120px;
    overflow-y: auto;
  }

  .participant {
    display: flex;
    align-items: center;
    gap: var(--m-1);
    margin-bottom: var(--m-1);
    padding: var(--m-1);
    background: #f0f0f0;
    border-radius: var(--border-radius);
  }

  .identity {
    font-size: 0.8rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    flex: 1;
    color: #000;
  }

  input[type='range'] {
    width: 80px;
    height: 20px;
  }
</style>
