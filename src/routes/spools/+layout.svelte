<script lang="ts">
  import { onDestroy } from 'svelte';

  let { data, children } = $props();

  onDestroy(() => {
    data.centrifugeClient!.disconnect();
  });
</script>

{@render children?.()}
