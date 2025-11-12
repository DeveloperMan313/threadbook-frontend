<script lang="ts">
  import type { SpoolProps } from '$lib/types';
  import logo from '$lib/assets/icons/logo.svg';
  import usersIcon from '$lib/assets/icons/users.svg';
  import threadsIcon from '$lib/assets/icons/threads.svg';
  import { resolve } from '$app/paths';
  import { ImageApi } from '$lib/api';

  const { id, name, banner_link, description, members, threads }: SpoolProps = $props();
</script>

<a class="h-[26rem] w-64 overflow-hidden rounded-2xl no-underline" href={resolve(`/spools/${id}`)}>
  {#if banner_link}
    <img class="h-64 w-64" src={ImageApi.getSpoolBannerURL(banner_link)} alt={name} />
  {:else}
    <img class="h-64 w-64" src={logo} alt="logo" />
  {/if}
  <div class="flex h-40 w-full flex-col gap-3 bg-background p-3">
    <p class="text-xl font-medium">{name}</p>
    <div class="flex items-center gap-3">
      <div class="flex items-center gap-2">
        <img class="h-5 w-5" src={usersIcon} alt="users:" />
        <p class="text-base">{members}</p>
      </div>
      <div class="flex items-center gap-2">
        <img class="h-5 w-5" src={threadsIcon} alt="threads:" />
        <p class="text-base">{threads}</p>
      </div>
    </div>
    <p class="text-base text-gray-600">{description}</p>
  </div>
</a>
