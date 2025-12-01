<script lang="ts">
  import { resolve } from '$app/paths';
  import { ImageApi } from '$lib/api';
  import logo from '$lib/assets/icons/logo.svg';
  import Button from '$lib/components/ui/button/button.svelte';
  import type { UserProfileFull } from '$lib/types';
  import { stateProfile } from '$lib/states';
  import ModalProfileSettings from './ModalProfileSettings.svelte';
  import UserAvatar from './UserAvatar.svelte';

  const profile = $derived(stateProfile.profile as UserProfileFull);

  let isProfileSettingsModalOpen = $state(false);
</script>

<div
  class="fixed top-0 z-10 flex h-16 w-full items-center justify-between border-2 border-border bg-background px-6"
>
  <a class="flex items-center gap-2 text-inherit no-underline" href={resolve('/spools', {})}>
    <img class="h-12 w-12" src={logo} alt="logo" />
    <h1 class="text-4xl font-normal">ThreadBook</h1>
  </a>
  {#if profile}
    <button
      class="flex cursor-pointer items-center gap-2"
      onclick={() => {
        isProfileSettingsModalOpen = true;
      }}
    >
      <UserAvatar
        username={profile.username}
        nickname={profile.nickname}
        avatarSrc={ImageApi.getUserAvatarURL(profile.avatar_link)}
        class="size-12"
      />
      <div class="text-left" title="profile">
        <p class="text-lg leading-none font-normal">{profile.nickname}</p>
        <p class="text-sm text-gray-600">@{profile.username}</p>
      </div>
    </button>
  {:else}
    <Button class="cursor-pointer" href={resolve('/signin', {})}>Sign in</Button>
  {/if}
</div>

<ModalProfileSettings bind:isOpen={isProfileSettingsModalOpen} />
