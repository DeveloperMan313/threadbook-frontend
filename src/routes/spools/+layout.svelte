<script lang="ts">
  import { centrifugeClient } from '$lib/api';
  import VoiceChat from '$lib/templates/VoiceChat.svelte';
  import { onDestroy } from 'svelte';

  let { children } = $props();

  onDestroy(() => {
    centrifugeClient.disconnect();
  });
</script>

<VoiceChat />
{@render children?.()}
