<script lang="ts">
  import type { SpoolDockProps } from '$lib/types';
  import SpoolEntry from './SpoolEntry.svelte';
  import ModalSpoolCreate from './ModalSpoolCreate.svelte';
  import { Button } from '$lib/components/ui/button/index.js';
  import { SpoolApi } from '$lib/api';
  import { setContext } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { resolve } from '$app/paths';

  let { spools }: SpoolDockProps = $props();

  setContext('spools', {
    leave: async (spool_id: number) => {
      const spoolToRemove = spools.find((spool) => spool.id == spool_id);
      if (!spoolToRemove) return;

      spools = spools.filter((spool) => spool.id !== spool_id);

      const currentPath = page.url.pathname;
      if (currentPath.startsWith('/spools/')) {
        const currentSpoolId = currentPath.split('/')[2];
        if (currentSpoolId && parseInt(currentSpoolId) == spool_id) {
          goto(resolve('/spools'));
        }
      }

      try {
        await SpoolApi.leaveFromSpool({ spool_id });
      } catch (error) {
        spools = [...spools, spoolToRemove];
        console.error('Failed to leave spool:', error);
      }
    }
  });

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
