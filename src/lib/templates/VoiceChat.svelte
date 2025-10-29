<script context="module">
  export const ssr = false;
</script>

<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { PUBLIC_LIVEKIT_ORIGIN } from '$env/static/public';
  import {
    Room,
    RemoteParticipant,
    RemoteTrack,
    RemoteTrackPublication,
    LocalAudioTrack,
    LocalVideoTrack
  } from 'livekit-client';

  let isConnected = false;
  let error = '';
  const THREAD_ID = 1;
  let room: Room | null = null;

  let isSelfMuted = false;
  let isOthersMuted = false;
  let hasMic = true;
  let hasCamera = true;
  let participants: RemoteParticipant[] = [];
  let volumes: Record<string, number> = {};
  let audioElements = new Map<string, HTMLAudioElement>();
  let localVideoEl: HTMLVideoElement | null = null;

  const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';

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
      `.video-container[data-participant="${CSS.escape(participantId)}"]`
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
    if (!room || !hasMic) return;
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

  function setupParticipantEvents(participant: RemoteParticipant) {
    participant.on('trackPublished', (pub: RemoteTrackPublication) => {
      pub.on('subscribed', (track: RemoteTrack) => {
        if (track.kind === 'audio') {
          attachAudioTrack(track, participant.identity);
        } else if (track.kind === 'video') {
          attachVideoTrack(track, participant.identity);
        }
      });
    });

    participant.trackPublications.forEach((pub) => {
      if (pub.isSubscribed && pub.track) {
        if (pub.track.kind === 'audio') {
          attachAudioTrack(pub.track, participant.identity);
        } else if (pub.track.kind === 'video') {
          attachVideoTrack(pub.track, participant.identity);
        }
      }
    });

    if (!participants.some((p) => p.identity === participant.identity)) {
      participants = [...participants, participant];
    }
  }

  async function joinRoom() {
    if (!isBrowser) return;
    error = '';

    try {
      const token = await getToken();
      room = new Room({ adaptiveStream: true, dynacast: true });

      room.on('participantConnected', (p) => setupParticipantEvents(p));
      room.on('participantDisconnected', (p) => {
        participants = participants.filter((part) => part.identity !== p.identity);
        detachTrack(p.identity);
      });

      // 🔥 Подключаемся к комнате
      await room.connect(PUBLIC_LIVEKIT_ORIGIN, token);

      // ✅ Сразу помечаем как подключённого
      isConnected = true;

      // 🔥 Ждём немного, чтобы ICE успел установиться
      await new Promise((resolve) => setTimeout(resolve, 300));

      // --- Микрофон ---
      let audioTrack: LocalAudioTrack | null = null;
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            autoGainControl: true,
            echoCancellation: true,
            noiseSuppression: true
          }
        });
        if (stream.getAudioTracks().length > 0) {
          audioTrack = new LocalAudioTrack(stream.getAudioTracks()[0]);
          await room.localParticipant.publishTrack(audioTrack);
          hasMic = true;
        }
      } catch (err) {
        console.warn('Микрофон недоступен:', err);
        hasMic = false;
      }

      // --- Камера ---
      let videoTrack: LocalVideoTrack | null = null;
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (stream.getVideoTracks().length > 0) {
          videoTrack = new LocalVideoTrack(stream.getVideoTracks()[0]);
          await room.localParticipant.publishTrack(videoTrack);
          hasCamera = true;
          if (videoTrack && localVideoEl) {
            videoTrack.attach(localVideoEl);
          }
        }
      } catch (err) {
        console.warn('Камера недоступна:', err);
        hasCamera = false;
      }

      // Обновляем участников (на случай, если кто-то уже в комнате)
      room.remoteParticipants.forEach(setupParticipantEvents);
    } catch (err: any) {
      error = err.message || 'Connection failed';
      console.error('Join error:', err);
      leaveRoom();
    }
  }

  function leaveRoom() {
    if (!isBrowser) return;

    if (room) {
      room.localParticipant.trackPublications.forEach((pub) => {
        try {
          pub.track?.stop();
          pub.track?.detach();
        } catch {}
      });
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
    hasMic = true;
    hasCamera = true;
    volumes = {};
  }

  onMount(() => {
    const handleBeforeUnload = () => {
      if (isConnected) leaveRoom();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (isConnected) leaveRoom();
    };
  });

  onDestroy(() => {
    leaveRoom();
  });
</script>

<div class="voice-chat">
  <h3 class="title">Голосовой чат</h3>

  {#if error}
    <p class="error">{error}</p>
  {/if}

  {#if isConnected}
    <div class="local-video-container">
      <video bind:this={localVideoEl} class="local-video" autoplay playsinline muted />
    </div>
  {/if}

  <div class="controls">
    <button class="button self-mute" on:click={toggleSelfMute} disabled={!isConnected || !hasMic}>
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
          <div class="video-container" data-participant={p.identity}></div>
          <div class="participant-info">
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

  .local-video-container {
    margin-bottom: var(--m-2);
    border-radius: var(--border-radius);
    overflow: hidden;
    background: #000;
  }

  .local-video {
    width: 100%;
    height: 100px;
    object-fit: cover;
    display: block;
  }

  .video-container {
    width: 100%;
    height: 80px;
    border-radius: var(--border-radius);
    overflow: hidden;
    background: #000;
    margin-bottom: var(--m-1);
  }

  .video-preview {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .participants {
    margin: var(--m-2) 0;
    max-height: 240px;
    overflow-y: auto;
  }

  .participant {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--m-1);
    margin-bottom: var(--m-2);
    padding: var(--m-1);
    background: #f0f0f0;
    border-radius: var(--border-radius);
  }

  .participant-info {
    display: flex;
    align-items: center;
    gap: var(--m-1);
    width: 100%;
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
