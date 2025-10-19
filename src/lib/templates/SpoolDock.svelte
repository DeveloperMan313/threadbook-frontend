<script lang="ts">
  import type { SpoolDockProps } from '$lib/types';
  import SpoolEntry from './SpoolEntry.svelte';

  let { spools }: SpoolDockProps = $props();
</script>

<div class="spool-dock">
  {#each spools as spool (spool.id)}
    <SpoolEntry {...spool} />
  {/each}
</div>

<style>
  .spool-dock {
    width: 4rem;
    height: 100%;
    padding: var(--m-3) 0 var(--m-3);
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--m-3);
    background-color: var(--bg-primary);
    z-index: 10;
  }
</style>
