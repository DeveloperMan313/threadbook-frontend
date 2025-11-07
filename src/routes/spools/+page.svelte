<script lang="ts">
  import { Plus } from '@lucide/svelte';
  import ModalSpoolCreate from '$lib/templates/ModalSpoolCreate.svelte';
  import Navbar from '$lib/templates/Navbar.svelte';
  import SpoolCard from '$lib/templates/SpoolCard.svelte';
  import VoiceChat from '$lib/templates/VoiceChat.svelte';
  import type { LayoutProps } from './$types';

  let { data }: LayoutProps = $props();

  let isCreateModalOpen = $state(false);
</script>

<Navbar />
<VoiceChat />
<div class="flex h-full w-full flex-row flex-wrap justify-start gap-3 px-20 pt-28">
  {#each data.spools as spool (spool.id)}
    <SpoolCard {...spool} />
  {/each}
  <button
    class="flex h-[26rem] w-64 cursor-pointer items-center justify-center overflow-hidden rounded-2xl border-2 border-border no-underline"
    onclick={() => {
      isCreateModalOpen = true;
    }}
  >
    <div class="flex flex-col items-center">
      <Plus class="size-16" />
      <p>Create spool</p>
    </div>
  </button>
</div>
<ModalSpoolCreate bind:isOpen={isCreateModalOpen} />
