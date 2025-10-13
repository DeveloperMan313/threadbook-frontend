<script lang="ts">
  import Button from '$lib/templates/Button.svelte';
  import Navbar from '$lib/templates/Navbar.svelte';
  import SpoolDock from '$lib/templates/SpoolDock.svelte';
  import ThreadListSection from '$lib/templates/ThreadListSection.svelte';
  import { setContext } from 'svelte';
  import type { PageProps } from './$types';
  import { ThreadApi } from '$lib/api';
  import type { ThreadEntryProps, ThreadType } from '$lib/types';
  import ModalThreadCreate from '$lib/templates/ModalThreadCreate.svelte';

  let { data, params }: PageProps = $props();

  let threads: Array<ThreadEntryProps> = $state([]);

  data.threads.then((resolvedThreads) => {
    threads = resolvedThreads;
  });

  setContext('threads', {
    archiveThread: (id: number) => {
      let thread = threads.filter((t) => t.id == id)[0];
      const oldThreadType = thread.type;
      thread.type = 'history';
      ThreadApi.archiveThread({ id }).catch(() => {
        thread.type = oldThreadType;
      });
    },
    createThread: (title: string, type: ThreadType) => {
      const spool_id = Number(params.id);
      ThreadApi.createThread({
        title,
        spool_id,
        type
      }).then(() => {
        ThreadApi.getSpoolThreads({ spool_id }).then((newThreads) => {
          threads = newThreads;
        });
      });
    },
    renameThread: (id: number, title: string) => {
      let thread = threads.filter((t) => t.id == id)[0];
      const oldThreadTitle = thread.title;
      thread.title = title;
      ThreadApi.renameThread({ id, title }).catch(() => {
        thread.title = oldThreadTitle;
      });
    }
  });

  let isThreadCreateModalOpen = $state(false);
</script>

<Navbar />
<div class="container">
  <SpoolDock spools={data.spools} />
  <div class="thread-list">
    <Button
      type="primary"
      label="New thread"
      onClick={() => {
        isThreadCreateModalOpen = true;
      }}
    />
    {#if threads.length == 0}
      <p>Loading threads...</p>
    {:else}
      <ThreadListSection
        title="Private"
        entries={threads.filter((t) => t.type == 'private')}
        expanded={true}
      />
      <ThreadListSection
        title="Public"
        entries={threads.filter((t) => t.type == 'public')}
        expanded={true}
      />
      <ThreadListSection
        title="History"
        entries={threads.filter((t) => t.type == 'history')}
        expanded={false}
      />
    {/if}
    <ModalThreadCreate bind:isOpen={isThreadCreateModalOpen} />
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
