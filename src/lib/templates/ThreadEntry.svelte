<script lang="ts">
  import type { ContextMenuEntry, ThreadEntryProps } from '$lib/types';
  import { openContextMenuHandler } from './ContextMenu.svelte';
  import ModalThreadArchive from './ModalThreadArchive.svelte';
  import ModalThreadRename from './ModalThreadRename.svelte';

  let { id, title, unreadCnt, mentionCnt }: ThreadEntryProps = $props();

  let isThreadRenameModalOpen = $state(false);
  let isThreadArchiveModalOpen = $state(false);

  const contextMenuEntries: Array<ContextMenuEntry> = [
    {
      type: 'neutral',
      label: 'Rename',
      onClick: () => {
        isThreadRenameModalOpen = true;
      }
    },
    {
      type: 'danger',
      label: 'Archive',
      onClick: () => {
        isThreadArchiveModalOpen = true;
      }
    }
  ];
</script>

<button
  class="flex h-6 cursor-pointer items-center justify-between rounded border-none bg-white px-3 transition-colors duration-200 hover:bg-amber-100 active:bg-amber-200"
  oncontextmenu={openContextMenuHandler(contextMenuEntries)}
>
  <p class="truncate text-base">{title}</p>
  <div class="flex items-center gap-2">
    {#if mentionCnt > 0}
      <p class="flex h-4 w-4 items-center justify-center rounded bg-emerald-400 text-xs text-white">
        {mentionCnt}
      </p>
    {/if}
    {#if unreadCnt > 0}
      <p class="text-sm text-gray-600">{unreadCnt}</p>
    {/if}
  </div>
</button>
<ModalThreadRename threadId={id} threadTitle={title} bind:isOpen={isThreadRenameModalOpen} />
<ModalThreadArchive threadId={id} threadTitle={title} bind:isOpen={isThreadArchiveModalOpen} />
