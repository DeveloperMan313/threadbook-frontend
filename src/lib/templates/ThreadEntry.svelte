<script lang="ts">
  import type { ContextMenuEntry, ThreadEntryProps } from '$lib/types';
  import { openContextMenuHandler } from './ContextMenu.svelte';
  import ModalThreadDelete from './ModalThreadDelete.svelte';

  const thisProps: ThreadEntryProps = $props();
  const { title, unreadCnt, mentionCnt }: ThreadEntryProps = thisProps;

  let isThreadDeleteModalOpen = $state(false);

  const contextMenuEntries: Array<ContextMenuEntry> = [
    {
      type: 'neutral',
      label: 'Rename',
      onClick: () => {
        alert('Rename thread');
      }
    },
    {
      type: 'danger',
      label: 'Delete',
      onClick: () => {
        isThreadDeleteModalOpen = true;
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
<ModalThreadDelete threadEntryProps={thisProps} bind:isOpen={isThreadDeleteModalOpen} />

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
