<script lang="ts">
  import type { SpoolDockProps } from '$lib/types';
  import SpoolEntry from './SpoolEntry.svelte';
  import ModalSpoolCreate from './ModalSpoolCreate.svelte';
  import { Button } from '$lib/components/ui/button/index.js';

  let { spools }: SpoolDockProps = $props();

  let isCreateModalOpen = $state(false);
</script>

<div class="flex h-full w-16 flex-shrink-0 flex-col items-center gap-3 bg-background py-3">
  {#each spools as spool (spool.id)}
    <SpoolEntry {...spool} />
  {/each}
  <Button
    variant="outline"
    class="flex h-12 w-12 cursor-pointer items-center justify-center rounded-2xl text-xl font-semibold hover:bg-accent hover:text-accent-foreground"
    onclick={() => (isCreateModalOpen = true)}>+</Button
  >
</div>

<ModalSpoolCreate bind:isOpen={isCreateModalOpen} />
