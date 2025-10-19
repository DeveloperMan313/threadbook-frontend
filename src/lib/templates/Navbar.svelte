<script lang="ts">
  import { resolve } from '$app/paths';
  import logo from '$lib/assets/icons/logo.svg';
</script>

<div
  class="fixed top-0 flex h-16 w-full items-center justify-between border-b border-pink-200 bg-amber-50 px-6"
>
  <a class="flex items-center gap-2 text-inherit no-underline" href={resolve('/spools')}>
    <img class="h-12 w-12" src={logo} alt="logo" />
    <h1 class="text-4xl font-normal">ThreadBook</h1>
  </a>
  <a class="flex items-center gap-2 text-inherit no-underline" href={resolve('/signin')}>
    <div class="h-12 w-12 rounded-2xl bg-emerald-400"></div>
    <div class="text-left" title="profile">
      <p class="text-lg leading-none font-normal">Username</p>
      <p class="text-sm text-gray-600">@user_tag</p>
    </div>
  </a>
</div>
