<script lang="ts">
  import { resolve } from '$app/paths';
  import { page } from '$app/state';
  import logo from '$lib/assets/icons/logo.svg';
  import * as Avatar from '$lib/components/ui/avatar/index.js';
  import type { UserProfileFull } from '$lib/types';

  const profile = $derived(page.data.userProfile) as UserProfileFull;
</script>

<div
  class="fixed top-0 z-100 flex h-16 w-full items-center justify-between border-2 border-border bg-background px-6"
>
  <a class="flex items-center gap-2 text-inherit no-underline" href={resolve('/spools')}>
    <img class="h-12 w-12" src={logo} alt="logo" />
    <h1 class="text-4xl font-normal">ThreadBook</h1>
  </a>
  <a class="flex items-center gap-2 text-inherit no-underline" href={resolve('/profile')}>
    <Avatar.Root class="size-[3rem]">
      <Avatar.Image src={profile.avatar_link} alt={profile.nickname} />
      <Avatar.Fallback>{profile.nickname.slice(0, 2).toUpperCase()}</Avatar.Fallback>
    </Avatar.Root>
    <div class="text-left" title="profile">
      <p class="text-lg leading-none font-normal">{profile.nickname}</p>
      <p class="text-sm text-gray-600">@{profile.username}</p>
    </div>
  </a>
</div>
