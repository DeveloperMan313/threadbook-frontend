<script lang="ts">
  import Button from '$lib/templates/Button.svelte';
  import Navbar from '$lib/templates/Navbar.svelte';
  import SpoolDock from '$lib/templates/SpoolDock.svelte';
  import ThreadListSection from '$lib/templates/ThreadListSection.svelte';
  import type { PageProps } from './$types';

  let { data }: PageProps = $props();
</script>

<Navbar />
<div class="container">
  <SpoolDock spools={data.spools} />
  <div class="thread-list">
    <Button type="primary" label="New thread" onClick={() => alert('New thread')} />
    {#await data.threads}
      <p>Loading threads...</p>
    {:then threads}
      <ThreadListSection title="Private" entries={threads.private} expanded={true} />
      <ThreadListSection title="Public" entries={threads.public} expanded={true} />
      <ThreadListSection title="History" entries={threads.history} expanded={false} />
    {:catch error}
      <p>Error loading threads: {error.message}</p>
    {/await}
  </div>
  <div class="main">
    <div class="chat-section"></div>
    <div class="input-section"></div>
  </div>
</div>

<style>
  .container {
    position: fixed;
    top: var(--navbar-height);
    left: 0;
    bottom: 0;
    right: 0;
    display: flex;
    flex-direction: row;
  }

  .thread-list {
    width: 18rem;
    padding: var(--m-3) var(--m-3) 0 var(--m-4);
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    gap: var(--m-4);
  }

  .main {
    width: 100%;
    display: flex;
    flex-direction: column;
  }

  .chat-section {
    height: 100%;
    background-color: var(--bg-primary);
    border-bottom-left-radius: var(--border-radius-large);
  }

  .input-section {
    height: 5rem;
  }
</style>
