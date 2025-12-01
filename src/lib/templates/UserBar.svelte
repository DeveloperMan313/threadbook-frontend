<script lang="ts">
  import { ImageApi } from '$lib/api';
  import type { UserBarProps, UserProfilePublic } from '$lib/types';
  import { getContext } from 'svelte';
  import UserAvatar from './UserAvatar.svelte';

  const { username }: UserBarProps = $props();

  const { getProfile } = getContext('userProfiles') as {
    getProfile: (username: string) => UserProfilePublic | undefined;
  };

  const profile = $derived(
    getProfile(username) ||
      ({ username, nickname: 'loading...', avatar_link: '' } as UserProfilePublic)
  );
</script>

<div class="flex w-full gap-2">
  <UserAvatar
    username={profile.username}
    nickname={profile.nickname}
    avatarSrc={ImageApi.getUserAvatarURL(profile.avatar_link)}
    class="size-12"
  />
  <div class="text-left" title="profile">
    <p class="text-lg leading-none font-normal">{profile.nickname || profile.username}</p>
    <p class="text-sm text-gray-600">@{profile.username}</p>
  </div>
</div>
