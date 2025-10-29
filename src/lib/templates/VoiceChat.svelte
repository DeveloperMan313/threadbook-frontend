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
    LocalVideoTrack,
    LocalTrackPublication,
    RoomEvent
  } from 'livekit-client';

  const THREAD_ID = 1;
  const PUBLISH_WAIT_MS = 1500;
  const PUBLISH_TIMEOUT_MS = 15000;
  const VERBOSE_LOG = true;

  let room: Room | null = null;
  let isConnected = false;
  let error = '';
  let isSelfMuted = false;
  let isOthersMuted = false;
  let hasMic = true;
  let hasCamera = true;
  let participants: RemoteParticipant[] = [];
  let volumes: Record<string, number> = {};
  let audioElements = new Map<string, HTMLAudioElement>();
  let localVideoEl: HTMLVideoElement | null = null;

  const isBrowser = typeof window !== 'undefined';

  // ---------- LOG HELPERS ----------
  const log = (...a: unknown[]) => VERBOSE_LOG && console.debug('[VC]', ...a);
  const info = (...a: unknown[]) => console.info('[VC]', ...a);
  const warn = (...a: unknown[]) => console.warn('[VC]', ...a);
  const err = (...a: unknown[]) => console.error('[VC]', ...a);

  // ---------- TOKEN ----------
  async function getToken(): Promise<string> {
    const res = await fetch('/api/thread/sfu/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ thread_id: THREAD_ID })
    });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`Token error ${res.status}: ${txt}`);
    }
    const json = await res.json();
    return json.token;
  }

  // ---------- DOM HELPERS ----------
  function attachAudioTrack(track: RemoteTrack, participantId: string) {
    const el = track.attach() as HTMLAudioElement;
    el.dataset.participant = participantId;
    el.muted = isOthersMuted;
    el.volume = volumes[participantId] ?? 1;
    el.style.display = 'none';
    document.body.appendChild(el);
    audioElements.set(participantId, el);
    log('Audio track attached for', participantId);
  }

  function attachVideoTrack(track: RemoteTrack, participantId: string) {
    const el = track.attach() as HTMLVideoElement;
    el.autoplay = true;
    el.playsInline = true;
    el.muted = true;
    const container = document.querySelector(
      `.video-container[data-participant="${CSS.escape(participantId)}"]`
    );
    if (container) {
      container.innerHTML = '';
      container.appendChild(el);
    }
    log('Video track attached for', participantId);
  }

  function detachTrack(participantId: string) {
    const el = audioElements.get(participantId);
    if (el) el.remove();
    audioElements.delete(participantId);
    const container = document.querySelector(
      `.video-container[data-participant="${CSS.escape(participantId)}"]`
    );
    if (container) container.innerHTML = '';
    log('Tracks detached for', participantId);
  }

  function updateVolume(participantId: string, volume: number) {
    volumes = { ...volumes, [participantId]: volume };
    const el = audioElements.get(participantId);
    if (el) el.volume = volume;
    log('Volume updated for', participantId, volume);
  }

  // ---------- PARTICIPANT EVENTS ----------
  function setupParticipantEvents(participant: RemoteParticipant) {
    log('Setup participant events for', participant.identity);

    participant.on(RoomEvent.TrackSubscribed, (track: RemoteTrack, pub: RemoteTrackPublication) => {
      info('TrackSubscribed', participant.identity, pub.kind);
      if (pub.kind === 'audio') attachAudioTrack(track, participant.identity);
      if (pub.kind === 'video') attachVideoTrack(track, participant.identity);
    });

    participant.on(
      RoomEvent.TrackUnsubscribed,
      (_track: RemoteTrack, pub: RemoteTrackPublication) => {
        info('TrackUnsubscribed', participant.identity, pub.kind);
        detachTrack(participant.identity);
      }
    );

    participant.on(RoomEvent.TrackPublished, (pub: RemoteTrackPublication) => {
      log('TrackPublished', participant.identity, pub.kind);
    });

    if (!participants.some((p) => p.identity === participant.identity)) {
      participants = [...participants, participant];
    }
  }

  // ---------- JOIN ----------
  async function joinRoom() {
    if (!isBrowser) return;
    error = '';
    info('joinRoom starting');

    try {
      const token = await getToken();
      room = new Room({ adaptiveStream: true, dynacast: true });
      log('Room created');

      // Room events
      room.on(RoomEvent.Connected, () => info('Room connected'));
      room.on(RoomEvent.Disconnected, () => warn('Room disconnected'));
      room.on(RoomEvent.Reconnecting, () => warn('Room reconnecting...'));
      room.on(RoomEvent.Reconnected, () => info('Room reconnected'));

      room.on(RoomEvent.ParticipantConnected, (p: RemoteParticipant) => {
        info('Participant connected', p.identity);
        setupParticipantEvents(p);
      });

      room.on(RoomEvent.ParticipantDisconnected, (p: RemoteParticipant) => {
        info('Participant disconnected', p.identity);
        participants = participants.filter((pp) => pp.identity !== p.identity);
        detachTrack(p.identity);
      });

      info('Connecting to', PUBLIC_LIVEKIT_ORIGIN);
      await room.connect(PUBLIC_LIVEKIT_ORIGIN, token);
      info('Connected to LiveKit');

      await new Promise((res) => setTimeout(res, PUBLISH_WAIT_MS));

      // ----- publish audio -----
      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true }
        });
        const track = new LocalAudioTrack(audioStream.getAudioTracks()[0]);
        const pub = (await Promise.race([
          room.localParticipant.publishTrack(track),
          new Promise((_r, rej) =>
            setTimeout(() => rej(new Error('audio publish timeout')), PUBLISH_TIMEOUT_MS)
          )
        ])) as LocalTrackPublication;
        info('Audio published', (pub as any)?.sid);
        hasMic = true;
      } catch (e) {
        err('Audio publish error', e);
        hasMic = false;
      }

      // ----- publish video -----
      try {
        const videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
        const track = new LocalVideoTrack(videoStream.getVideoTracks()[0]);
        const pub = (await Promise.race([
          room.localParticipant.publishTrack(track),
          new Promise((_r, rej) =>
            setTimeout(() => rej(new Error('video publish timeout')), PUBLISH_TIMEOUT_MS)
          )
        ])) as LocalTrackPublication;
        info('Video published', (pub as any)?.sid);
        hasCamera = true;
        if (localVideoEl) track.attach(localVideoEl);
      } catch (e) {
        err('Video publish error', e);
        hasCamera = false;
      }

      // list publications
      room.localParticipant.trackPublications.forEach((pub, id) => {
        log('Local track publication:', id, pub.kind);
      });

      // existing remote participants
      room.remoteParticipants.forEach((p) => setupParticipantEvents(p));

      isConnected = true;
      info('joinRoom completed');
    } catch (e: any) {
      err('joinRoom error', e);
      error = e.message;
      leaveRoom();
    }
  }

  // ---------- LEAVE ----------
  function leaveRoom() {
    info('leaveRoom');
    if (room) {
      room.localParticipant.trackPublications.forEach((pub) => {
        try {
          pub.track?.stop();
          pub.track?.detach();
        } catch (e) {
          warn('Error stopping track', e);
        }
      });
      try {
        room.disconnect();
      } catch (e) {
        warn('Disconnect error', e);
      }
    }
    room = null;
    audioElements.forEach((el) => el.remove());
    audioElements.clear();
    participants = [];
    isConnected = false;
  }

  // ---------- MUTE ----------
  async function toggleSelfMute() {
    if (!room || !hasMic) return;
    const newMuted = !isSelfMuted;
    await room.localParticipant.setMicrophoneEnabled(!newMuted);
    isSelfMuted = newMuted;
    info('toggleSelfMute', isSelfMuted);
  }

  function toggleOthersMute() {
    isOthersMuted = !isOthersMuted;
    audioElements.forEach((el) => (el.muted = isOthersMuted));
    info('toggleOthersMute', isOthersMuted);
  }

  onMount(() => {
    const beforeUnload = () => {
      if (isConnected) leaveRoom();
    };
    window.addEventListener('beforeunload', beforeUnload);
    return () => {
      window.removeEventListener('beforeunload', beforeUnload);
      leaveRoom();
    };
  });

  onDestroy(() => {
    if (isConnected) leaveRoom();
  });
