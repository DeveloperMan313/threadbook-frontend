<script lang="ts">
  import type { ContextMenuEntry, ThreadProps } from '$lib/types';
  import ModalThreadArchive from './ModalThreadArchive.svelte';
  import ModalThreadRename from './ModalThreadRename.svelte';
  import * as ContextMenu from '$lib/components/ui/context-menu/index.js';
  import { getContext } from 'svelte';

  let { id, title, unreadCnt, mentionCnt }: ThreadProps = $props();

  const { setCurrentThreadId } = getContext('threads') as {
    setCurrentThreadId: { (id: number): void };
  };

  let isThreadRenameModalOpen = $state(false);
  let isThreadArchiveModalOpen = $state(false);

  const contextMenuEntries: Array<ContextMenuEntry> = [
    {
      type: 'neutral',
      label: 'Rename',
      onSelect: () => {
        isThreadRenameModalOpen = true;
      }
    },
    {
      type: 'danger',
      label: 'Archive',
      onSelect: () => {
        isThreadArchiveModalOpen = true;
      }
    }
  ];
</script>

<ContextMenu.Root>
  <ContextMenu.Trigger>
    <button
      class="flex h-6 w-full cursor-pointer items-center justify-between rounded border-none bg-white px-3 transition-colors duration-200 hover:bg-amber-100 active:bg-amber-200"
      onclick={() => setCurrentThreadId(id)}
    >
      <p class="truncate text-base">{title}</p>
      <div class="flex items-center gap-2">
        {#if mentionCnt > 0}
          <p
            class="flex h-4 w-4 items-center justify-center rounded bg-emerald-400 text-xs text-white"
          >
            {mentionCnt}
          </p>
        {/if}
        {#if unreadCnt > 0}
          <p class="text-sm text-gray-600">{unreadCnt}</p>
        {/if}
      </div>
    </button>
  </ContextMenu.Trigger>
  <ContextMenu.Content class="min-w-[10rem]">
    {#each contextMenuEntries as entry (entry.label)}
      <ContextMenu.Item
        class={entry.type === 'danger' ? 'text-destructive focus:text-destructive' : ''}
        onSelect={entry.onSelect}
      >
        {entry.label}
      </ContextMenu.Item>
    {/each}
  </ContextMenu.Content>
</ContextMenu.Root>
<ModalThreadRename threadId={id} threadTitle={title} bind:isOpen={isThreadRenameModalOpen} />
<ModalThreadArchive threadId={id} threadTitle={title} bind:isOpen={isThreadArchiveModalOpen} />
