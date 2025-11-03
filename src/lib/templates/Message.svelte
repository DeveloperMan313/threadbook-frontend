<script lang="ts">
  import type { MessageProps, UserProfilePublic } from '$lib/types';
  import * as Avatar from '$lib/components/ui/avatar/index.js';
  import { getContext } from 'svelte';
  import { ImageApi } from '$lib/api';

  const { username, content, created_at }: MessageProps = $props();

  const { getProfile } = getContext('userProfiles') as {
    getProfile: (username: string) => UserProfilePublic | undefined;
  };

  const avatarSrc = $derived(
    getProfile(username) ? ImageApi.getUserAvatarURL(getProfile(username)!.avatar_link) : undefined
  );
</script>

<div class="flex w-full">
  <div class="w-[5rem] flex-none">
    {#if avatarSrc}
      <Avatar.Root class="size-[3rem]">
        <Avatar.Image src={avatarSrc} alt="@{username}" />
        <Avatar.Fallback>{username.slice(0, 2).toUpperCase()}</Avatar.Fallback>
      </Avatar.Root>
    {/if}
  </div>
  <div class="flex-1">
    <div class="w-full">
      <h4 class="me-2 inline scroll-m-20 text-xl font-semibold tracking-tight">{username}</h4>
      <p class="inline text-sm text-muted-foreground">
        {new Date(created_at).toLocaleTimeString()}
      </p>
    </div>
    <p class="w-full">{content}</p>
  </div>
</div>
