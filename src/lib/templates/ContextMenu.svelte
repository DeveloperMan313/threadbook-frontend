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
<div class="fixed inset-0 z-50" onclick={onClose}>
  <div
    class="absolute flex flex-col rounded border-2 border-amber-200 bg-white p-2"
    style="left: {posXpx}px; top: {posYpx}px;"
    onclick={(event: MouseEvent) => {
      event.stopPropagation();
    }}
  >
    {#each entries as entry (entry.label)}
      <button
        class="h-9 min-w-[10rem] cursor-pointer rounded border-none px-3 text-left transition-colors duration-200 hover:bg-amber-100 active:bg-amber-200 {entry.type ===
        'danger'
          ? 'text-orange-400'
          : ''}"
        onclick={onEntryClick(entry)}
      >
        {entry.label}
      </button>
    {/each}
  </div>
</div>
