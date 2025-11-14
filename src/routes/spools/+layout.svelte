<script lang="ts">
  import VoiceChat from '$lib/templates/VoiceChat.svelte';
  import { onDestroy } from 'svelte';

  let { data, children } = $props();

  onDestroy(() => {
    data.centrifugeClient!.disconnect();
  });
</script>

<VoiceChat />
{@render children?.()}
