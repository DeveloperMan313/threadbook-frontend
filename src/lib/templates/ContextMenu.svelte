<script module lang="ts">
  import { mount, unmount } from 'svelte';
  import ContextMenu from './ContextMenu.svelte';

  export const openContextMenuHandler = (contextMenuEntries: Array<ContextMenuEntry>) => {
    return (event: MouseEvent) => {
      event.preventDefault();
      let contextMenu: ContextMenu;
      const props: ContextMenuProps = {
        posXpx: event.clientX,
        posYpx: event.clientY,
        entries: contextMenuEntries,
        onClose: () => {
          unmount(contextMenu);
        }
      };
      contextMenu = mount(ContextMenu, { target: document.body, props });
    };
  };
</script>

<script lang="ts">
  import type { ContextMenuEntry, ContextMenuProps } from '$lib/types';

  let { posXpx, posYpx, entries, onClose }: ContextMenuProps = $props();

  const onEntryClick = (entry: ContextMenuEntry) => {
    return (event: MouseEvent) => {
      onClose();
      entry.onClick(event);
    };
  };
</script>

<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
<div class="backdrop" onclick={onClose}>
  <div
    class="context-menu"
    onclick={(event: MouseEvent) => {
      event.stopPropagation();
    }}
    style="left: {posXpx}px; top: {posYpx}px;"
  >
    {#each entries as entry (entry.label)}
      <button class="entry {entry.type}" onclick={onEntryClick(entry)}>{entry.label}</button>
    {/each}
  </div>
</div>

<style>
  .backdrop {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 1000;
  }

  .context-menu {
    position: absolute;
    padding: var(--m-2);
    display: flex;
    flex-direction: column;
    background-color: var(--bg-primary);
    border: solid var(--border-width) var(--bg-primary-dark);
    border-radius: var(--border-radius-small);
  }

  .entry {
    width: fit-content;
    min-width: 10rem;
    height: var(--button-height);
    padding: 0 var(--m-3);
    border-radius: var(--border-radius-small);
    background-color: var(--bg-default);
    text-align: left;
    border: none;
    cursor: pointer;

    --bg-default: var(--bg-primary);
    --bg-dark: var(--bg-primary-dark);
  }

  .entry.danger {
    color: var(--active-secondary);
  }

  .entry:hover {
    background-color: color-mix(in srgb, var(--bg-default), var(--bg-dark));
  }

  .entry:active {
    background-color: var(--bg-dark);
  }
</style>
