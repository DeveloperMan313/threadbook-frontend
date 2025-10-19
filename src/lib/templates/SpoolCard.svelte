<script lang="ts">
  import type { SpoolProps } from '$lib/types';
  import usersIcon from '$lib/assets/icons/users.svg';
  import threadsIcon from '$lib/assets/icons/threads.svg';
  import { resolve } from '$app/paths';

  const { id, name, description, members, threads }: SpoolProps = $props();
</script>

<a class="h-[26rem] w-64 overflow-hidden rounded-2xl no-underline" href={resolve(`/spools/${id}`)}>
  <div class="h-64 w-64 bg-primary"></div>
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
