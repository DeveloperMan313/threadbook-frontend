<script lang="ts">
  import { useSwipe, type SwipeCustomEvent, type GestureCustomEvent } from 'svelte-gestures';
  import { Button } from '$lib/components/ui/button/index.js';
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
  import Navbar from '$lib/components/Navbar.svelte';
  import SpoolDock from '$lib/components/SpoolDock.svelte';
  import ThreadList from '$lib/components/ThreadList.svelte';
  import { onDestroy, setContext, untrack } from 'svelte';
  import { centrifugeClient, ProfileApi, ThreadApi } from '$lib/api';
  import type {
    ChatState,
    ThreadProps,
    ThreadType,
    UserProfilePublic,
    WsThreadClosed,
    WsThreadCreated,
    WsThreadInvited,
    WsThreadUpdated
  } from '$lib/types';
  import Chat from '$lib/components/Chat.svelte';
  import { SvelteMap } from 'svelte/reactivity';
  import ModalInviteUsersToSpool from '$lib/components/ModalInviteUsersToSpool.svelte';
  import { EllipsisVertical } from '@lucide/svelte';
  import Spinner from '$lib/components/ui/spinner/spinner.svelte';
  import {
    stateSpools,
    stateSpoolsGetCurrentAccessLevel,
    stateSpoolsSetCurrentSpoolId
  } from '$lib/states';
  import ModalSpoolLeave from '$lib/components/ModalSpoolLeave.svelte';
  import ModalSpoolEdit from '$lib/components/ModalSpoolEdit.svelte';
  import ThreadMemberList from '$lib/components/ThreadMemberList.svelte';
  import * as m from '$lib/paraglide/messages';

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

  const userAccessLevel = $derived(stateSpoolsGetCurrentAccessLevel());

  $effect(() => {
    stateSpoolsSetCurrentSpoolId(data.spoolId);
  });

  $effect(() => {
    threadsAreLoading = true;
    currentThreadId = null;
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
    cacheProfilesFromUsernames: async (usernames: string[]): Promise<void> => {
      const unknownUsernames = usernames.reduce((unique, username) => {
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

  let isSpoolPanelExpanded = $state(true);
  let isThreadMemberListExpanded = $state(true);

  let isMaxLg = $state(window.innerWidth < 1024); // tailwind max-lg
  let isMaxMd = $state(window.innerWidth < 768); // tailwind max-md

  const windowResizeListener = () => {
    isMaxLg = window.innerWidth < 1024;
    isMaxMd = window.innerWidth < 768;
  };

  $effect(() => {
    window.addEventListener('resize', windowResizeListener);
    return () => {
      window.removeEventListener('resize', windowResizeListener);
    };
  });

  $effect(() => {
    // toggle ThreadMemberList on window resize
    isThreadMemberListExpanded = !isMaxLg; // TODO add-user set default
  });

  $effect(() => {
    // toggle spool panel on viewport resize / thread select
    if (isMaxMd) {
      isSpoolPanelExpanded = currentThreadId === null;
    }
    if (!isMaxMd) {
      isSpoolPanelExpanded = true; // TODO add user-set default
    }
  });

  const swipeHandler = (event: SwipeCustomEvent) => {
    if (!isMaxMd) return;
    if (event.detail.direction === 'right') {
      isSpoolPanelExpanded = true;
    }
    if (event.detail.direction === 'left') {
      isSpoolPanelExpanded = false;
    }
  };

  let isInviteUsersToSpoolModalOpen = $state(false);
  let isSpoolLeaveModalOpen = $state(false);
  let isSpoolEditModalOpen = $state(false);
</script>

<Navbar />
<div
  {...useSwipe(swipeHandler, () => ({ timeframe: 300, minSwipeDistance: 50, touchAction: 'none' }))}
  class="fixed inset-0 top-16 flex flex-row overflow-hidden"
>
  <SpoolDock />
  <div
    class={`flex w-[calc(100%-4rem)] min-[30rem]:w-72 ${isSpoolPanelExpanded ? '' : 'max-[30rem]:ml-[calc(4rem-100%)] min-[30rem]:-ml-72'} -z-10 flex-shrink-0 flex-col gap-6 bg-primary-foreground p-4 pt-3 pr-3`}
  >
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
        <DropdownMenu.Content class="w-52" align="start">
          <DropdownMenu.Item
            class="cursor-pointer"
            onclick={() => {
              isInviteUsersToSpoolModalOpen = true;
            }}
          >
            {m.invite_users()}</DropdownMenu.Item
          >
          {#if userAccessLevel === 3}
            <DropdownMenu.Item
              class="cursor-pointer"
              onclick={() => {
                isSpoolEditModalOpen = true;
              }}
            >
              {m.edit()}</DropdownMenu.Item
            >
          {:else}
            <!-- TODO think of leave access -->
            <DropdownMenu.Item
              class="cursor-pointer"
              variant="destructive"
              onclick={() => {
                isSpoolLeaveModalOpen = true;
              }}
            >
              {m.leave()}</DropdownMenu.Item
            >
          {/if}
        </DropdownMenu.Content>
      </DropdownMenu.Root>
    </div>
    {#if threadsAreLoading}
      <div class="flex items-center justify-center gap-2">
        <Spinner class="size-6 text-muted-foreground" />
        <p class="text-center text-sm text-muted-foreground">{m.loading_threads()}</p>
      </div>
    {:else}
      <ThreadList {threads} />
    {/if}
  </div>
  <div class="flex w-full flex-col overflow-hidden bg-white">
    {#if currentThreadId}
      <div class="h-full min-w-72">
        <Chat />
      </div>
    {:else}
      <div class="flex h-full items-center justify-center text-center text-gray-500">
        {m.select_a_thread()}
      </div>
    {/if}
  </div>
  <div class={`w-64 ${isThreadMemberListExpanded ? '' : '-mr-64'} flex-none`}>
    <ThreadMemberList spoolId={data.spoolId} />
  </div>
</div>
<ModalInviteUsersToSpool spoolId={data.spoolId} bind:isOpen={isInviteUsersToSpoolModalOpen} />
<ModalSpoolEdit spoolId={data.spoolId} bind:isOpen={isSpoolEditModalOpen} />
<ModalSpoolLeave spoolId={data.spoolId} bind:isOpen={isSpoolLeaveModalOpen} />
