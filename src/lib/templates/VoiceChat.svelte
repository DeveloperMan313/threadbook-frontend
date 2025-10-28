<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import { PUBLIC_LIVEKIT_ORIGIN } from '$env/static/public';
  import {
    Room,
    LocalAudioTrack,
    LocalVideoTrack,
    Track,
    type RemoteParticipant,
    type RemoteTrack,
    type RemoteTrackPublication,
    type LocalTrack,
    type Participant,
    type TrackPublication
  } from 'livekit-client';

  import { voiceChatStore } from '$lib/stores/voiceChatStore';
  import type { VoiceChatState } from '$lib/stores/voiceChatStore';
  import { NoiseSuppressionProcessor } from '@shiguredo/noise-suppression';

  let isLoading = false;
  let isOthersMuted = false;
  let volumes: Record<string, number> = {};
  let pinnedParticipantId: string | null = null;
  let pinnedParticipant: RemoteParticipant | null = null;
  let isDragging = false;
  let dragOffset = { x: 0, y: 0 };

  let state!: VoiceChatState; // definite assignment — подписчик сразу присвоит значение
  const unsubscribe = voiceChatStore.subscribe((s) => (state = s));

  let localVideoEl: HTMLVideoElement | null = null;
  let chatRef: HTMLDivElement | null = null;
  let audioElements = new Map<string, HTMLAudioElement>();

  const THREAD_ID = 1;
  const isBrowser = typeof document !== 'undefined';

  $: {
    if (state?.participants) {
      for (const p of state.participants) {
        if (volumes[p.identity] === undefined) {
          volumes[p.identity] = 1;
        }
      }
    }
  }

  $: pinnedParticipant =
    state?.participants.find((p) => p.identity === pinnedParticipantId) || null;

  async function getToken() {
    const res = await fetch('/api/thread/sfu/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ thread_id: THREAD_ID })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Не удалось получить токен');
    }
    const { token } = await res.json();
    return token;
  }

  function attachAudioTrack(track: RemoteTrack, participantId: string) {
    if (!isBrowser) return;
    const el = track.attach() as HTMLAudioElement;
    el.dataset.participant = participantId;
    el.muted = isOthersMuted;
    el.volume = volumes[participantId] ?? 1;
    el.style.display = 'none';
    document.body.appendChild(el);
    audioElements.set(participantId, el);
  }

  function attachVideoTrack(track: RemoteTrack, participantId: string) {
    if (!isBrowser) return;
    const el = track.attach() as HTMLVideoElement;
    el.autoplay = true;
    el.playsInline = true;
    el.muted = true;
    el.className = 'w-full h-full object-cover rounded';

    const container = document.querySelector(
      `.video-container[data-participant="${participantId}"]`
    );
    if (container) {
      container.innerHTML = '';
      container.appendChild(el);
    }
  }

  function detachTrack(participantId: string) {
    const el = audioElements.get(participantId);
    if (el) {
      el.remove();
      audioElements.delete(participantId);
    }
    // Видео-дэтатч происходит через track.detach() в других местах (если трек локальный)
    // удаляем DOM-аудио, видео контейнеры очистятся при attach нового трека
  }

  function updateVolume(participantId: string, volume: number) {
    volumes[participantId] = volume;
    const el = audioElements.get(participantId);
    if (el) el.volume = volume;
  }

  async function toggleSelfMute() {
    if (!state.room || !state.hasMic) return;
    const newMuted = !state.isSelfMuted;
    await state.room.localParticipant.setMicrophoneEnabled(!newMuted);
    voiceChatStore.setIsSelfMuted(newMuted);
  }

  async function toggleSelfVideo() {
    if (!state.room || !state.hasCamera) return;
    const newEnabled = !state.isSelfVideoEnabled;
    await state.room.localParticipant.setCameraEnabled(newEnabled);
    voiceChatStore.setIsSelfVideoEnabled(newEnabled);
  }

  async function toggleScreenShare() {
    if (!state.room || !state.isConnected) return;

    if (state.isScreenSharing) {
      const pub = state.room.localParticipant.getTrackPublication(Track.Source.ScreenShare);
      if (pub?.track) {
        await state.room.localParticipant.unpublishTrack(pub.track);
        try {
          pub.track.detach();
        } catch (e) {
          // ignore
        }
        voiceChatStore.setIsScreenSharing(false);
      }
    } else {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = new LocalVideoTrack(stream.getVideoTracks()[0]);
        await state.room.localParticipant.publishTrack(screenTrack);
        voiceChatStore.setIsScreenSharing(true);
      } catch (err) {
        console.warn('Не удалось начать шаринг экрана:', err);
      }
    }
  }

  function toggleOthersMute() {
    isOthersMuted = !isOthersMuted;
    audioElements.forEach((el) => (el.muted = isOthersMuted));
  }

  function pinParticipant(id: string) {
    pinnedParticipantId = pinnedParticipantId === id ? null : id;
  }

  function getInitials(identity: string): string {
    return identity
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  }

  function isParticipantMuted(participant: Participant): boolean {
    const audioPub = participant.getTrackPublication(Track.Source.Microphone);
    return !audioPub?.isSubscribed || !!audioPub?.isMuted;
  }

  function subscribeToTrack(pub: RemoteTrackPublication, participantId: string) {
    if (pub.track) {
      if ((pub.track as RemoteTrack).kind === 'audio')
        attachAudioTrack(pub.track as RemoteTrack, participantId);
      else if ((pub.track as RemoteTrack).kind === 'video')
        attachVideoTrack(pub.track as RemoteTrack, participantId);
    } else {
      (pub as any).on?.('subscribed', (track: RemoteTrack) => {
        if (track.kind === 'audio') attachAudioTrack(track, participantId);
        else if (track.kind === 'video') attachVideoTrack(track, participantId);
      });
    }
  }

  function handleParticipant(participant: RemoteParticipant) {
    try {
      (participant as any).removeAllListeners?.();
    } catch (e) {
      // ignore
    }

    participant.on('trackPublished', (pub: RemoteTrackPublication) => {
      try {
        // Установим флаг подписки (если API поддерживает)
        if ((pub as any).setSubscribed) (pub as any).setSubscribed(true);
      } catch (e) {
        // ignore
      }
      subscribeToTrack(pub, participant.identity);
    });

    participant.on('trackUnpublished', () => {
      detachTrack(participant.identity);
    });

    // Подписываемся на уже опубликованные треки
    participant.trackPublications.forEach((pub) => {
      try {
        if (!pub.isSubscribed && (pub as any).setSubscribed) (pub as any).setSubscribed(true);
      } catch (e) {
        // ignore
      }
      subscribeToTrack(pub as RemoteTrackPublication, participant.identity);
    });

    // Подписка на уровень громкости (если трек поддерживает)
    const audioPub = participant.getTrackPublication(Track.Source.Microphone);
    if (audioPub?.track) {
      const trackWithAudioLevel: any = audioPub.track;
      if (trackWithAudioLevel && typeof trackWithAudioLevel.on === 'function') {
        trackWithAudioLevel.on('audioLevel', (level: number) => {
          // простая детекция говорящего
          if (level > 0.1) {
            voiceChatStore.setActiveSpeaker(participant.identity);
            setTimeout(() => {
              // очистим только если тот же участник всё ещё активный
              if (state.activeSpeakerId === participant.identity) {
                voiceChatStore.setActiveSpeaker(null);
              }
            }, 1000);
          }
        });
      }
    }
  }

  async function joinRoom() {
    if (!isBrowser || isLoading) return;
    isLoading = true;
    voiceChatStore.setError('');

    try {
      const token = await getToken();
      const newRoom = new Room({
        adaptiveStream: true,
        dynacast: true
      });

      newRoom.on('participantConnected', (p: RemoteParticipant) => handleParticipant(p));
      newRoom.on('participantDisconnected', (p: RemoteParticipant) => {
        voiceChatStore.setParticipants(
          state.participants.filter((part) => part.identity !== p.identity)
        );
        detachTrack(p.identity);
      });

      newRoom.once('disconnected', leaveRoom);

      await newRoom.connect(PUBLIC_LIVEKIT_ORIGIN, token);

      // Аудио
      let audioTrack: LocalTrack | null = null;
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const micTrack = stream.getAudioTracks()[0];
        if (micTrack) {
          const processor = new NoiseSuppressionProcessor();
          const processedTrack = await processor.startProcessing(micTrack);
          audioTrack = new LocalAudioTrack(processedTrack);
        }
      } catch (micErr) {
        console.warn('Микрофон недоступен:', micErr);
        voiceChatStore.setHasMic(false);
      }

      // Видео
      let videoTrack: LocalTrack | null = null;
      if (state.isSelfVideoEnabled) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          const videoTrackRaw = stream.getVideoTracks()[0];
          if (videoTrackRaw) {
            videoTrack = new LocalVideoTrack(videoTrackRaw);
          }
        } catch (vidErr) {
          console.warn('Камера недоступна:', vidErr);
          voiceChatStore.setHasCamera(false);
          voiceChatStore.setIsSelfVideoEnabled(false);
        }
      }

      const tracksToPublish: LocalTrack[] = [];
      if (audioTrack) tracksToPublish.push(audioTrack);
      if (videoTrack) tracksToPublish.push(videoTrack);

      for (const track of tracksToPublish) {
        const pub = await newRoom.localParticipant.publishTrack(track);
        if (track instanceof LocalVideoTrack && localVideoEl) {
          track.attach(localVideoEl);
        }
      }

      voiceChatStore.updateRoom(newRoom);
    } catch (err: any) {
      voiceChatStore.setError(err?.message || 'Не удалось подключиться');
      console.error('Ошибка подключения:', err);
      leaveRoom();
    } finally {
      isLoading = false;
    }
  }

  function leaveRoom() {
    if (state.room) {
      state.room.localParticipant.trackPublications.forEach((pub: TrackPublication) => {
        if (pub.track) {
          try {
            (pub.track as any).stop?.();
            (pub.track as any).detach?.();
          } catch (e) {
            // ignore
          }
        }
      });
      try {
        state.room.disconnect();
      } catch (e) {
        // ignore
      }
    }

    audioElements.forEach((el) => el.remove());
    audioElements.clear();

    voiceChatStore.leave();
    isOthersMuted = false;
    volumes = {};
    pinnedParticipantId = null;
  }

  // Drag
  function startDrag(e: MouseEvent | TouchEvent) {
    if (!chatRef) return;
    isDragging = true;
    const rect = chatRef.getBoundingClientRect();
    if (e instanceof MouseEvent) {
      dragOffset.x = e.clientX - rect.left;
      dragOffset.y = e.clientY - rect.top;
    } else if (e instanceof TouchEvent && e.touches.length > 0) {
      dragOffset.x = e.touches[0].clientX - rect.left;
      dragOffset.y = e.touches[0].clientY - rect.top;
      e.preventDefault();
    }
  }

  function onDrag(e: MouseEvent | TouchEvent) {
    if (!isDragging || !chatRef) return;
    let clientX: number, clientY: number;
    if (e instanceof MouseEvent) {
      clientX = e.clientX;
      clientY = e.clientY;
    } else if (e instanceof TouchEvent && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      return;
    }
    const x = clientX - dragOffset.x;
    const y = clientY - dragOffset.y;
    const maxX = window.innerWidth - chatRef.offsetWidth;
    const maxY = window.innerHeight - chatRef.offsetHeight;
    voiceChatStore.setPosition(Math.max(0, Math.min(x, maxX)), Math.max(0, Math.min(y, maxY)));
  }

  function stopDrag() {
    isDragging = false;
  }

  // Keyboard navigation for dragging
  function handleKeydown(e: KeyboardEvent) {
    if (!chatRef || document.activeElement !== chatRef) return;

    const step = 10;
    let newX = state.position.x;
    let newY = state.position.y;

    switch (e.key) {
      case 'ArrowLeft':
        newX -= step;
        break;
      case 'ArrowRight':
        newX += step;
        break;
      case 'ArrowUp':
        newY -= step;
        break;
      case 'ArrowDown':
        newY += step;
        break;
      case 'Escape':
        chatRef.blur();
        return;
      default:
        return;
    }

    e.preventDefault();

    const maxX = window.innerWidth - chatRef.offsetWidth;
    const maxY = window.innerHeight - chatRef.offsetHeight;
    voiceChatStore.setPosition(
      Math.max(0, Math.min(newX, maxX)),
      Math.max(0, Math.min(newY, maxY))
    );
  }

  onMount(() => {
    window.addEventListener('mousemove', onDrag);
    window.addEventListener('mouseup', stopDrag);
    window.addEventListener('touchmove', onDrag, { passive: false });
    window.addEventListener('touchend', stopDrag);
    window.addEventListener('keydown', handleKeydown);

    if (state.isConnected && state.room) {
      state.room.remoteParticipants.forEach((p) => handleParticipant(p));
    }

    return () => {
      window.removeEventListener('mousemove', onDrag);
      window.removeEventListener('mouseup', stopDrag);
      window.removeEventListener('touchmove', onDrag);
      window.removeEventListener('touchend', stopDrag);
      window.removeEventListener('keydown', handleKeydown);
      unsubscribe();
    };
  });

  onDestroy(() => {
    // Преднамеренно не выходим из звонка на destroy — оставил как у вас
  });
