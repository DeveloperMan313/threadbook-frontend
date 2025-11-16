<script lang="ts">
  import type { SpoolProps } from '$lib/types';
  import logo from '$lib/assets/icons/logo.svg';
  // import usersIcon from '$lib/assets/icons/users.svg';
  // import threadsIcon from '$lib/assets/icons/threads.svg';
  import { resolve } from '$app/paths';
  import { ImageApi } from '$lib/api';

  const { id, name, banner_link }: SpoolProps = $props();
</script>

<a
  class="group h-80 w-64 overflow-hidden rounded-2xl bg-background no-underline shadow-md transition-shadow hover:shadow-xl"
  href={resolve(`/spools/${id}`)}
>
  {#if banner_link}
    <img class="size-64 bg-accent" src={ImageApi.getSpoolBannerURL(banner_link)} alt={name} />
  {:else}
    <div class="flex size-64 items-center justify-center bg-accent">
      <img class="size-32 opacity-50" src={logo} alt="logo" />
    </div>
  {/if}
  <div class="flex h-40 w-full flex-col gap-3 p-3 transition-colors">
    <p class="text-xl font-medium">{name}</p>
    <!-- <div class="flex items-center gap-3">
      <div class="flex items-center gap-2">
        <img class="size-5" src={usersIcon} alt="users:" />
        <p class="text-base">{members}</p>
      </div>
      <div class="flex items-center gap-2">
        <img class="size-5" src={threadsIcon} alt="threads:" />
        <p class="text-base">{threads}</p>
      </div>
    </div>
    <p class="text-base text-gray-600">{description}</p> -->
  </div>
</a>
