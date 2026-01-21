<script lang="ts">
  import '../app.css';
  import '$lib/styles/global.css';

  import favicon from '$lib/assets/favicon.svg';
  import { Toaster } from '$lib/components/ui/sonner';

  let { children } = $props();
</script>

<svelte:head>
  <link rel="icon" href={favicon} />
</svelte:head>

<Toaster />

{@render children?.()}
