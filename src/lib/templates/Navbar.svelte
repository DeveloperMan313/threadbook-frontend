<script lang="ts">
  import { resolve } from '$app/paths';
  import { page } from '$app/state';
  import logo from '$lib/assets/icons/logo.svg';
  import * as Avatar from '$lib/components/ui/avatar/index.js';

  const username = $derived(page.data.userProfile?.username);
</script>

<div
  class="fixed top-0 flex h-16 w-full items-center justify-between border-2 border-border bg-background px-6"
>
  <a class="flex items-center gap-2 text-inherit no-underline" href={resolve('/spools')}>
    <img class="h-12 w-12" src={logo} alt="logo" />
    <h1 class="text-4xl font-normal">ThreadBook</h1>
  </a>
  <a class="flex items-center gap-2 text-inherit no-underline" href={resolve('/signin')}>
    {#if username}
      <Avatar.Root class="size-[3rem]">
        <Avatar.Image alt="@{username}" />
        <Avatar.Fallback>{username.slice(0, 2).toUpperCase()}</Avatar.Fallback>
      </Avatar.Root>
      <div class="text-left" title="profile">
        <p class="text-lg leading-none font-normal">{username}</p>
        <p class="text-sm text-gray-600">@{username}</p>
      </div>
    {/if}
  </a>
</div>
