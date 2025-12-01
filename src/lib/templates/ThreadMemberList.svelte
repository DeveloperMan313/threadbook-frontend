<script lang="ts">
  import type { ThreadMemberListProps, ThreadProps } from '$lib/types';
  import { getContext } from 'svelte';
  import UserBar from './UserBar.svelte';
  import { SpoolApi, ThreadApi } from '$lib/api';

  const { spoolId }: ThreadMemberListProps = $props();

  const { getCurrentThreadId, getThreads } = getContext('threads') as {
    getCurrentThreadId: () => number | null;
    getThreads: () => ThreadProps[];
  };

  const { cacheProfilesFromUsernames } = getContext('userProfiles') as {
    cacheProfilesFromUsernames: (usernames: string[]) => Promise<void>;
  };

  let usernames = $state<string[]>([]);

  const mode = $derived.by(() => {
    const threadId = getCurrentThreadId();
    if (threadId && getThreads().find((t) => t.id === threadId)!.type === 'private') {
      return 'private';
    }
    return 'public';
  });

  $effect(() => {
    if (mode === 'private') {
      ThreadApi.getMembers({ thread_id: getCurrentThreadId()! }).then((members) => {
        usernames = members.map((m) => m.username);
        cacheProfilesFromUsernames(usernames);
      });
    }
    SpoolApi.getMembers({ spool_id: spoolId }).then((response) => {
      usernames = response.members.map((m) => m.username);
      cacheProfilesFromUsernames(usernames);
    });
  });
</script>

<div class="flex h-full w-full flex-col bg-primary-foreground px-4 py-5">
  <h3 class="pb-2 text-2xl">{mode === 'private' ? 'Thread members' : 'Spool members'}</h3>
  <div class="w-full flex-1 space-y-2 overflow-y-auto pl-2">
    {#each usernames as username (username)}
      <UserBar {username} />
    {/each}
  </div>
</div>
