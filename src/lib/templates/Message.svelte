<script lang="ts">
  import type { ChatState, MessageProps, UserProfilePublic } from '$lib/types';
  import { getContext } from 'svelte';
  import { ImageApi } from '$lib/api';
  import type { SvelteMap } from 'svelte/reactivity';
  import UserAvatar from './UserAvatar.svelte';

  const { username, content, created_at, index, thread_id }: MessageProps = $props();

  const { threadChats } = getContext('threads') as {
    threadChats: SvelteMap<number, ChatState>;
  };

  const { getProfile } = getContext('userProfiles') as {
    getProfile: (username: string) => UserProfilePublic | undefined;
  };

  const nickname = $derived(getProfile(username) ? getProfile(username)!.nickname : undefined);

  const avatarSrc = $derived(
    getProfile(username) ? ImageApi.getUserAvatarURL(getProfile(username)!.avatar_link) : undefined
  );

  const shouldRenderProfileInfo = $derived.by((): boolean => {
    if (!index || !thread_id) return true;

    if (index == 0) return true;

    const prevMsg = threadChats.get(thread_id)!.messages[index - 1];
    const prevDT = new Date(prevMsg.created_at).getTime();
    const thisDT = new Date(created_at).getTime();
    const maxDelta = 60 * 1000; // 1 minute
    return prevMsg.username != username || Math.abs(thisDT - prevDT) > maxDelta;
  });
</script>

<div class="flex w-full" class:mt-4={shouldRenderProfileInfo}>
  <div class="w-[5rem] flex-none">
    {#if shouldRenderProfileInfo}
      <UserAvatar {username} {nickname} {avatarSrc} class="size-12" />
    {/if}
  </div>
  <div class="flex-1">
    {#if shouldRenderProfileInfo}
      <div class="flex w-full flex-row items-end gap-1">
        <p class="font-semibold">{nickname || username}</p>
        <p class="text-sm text-muted-foreground">
          {new Date(created_at).toLocaleTimeString()}
        </p>
      </div>
    {/if}
    <p class="w-full">{content}</p>
  </div>
</div>