</script>

{#if !state.isMinimized}
  <!-- Исправлено: добавлены правильные ARIA атрибуты и клавиатурная навигация -->
  <div
    bind:this={chatRef}
    role="dialog"
    aria-label="Голосовой чат"
    aria-modal="false"
    tabindex="0"
    class="fixed z-50 rounded-xl border border-gray-700 bg-gray-900 text-white shadow-xl select-none focus:ring-2 focus:ring-cyan-500 focus:outline-none"
    style="left: {state.position.x}px; top: {state.position.y}px; width: 288px;"
  >
    <!-- Заголовок с возможностью перетаскивания -->
    <div
      role="button"
      tabindex="0"
      aria-label="Перетащить голосовой чат. Используйте стрелки для перемещения или мышь для перетаскивания."
      class="cursor-move rounded-t-xl p-4 pb-3 focus:ring-1 focus:ring-cyan-400 focus:outline-none"
      on:mousedown={startDrag}
      on:touchstart={startDrag}
      on:keydown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          isDragging = true;
          chatRef?.focus();
        }
      }}
    >
      <div class="flex items-center justify-between">
        <h3 class="font-semibold text-cyan-400">Голосовой чат</h3>
        <button
          class="rounded text-gray-400 hover:text-white focus:ring-2 focus:ring-cyan-400 focus:outline-none"
          aria-label="Свернуть чат"
          on:click={voiceChatStore.toggleMinimized}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M5 12h14" />
          </svg>
        </button>
      </div>
    </div>

    <div class="px-4 pb-4">
      {#if state.error}
        <div
          class="mb-3 rounded bg-red-900/50 p-2 text-sm text-red-200"
          role="alert"
          aria-live="polite"
        >
          {state.error}
        </div>
      {/if}

      {#if state.isConnected}
        <div class="relative mb-3 aspect-video overflow-hidden rounded-lg bg-black">
          <video
            bind:this={localVideoEl}
            autoplay
            playsinline
            muted
            class="h-full w-full object-cover"
            aria-label="Ваше видео"
          ></video>
          <div class="absolute right-2 bottom-2 flex gap-1" aria-hidden="true">
            {#if state.hasMic}
              <span class="rounded bg-black/70 px-1 text-xs text-white">
                {state.isSelfMuted ? '🔇' : '🎤'}
              </span>
            {/if}
            {#if state.isScreenSharing}
              <span class="rounded bg-red-600 px-1 text-xs text-white">🖥️</span>
            {/if}
          </div>
        </div>
      {/if}

      <div class="mb-3 grid grid-cols-2 gap-2">
        <button
          class="flex items-center justify-center gap-1 rounded bg-gray-800 py-2 text-xs transition-colors hover:bg-gray-700 focus:ring-2 focus:ring-cyan-400 focus:outline-none disabled:opacity-50"
          aria-label={state.isSelfMuted ? 'Размутить себя' : 'Заглушить себя'}
          on:click={toggleSelfMute}
          disabled={!state.isConnected || !state.hasMic}
        >
          {state.isSelfMuted ? '🔈' : '🎤'}
          {state.isSelfMuted ? 'Размутить' : 'Заглушить'}
        </button>

        <button
          class="flex items-center justify-center gap-1 rounded bg-gray-800 py-2 text-xs transition-colors hover:bg-gray-700 focus:ring-2 focus:ring-cyan-400 focus:outline-none disabled:opacity-50"
          aria-label={state.isSelfVideoEnabled ? 'Выключить камеру' : 'Включить камеру'}
          on:click={toggleSelfVideo}
          disabled={!state.isConnected || !state.hasCamera}
        >
          {state.isSelfVideoEnabled ? '📹' : '📷'}
          {state.isSelfVideoEnabled ? 'Выкл.' : 'Вкл.'}
        </button>

        <button
          class="col-span-2 flex items-center justify-center gap-1 rounded bg-purple-700 py-2 text-xs transition-colors hover:bg-purple-600 focus:ring-2 focus:ring-cyan-400 focus:outline-none disabled:opacity-50"
          aria-label={state.isScreenSharing ? 'Остановить шаринг экрана' : 'Поделиться экраном'}
          on:click={toggleScreenShare}
          disabled={!state.isConnected}
        >
          {state.isScreenSharing ? '⏹️ Остановить шаринг' : '🖥️ Поделиться экраном'}
        </button>
      </div>

      {#if pinnedParticipantId}
        <div class="mb-3 rounded border border-cyan-600 bg-cyan-900/30 p-2">
          <div class="mb-1 flex items-center justify-between">
            <span class="text-xs text-cyan-300">Закреплено</span>
            <button
              class="rounded text-xs text-cyan-400 hover:text-cyan-300 focus:ring-1 focus:ring-cyan-400 focus:outline-none"
              aria-label="Открепить участника"
              on:click={() => (pinnedParticipantId = null)}
            >
              ✕
            </button>
          </div>
          {#if pinnedParticipant}
            <div
              class="video-container mb-1 aspect-video w-full rounded bg-black"
              data-participant={pinnedParticipant.identity}
              aria-label={`Видео участника ${pinnedParticipant.identity}`}
            ></div>
            <div class="text-xs">{pinnedParticipant.identity}</div>
          {:else}
            <div class="text-xs">Участник вышел</div>
          {/if}
        </div>
      {/if}

      <div class="mb-3 max-h-40 space-y-2 overflow-y-auto">
        {#each state.participants as p (p.identity)}
          {#if state.room && p.identity !== state.room.localParticipant.identity}
            <div class="group relative rounded bg-gray-800 p-2">
              <div
                class="video-container relative mb-1 aspect-video w-full rounded bg-black"
                data-participant={p.identity}
                aria-label={`Видео участника ${p.identity}`}
              >
                {#if !(p.getTrackPublication(Track.Source.Camera)?.isSubscribed || p.getTrackPublication(Track.Source.ScreenShare)?.isSubscribed)}
                  <div class="absolute inset-0 flex items-center justify-center bg-gray-900">
                    <div
                      class="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-700 text-xs font-bold text-white"
                      aria-hidden="true"
                    >
                      {getInitials(p.identity)}
                    </div>
                  </div>
                {/if}
              </div>

              <div class="flex items-center justify-between">
                <div class="flex min-w-0 flex-1 items-center gap-1">
                  <div
                    class="flex h-5 w-5 items-center justify-center rounded-full border-2 bg-gray-700 text-[10px] font-bold"
                    class:border-green-500={state.activeSpeakerId === p.identity}
                    class:border-red-500={!isParticipantMuted(p) &&
                      state.activeSpeakerId !== p.identity}
                    class:border-gray-500={isParticipantMuted(p)}
                    aria-label={`Участник ${p.identity} ${isParticipantMuted(p) ? 'заглушен' : state.activeSpeakerId === p.identity ? 'говорит' : 'молчит'}`}
                  >
                    {getInitials(p.identity)}
                  </div>
                  <span class="truncate text-[10px]">{p.identity}</span>
                </div>

                <div
                  class="flex gap-1 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100"
                >
                  <button
                    class="rounded text-[10px] text-cyan-400 hover:text-cyan-300 focus:ring-1 focus:ring-cyan-400 focus:outline-none"
                    aria-label={`Закрепить участника ${p.identity}`}
                    on:click={() => pinParticipant(p.identity)}
                  >
                    📌
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    class="w-10 accent-cyan-400 focus:ring-1 focus:ring-cyan-400 focus:outline-none"
                    bind:value={volumes[p.identity]}
                    on:input={(e) =>
                      updateVolume(p.identity, parseFloat((e.target as HTMLInputElement).value))}
                    aria-label={`Громкость участника ${p.identity}`}
                  />
                </div>
              </div>

              <div class="absolute top-1 right-1 text-[10px]" aria-hidden="true">
                {#if isParticipantMuted(p)}
                  <span class="text-red-400">🔇</span>
                {:else if state.activeSpeakerId === p.identity}
                  <span class="text-green-400">🎤</span>
                {:else}
                  <span class="text-gray-400">🎤</span>
                {/if}
              </div>
            </div>
          {/if}
        {/each}
      </div>

      <button
        class="w-full rounded bg-cyan-600 py-2 text-sm font-medium transition-colors hover:bg-cyan-500 focus:ring-2 focus:ring-cyan-400 focus:outline-none disabled:opacity-50"
        aria-label={state.isConnected ? 'Выйти из голосового чата' : 'Войти в голосовой чат'}
        on:click={state.isConnected ? leaveRoom : joinRoom}
        disabled={isLoading || (state.error !== '' && !state.isConnected)}
      >
        {isLoading ? 'Подключение…' : state.isConnected ? 'Выйти' : 'Войти в чат'}
      </button>
    </div>
  </div>
{/if}

<style>
  .video-container {
    position: relative;
  }
</style>
