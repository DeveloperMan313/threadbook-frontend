<script lang="ts">
  import Navbar from '$lib/templates/Navbar.svelte';
  import SpoolCard from '$lib/templates/SpoolCard.svelte';
  import VoiceChat from '$lib/templates/VoiceChat.svelte';
  import type { LayoutProps } from './$types';

  let { data }: LayoutProps = $props();
</script>

<Navbar />
<VoiceChat />
<div class="flex h-full w-full flex-row flex-wrap justify-start gap-3 px-20 pt-28">
  {#each data.spools as spool (spool.id)}
    <SpoolCard {...spool} />
  {/each}
</div>
