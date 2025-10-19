<script lang="ts">
  import type { SpoolDockProps } from '$lib/types';
  import SpoolEntry from './SpoolEntry.svelte';

  let { spools }: SpoolDockProps = $props();
</script>

<div class="flex h-full w-16 flex-shrink-0 flex-col items-center gap-3 bg-white py-3">
  {#each spools as spool (spool.id)}
    <SpoolEntry {...spool} />
  {/each}
</div>
