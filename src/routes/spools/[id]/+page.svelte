<script lang="ts">
  import Navbar from '$lib/templates/Navbar.svelte';
  import ThreadListSection from '$lib/templates/ThreadListSection.svelte';
  import type { PageProps } from './$types';

  let { data }: PageProps = $props();
</script>

<Navbar />
<div class="container">
  <div class="spool-list"></div>
  <div class="thread-list">
    <ThreadListSection title="Private" entries={data.threads.private} expanded={true} />
    <ThreadListSection title="Public" entries={data.threads.public} expanded={true} />
    <ThreadListSection title="History" entries={data.threads.history} expanded={false} />
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

  .spool-list {
    width: 6rem;
    flex-shrink: 0;
    background-color: var(--bg-primary);
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
    border-bottom-left-radius: var(--border-radius);
  }

  .input-section {
    height: 5rem;
  }
</style>
