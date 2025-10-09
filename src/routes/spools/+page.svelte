<script lang="ts">
  import Navbar from '$lib/templates/Navbar.svelte';
  import SpoolCard from '$lib/templates/SpoolCard.svelte';
  import VoiceChat from '$lib/templates/VoiceChat.svelte';
  import type { PageProps } from './$types';

  let { data }: PageProps = $props();
</script>

<Navbar />
<VoiceChat />
<div class="container">
  {#each data.spools as spool (spool.id)}
    <SpoolCard {...spool} />
  {/each}
</div>

<style>
  .container {
    width: 100%;
    height: 100%;
    padding: 7rem 5rem 0;
    display: flex;
    flex-direction: row;
    justify-content: start;
    flex-wrap: wrap;
    gap: var(--m-3);
  }
</style>
