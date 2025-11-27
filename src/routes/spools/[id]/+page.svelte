<script lang="ts">
  import { Button } from '$lib/components/ui/button/index.js';
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
  import Navbar from '$lib/templates/Navbar.svelte';
  import SpoolDock from '$lib/templates/SpoolDock.svelte';
  import ThreadList from '$lib/templates/ThreadList.svelte';
  import { onDestroy, setContext } from 'svelte';
  import { centrifugeClient, ProfileApi, ThreadApi } from '$lib/api';
  import type {
    ChatState,
    MessageProps,
    ThreadProps,
    ThreadType,
    UserProfilePublic,
    WsThreadClosed,
    WsThreadCreated,
    WsThreadInvited,
    WsThreadUpdated
  } from '$lib/types';
  import Chat from '$lib/templates/Chat.svelte';
  import { SvelteMap } from 'svelte/reactivity';
  import ModalInviteUsersToSpool from '$lib/templates/ModalInviteUsersToSpool.svelte';
  import { EllipsisVertical } from '@lucide/svelte';
  import Spinner from '$lib/components/ui/spinner/spinner.svelte';
  import { stateSpools } from '$lib/states';

  let { data } = $props();

  if (!data.isAuthorized) {
    throw new Error('unauthorized');
  }

  let threadChats = new SvelteMap<number, ChatState>();

  let threads: Array<ThreadProps> = $state([]);
  let currentThreadId = $state<number | null>(null);
  let threadsAreLoading = $state(true);

  const spoolName = $derived(
    stateSpools.spools.find((spool) => spool.id == data.spoolId)?.name as string
  );

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

  centrifugeClient.onUser('thread.created', (payload: WsThreadCreated) => {
    if (payload.spool_id != data.spoolId) return;
    const thread = {
      id: payload.id,
      title: payload.title,
      type: payload.type,
      is_closed: false,
      unreadCnt: 0,
      mentionCnt: 0
    } as ThreadProps;
    threads = [...threads, thread];
    centrifugeClient.addToken(payload.channel, payload.token);
  });

  centrifugeClient.onUser('thread.updated', (payload: WsThreadUpdated) => {
    if (payload.spool_id != data.spoolId) return;
    let thread = threads.filter((t) => t.id == payload.id)[0];
    thread.title = payload.title;
  });

  centrifugeClient.onUser('thread.deleted', (payload: WsThreadClosed) => {
    if (payload.spool_id != data.spoolId) return;
    let thread = threads.filter((t) => t.id == payload.id)[0];
    thread.is_closed = true;
  });

  centrifugeClient.onUser('thread.invited', (payload: WsThreadInvited) => {
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
  });

  onDestroy(() => {
    centrifugeClient.clearUser('thread.created');
    centrifugeClient.clearUser('thread.updated');
    centrifugeClient.clearUser('thread.deleted');
    centrifugeClient.clearUser('thread.invited');
  });

  let isInviteUsersToSpoolModalOpen = $state(false);
</script>

<Navbar />
<div class="fixed inset-0 top-16 flex flex-row overflow-x-scroll">
  <SpoolDock />
  <div class="flex w-72 flex-shrink-0 flex-col gap-6 p-4 pt-3 pr-3">
    <div class="flex items-start justify-between">
      <h2 class="w-full scroll-m-20 truncate border-b pb-2 text-3xl">{spoolName}</h2>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger>
          {#snippet child({ props })}
            <Button
              {...props}
              variant="ghost"
              size="icon"
              class="mt-1 cursor-pointer rounded-full text-muted-foreground"
            >
              <EllipsisVertical />
            </Button>
          {/snippet}
        </DropdownMenu.Trigger>
        <DropdownMenu.Content class="w-56" align="start">
          <DropdownMenu.Item
            onclick={() => {
              isInviteUsersToSpoolModalOpen = true;
            }}
          >
            Invite users</DropdownMenu.Item
          >
        </DropdownMenu.Content>
      </DropdownMenu.Root>
    </div>
    {#if threadsAreLoading}
      <div class="flex items-center justify-center gap-2">
        <Spinner class="size-6 text-muted-foreground" />
        <p class="text-center text-sm text-muted-foreground">Loading threads...</p>
      </div>
    {:else}
      <ThreadList {threads} />
    {/if}
    <ModalInviteUsersToSpool
      spoolId={data.spoolId}
      {spoolName}
      bind:isOpen={isInviteUsersToSpoolModalOpen}
    />
  </div>
  <div class="flex w-full min-w-96 flex-col overflow-hidden bg-white">
    {#if currentThreadId}
      <Chat />
    {:else}
      <div class="flex h-full items-center justify-center text-gray-500">
        Select a thread to start chatting
      </div>
    {/if}
  </div>
</div>
