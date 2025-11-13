<script lang="ts">
  import { Button } from '$lib/components/ui/button/index.js';
  import Navbar from '$lib/templates/Navbar.svelte';
  import SpoolDock from '$lib/templates/SpoolDock.svelte';
  import ThreadListSection from '$lib/templates/ThreadListSection.svelte';
  import { onDestroy, setContext, untrack } from 'svelte';
  import { ProfileApi, ThreadApi } from '$lib/api';
  import type {
    ChatState,
    MessageProps,
    ThreadProps,
    ThreadType,
    UserProfilePublic,
    WsSpoolDeleted,
    WsSpoolInvited,
    WsSpoolUpdated,
    WsThreadClosed,
    WsThreadCreated,
    WsThreadInvited,
    WsThreadUpdated
  } from '$lib/types';
  import ModalThreadCreate from '$lib/templates/ModalThreadCreate.svelte';
  import Chat from '$lib/templates/Chat.svelte';
  import { SvelteMap } from 'svelte/reactivity';
  import ModalInviteUsersToSpool from '$lib/templates/ModalInviteUsersToSpool.svelte';
  import VoiceChat from '$lib/templates/VoiceChat.svelte';

  let { data } = $props();

  let threadChats = new SvelteMap<number, ChatState>();

  let threads: Array<ThreadProps> = $state([]);
  let currentThreadId = $state<number | null>(null);
  let threadsAreLoading = $state(true);

  const spoolName = $derived(data.spools.find((spool) => spool.id == data.spoolId)?.name as string);

  $effect(() => {
    threadsAreLoading = true;
    data.threads.then((resolvedThreads) => {
      if (resolvedThreads?.length > 0 && resolvedThreads[0].spool_id != data.spoolId) return; // HOTFIX, need to cache
      threads = resolvedThreads || [];
      threadsAreLoading = false;
    });
  });

  setContext('threads', {
    threadChats,
    closeThread: (id: number) => {
      ThreadApi.closeThread({ id });
    },
    createThread: (title: string, type: ThreadType) => {
      ThreadApi.createThread({
        title,
        spool_id: data.spoolId,
        type
      });
    },
    getCurrentThreadId: () => {
      return currentThreadId;
    },
    getThreads: () => {
      return threads;
    },
    setCurrentThreadId: (id: number) => {
      currentThreadId = id;
    },
    renameThread: (id: number, title: string) => {
      let thread = threads.filter((t) => t.id == id)[0];
      const oldThreadTitle = thread.title;
      thread.title = title;
      ThreadApi.updateThread({ id, title, type: thread.type }).catch(() => {
        thread.title = oldThreadTitle;
      });
    }
  });

  const userProfiles = new SvelteMap<string, UserProfilePublic>();

  setContext('userProfiles', {
    cacheProfilesFromMessages: async (messages: Array<MessageProps>): Promise<void> => {
      const unknownUsernames = messages
        .map((m) => m.username)
        .reduce((unique, username) => {
          if (!unique.includes(username) && !userProfiles.has(username)) {
            unique.push(username);
          }
          return unique;
        }, [] as Array<string>);
      if (unknownUsernames.length == 0) return;
      const fetchedProfiles = await ProfileApi.getProfiles({ usernames: unknownUsernames });
      fetchedProfiles.profiles.forEach((profile) => {
        userProfiles.set(profile.username, profile);
      });
    },
    getProfile: (username: string): UserProfilePublic | undefined => {
      return userProfiles.get(username);
    }
  });

  const userHandlers = {
    onThreadCreated: (payload: WsThreadCreated) => {
      if (payload.spool_id != data.spoolId) return;
      const thread = {
        id: payload.id,
        title: payload.title,
        type: 'public',
        is_closed: false,
        unreadCnt: 0,
        mentionCnt: 0
      } as ThreadProps;
      threads = [...threads, thread];
      data.centrifugeClient.addToken(payload.channel, payload.token);
    },
    onThreadUpdated: (payload: WsThreadUpdated) => {
      if (payload.spool_id != data.spoolId) return;
      let thread = threads.filter((t) => t.id == payload.id)[0];
      thread.title = payload.title;
    },
    onThreadClosed: (payload: WsThreadClosed) => {
      if (payload.spool_id != data.spoolId) return;
      let thread = threads.filter((t) => t.id == payload.id)[0];
      thread.is_closed = true;
    },
    onThreadInvited: (payload: WsThreadInvited) => {
      if (payload.spool_id != data.spoolId) return;
      const thread = {
        id: payload.id,
        title: payload.title,
        type: 'private',
        is_closed: false,
        unreadCnt: 0,
        mentionCnt: 0
      } as ThreadProps;
      threads = [...threads, thread];
    },
    onSpoolUpdated: (payload: WsSpoolUpdated) => {},
    onSpoolDeleted: (payload: WsSpoolDeleted) => {},
    onSpoolInvited: (payload: WsSpoolInvited) => {}
  };

  data.centrifugeClient.subToUser(userHandlers);

  onDestroy(() => {
    data.centrifugeClient.unsubFromUser();
  });

  let isThreadCreateModalOpen = $state(false);
  let isInviteUsersToSpoolModalOpen = $state(false);
</script>

<Navbar />
<VoiceChat />
<div class="fixed inset-0 top-16 flex flex-row">
  <SpoolDock spools={data.spools} />
  <div class="flex w-72 flex-shrink-0 flex-col gap-6 p-4 pt-3 pr-3">
    <h2 class="w-full scroll-m-20 border-b pb-2 text-3xl">{spoolName}</h2>
    <Button
      variant="outline"
      class="cursor-pointer"
      onclick={() => {
        isInviteUsersToSpoolModalOpen = true;
      }}
    >
      Invite users
    </Button>
    <Button
      variant="outline"
      class="cursor-pointer"
      onclick={() => {
        isThreadCreateModalOpen = true;
      }}
    >
      New thread
    </Button>
    {#if threadsAreLoading}
      <p class="text-gray-600">Loading threads...</p>
    {:else if threads.length == 0}
      <p class="text-gray-600">No threads. Create one</p>
    {:else}
      <ThreadListSection
        title="Private"
        entries={threads.filter((t) => !t.is_closed && t.type == 'private')}
        expanded={true}
      />
      <ThreadListSection
        title="Public"
        entries={threads.filter((t) => !t.is_closed && t.type == 'public')}
        expanded={true}
      />
      <ThreadListSection
        title="Closed"
        entries={threads.filter((t) => t.is_closed)}
        expanded={false}
      />
    {/if}
    <ModalThreadCreate bind:isOpen={isThreadCreateModalOpen} />
    <ModalInviteUsersToSpool
      spoolId={data.spoolId}
      {spoolName}
      bind:isOpen={isInviteUsersToSpoolModalOpen}
    />
  </div>
  <div class="flex w-full flex-col bg-white">
    {#if currentThreadId}
      <Chat centrifugeClient={data.centrifugeClient} />
    {:else}
      <div class="flex h-full items-center justify-center text-gray-500">
        Select a thread to start chatting
      </div>
    {/if}
  </div>
</div>
