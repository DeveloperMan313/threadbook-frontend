<script lang="ts">
  import type { ThreadMemberListProps, ThreadProps } from '$lib/types';
  import { getContext } from 'svelte';
  import UserBar from './UserBar.svelte';
  import { SpoolApi, ThreadApi } from '$lib/api';
  import { Skeleton } from '$lib/components/ui/skeleton';

  const { spoolId }: ThreadMemberListProps = $props();

  const { getCurrentThreadId, getThreads } = getContext('threads') as {
    getCurrentThreadId: () => number | null;
    getThreads: () => ThreadProps[];
  };

  const { cacheProfilesFromUsernames } = getContext('userProfiles') as {
    cacheProfilesFromUsernames: (usernames: string[]) => Promise<void>;
  };

  let usernames = $state<string[]>([]);
  let isLoading = $state(false);

  const mode = $derived.by(() => {
    const threadId = getCurrentThreadId();
    if (threadId && getThreads().find((t) => t.id === threadId)!.type === 'private') {
      return 'private';
    }
    return 'public';
  });

  $effect(() => {
    // TEMP need to move threads to global state and cache them
    const threadId = getCurrentThreadId(); // TEMP capture
    isLoading = true;
    if (mode === 'private') {
      ThreadApi.getMembers({ thread_id: threadId! }).then((members) => {
        if (getCurrentThreadId() !== threadId) return; // TEMP
        usernames = members.map((m) => m.username);
        cacheProfilesFromUsernames(usernames);
        isLoading = false;
      });
      return;
    }
    SpoolApi.getMembers({ spool_id: spoolId }).then((response) => {
      if (getCurrentThreadId() !== threadId) return; // TEMP
      usernames = response.members.map((m) => m.username);
      cacheProfilesFromUsernames(usernames);
      isLoading = false;
    });
  });
</script>

<div class="flex h-full w-full flex-col bg-primary-foreground px-4 py-5">
  <h3 class="pb-2 text-2xl">{mode === 'private' ? 'Thread members' : 'Spool members'}</h3>
  <div class="w-full flex-1 space-y-2 overflow-y-auto pl-2">
    {#if isLoading}
      {#each { length: 3 }}
        <div class="flex items-center space-x-4">
          <Skeleton class="size-12 flex-none rounded-full" />
          <div class="w-full space-y-2">
            <Skeleton class="h-4 w-32" />
            <Skeleton class="h-4 w-24" />
          </div>
        </div>
      {/each}
    {:else}
      {#each usernames as username (username)}
        <UserBar {username} />
      {/each}
    {/if}
  </div>
</div>