</script>

<div
  role="dialog"
  aria-label="Голосовой чат"
  aria-modal="false"
  tabindex="0"
  class="fixed z-50 rounded-xl border border-gray-700 bg-gray-900 text-white shadow-xl select-none focus:ring-2 focus:ring-cyan-500 focus:outline-none"
  style="left: 500px; top: 500px; width: 288px;"
>
  <h3>Голосовой чат (debug)</h3>

  {#if error}
    <div class="error">Ошибка: {error}</div>
  {/if}

  <div class="status">
    <div>Connected: {isConnected ? '✅' : '—'}</div>
    <div>Mic: {hasMic ? '✅' : '❌'}</div>
    <div>Camera: {hasCamera ? '✅' : '❌'}</div>
    <div>Muted: {isSelfMuted ? '✅' : '—'}</div>
  </div>

  {#if isConnected}
    <video bind:this={localVideoEl} autoplay playsinline muted class="local-video"></video>
  {/if}

  <div class="controls">
    <button on:click={isConnected ? leaveRoom : joinRoom}>
      {isConnected ? 'Выйти' : 'Войти'}
    </button>
    <button on:click={toggleSelfMute} disabled={!isConnected}>
      {isSelfMuted ? 'Размутить' : 'Заглушить'}
    </button>
    <button on:click={toggleOthersMute} disabled={!isConnected}>
      {isOthersMuted ? 'Включить других' : 'Заглушить других'}
    </button>
  </div>

  <div class="participants">
    <h4>Участники ({participants.length})</h4>
    {#each participants as p (p.identity)}
      <div class="participant">
        <div class="video-container" data-participant={p.identity}></div>
        <div class="meta">
          <div class="name">{p.identity}</div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volumes[p.identity] ?? 1}
            on:input={(e) =>
              updateVolume(p.identity, parseFloat((e.target as HTMLInputElement).value))}
          />
        </div>
      </div>
    {/each}
  </div>
</div>

<style>
  .error {
    color: red;
    font-weight: bold;
    margin-bottom: 0.5rem;
  }
  .status div {
    font-size: 0.85rem;
  }
  .local-video {
    width: 100%;
    height: 180px;
    background: #000;
    border-radius: 8px;
    margin: 0.5rem 0;
  }
  .controls {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  .participants {
    margin-top: 1rem;
    max-height: 250px;
    overflow-y: auto;
  }
  .participant {
    display: flex;
    gap: 0.5rem;
    background: #f4f4f4;
    padding: 0.5rem;
    border-radius: 6px;
    margin-bottom: 0.5rem;
  }
  .video-container {
    width: 100px;
    height: 70px;
    background: #000;
    border-radius: 4px;
    overflow: hidden;
  }
</style>
