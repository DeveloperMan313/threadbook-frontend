<script lang="ts">
  import { Plus } from '@lucide/svelte';
  import ModalSpoolCreate from '$lib/templates/ModalSpoolCreate.svelte';
  import Navbar from '$lib/templates/Navbar.svelte';
  import SpoolCard from '$lib/templates/SpoolCard.svelte';

  let { data } = $props();

  if (!data.isAuthorized) {
    throw new Error('unauthorized');
  }

  let isCreateModalOpen = $state(false);
</script>

<Navbar />
<h1 class="ms-20 mt-28 text-4xl">My spools</h1>
<div class="mt-10 flex h-full w-full flex-row flex-wrap content-start justify-start gap-4 px-20">
  {#each data.spools as spool (spool.id)}
    <SpoolCard {...spool} />
  {/each}
  <button
    class="flex h-80 w-64 cursor-pointer items-center justify-center overflow-hidden rounded-2xl border-2 border-border no-underline shadow-md transition-shadow hover:shadow-xl"
    onclick={() => {
      isCreateModalOpen = true;
    }}
  >
    <div class="flex flex-col items-center text-muted-foreground">
      <Plus class="size-16" />
      <p>Create spool</p>
    </div>
  </button>
</div>
<ModalSpoolCreate bind:isOpen={isCreateModalOpen} />
