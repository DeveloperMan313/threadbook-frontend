<script lang="ts">
  import { Button } from '$lib/components/ui/button/index.js';
  import Navbar from '$lib/templates/Navbar.svelte';
  import SpoolDock from '$lib/templates/SpoolDock.svelte';
  import ThreadListSection from '$lib/templates/ThreadListSection.svelte';
  import { setContext } from 'svelte';
  import type { PageProps } from './$types';
  import { ThreadApi } from '$lib/api';
  import type { ChatProps, ThreadProps, ThreadType } from '$lib/types';
  import ModalThreadCreate from '$lib/templates/ModalThreadCreate.svelte';
  import Chat from '$lib/templates/Chat.svelte';
  import { SvelteMap } from 'svelte/reactivity';

  let { data, params }: PageProps = $props();

  let threadChats = new SvelteMap<number, ChatProps>();

  let threads: Array<ThreadProps> = $state([]);
  let currentThreadId = $state<number | null>(null);

  data.threads.then((resolvedThreads) => {
    threads = resolvedThreads;
  });

  setContext('threads', {
    threadChats,
    archiveThread: (id: number) => {
      let thread = threads.filter((t) => t.id == id)[0];
      thread.is_closed = true;
      ThreadApi.archiveThread({ id }).catch(() => {
        thread.is_closed = false;
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
    getCurrentThread: () => {
      return threads.filter((t) => t.id == currentThreadId)[0];
    },
    setCurrentThread: (id: number) => {
      currentThreadId = id;
    },
    renameThread: (id: number, title: string) => {
      let thread = threads.filter((t) => t.id == id)[0];
      const oldThreadTitle = thread.title;
      thread.title = title;
      ThreadApi.updateThread({ id, title, type: thread.type }).catch(() => {
        thread.title = oldThreadTitle;
      });
    }
  });

  let isThreadCreateModalOpen = $state(false);
</script>

<Navbar />
<div class="fixed inset-0 top-16 flex flex-row">
  <SpoolDock spools={data.spools} />
  <div class="flex w-72 flex-shrink-0 flex-col gap-6 p-4 pt-3 pr-3">
    <Button
      variant="outline"
      class="cursor-pointer"
      onclick={() => {
        isThreadCreateModalOpen = true;
      }}
    >
      New thread
    </Button>
    {#if threads.length == 0}
      <p class="text-gray-600">Loading threads...</p>
    {:else}
      <ThreadListSection
        title="Private"
        entries={threads.filter((t) => !t.is_closed && t.type == 'private')}
        expanded={true}
      />
      <ThreadListSection
        title="Public"
        entries={threads.filter((t) => !t.is_closed && t.type == 'public')}
        expanded={true}
      />
      <ThreadListSection
        title="History"
        entries={threads.filter((t) => t.is_closed)}
        expanded={false}
      />
    {/if}
    <ModalThreadCreate bind:isOpen={isThreadCreateModalOpen} />
  </div>
  <div class="flex w-full flex-col">
    <div class="h-full rounded-bl-2xl bg-white">
      {#if currentThreadId}
        <Chat />
      {:else}
        <div class="flex h-full items-center justify-center text-gray-500">
          Select a thread to start chatting
        </div>
      {/if}
    </div>
    <div class="h-20"></div>
  </div>
</div>
