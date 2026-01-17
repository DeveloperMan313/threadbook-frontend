<script lang="ts">
  import { Plus } from '@lucide/svelte';
  import ModalSpoolCreate from '$lib/components/ModalSpoolCreate.svelte';
  import Navbar from '$lib/components/Navbar.svelte';
  import SpoolCard from '$lib/components/SpoolCard.svelte';
  import { stateSpools } from '$lib/states';
  import * as m from '$lib/paraglide/messages';

  let { data } = $props();

  if (!data.isAuthorized) {
    throw new Error('unauthorized');
  }

  let isCreateModalOpen = $state(false);
</script>

<Navbar />
<h1 class="ps-20 pt-28 text-4xl">{m.my_spools()}</h1>
<div class="mt-10 flex w-full flex-row flex-wrap content-start justify-start gap-4 px-20 pb-5">
  {#each stateSpools.spools as spool (spool.id)}
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
      <p>{m.create_spool()}</p>
    </div>
  </button>
</div>
<ModalSpoolCreate bind:isOpen={isCreateModalOpen} />
