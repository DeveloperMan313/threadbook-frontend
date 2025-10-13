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

<button class="thread-entry" oncontextmenu={openContextMenuHandler(contextMenuEntries)}>
  <p class="title">{title}</p>
  <div class="info">
    {#if mentionCnt > 0}
      <p class="mention-cnt">{mentionCnt}</p>
    {/if}
    {#if unreadCnt > 0}
      <p class="unread-cnt">{unreadCnt}</p>
    {/if}
  </div>
</button>
<ModalThreadRename threadId={id} threadTitle={title} bind:isOpen={isThreadRenameModalOpen} />
<ModalThreadArchive threadId={id} threadTitle={title} bind:isOpen={isThreadArchiveModalOpen} />

<style>
  .thread-entry {
    height: var(--m-4);
    padding: var(--m-3);
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    background-color: var(--bg-default);
    border: none;
    border-radius: var(--border-radius-small);
    cursor: pointer;

    --bg-default: var(--bg-primary);
    --bg-dark: var(--bg-primary-dark);
  }

  .thread-entry:hover {
    background-color: color-mix(in srgb, var(--bg-default), var(--bg-dark));
  }

  .thread-entry:active {
    background-color: var(--bg-dark);
  }

  .info {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: var(--m-2);
  }

  .mention-cnt {
    width: var(--font-small);
    height: var(--font-small);
    color: var(--text-inverted);
    background-color: var(--active-primary);
    border-radius: var(--border-radius-small);
    text-align: center;
  }

  .unread-cnt {
    color: var(--text-secondary);
  }
</style>
