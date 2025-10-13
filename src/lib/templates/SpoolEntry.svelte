<script lang="ts">
  import { resolve } from '$app/paths';
  import type { ContextMenuEntry, SpoolProps } from '$lib/types';
  import { openContextMenuHandler } from './ContextMenu.svelte';
  import ModalSpoolLeave from './ModalSpoolLeave.svelte';

  const thisProps: SpoolProps = $props();
  const { id, name, banner_link }: SpoolProps = thisProps;

  let isSpoolLeaveModalOpen = $state(false);

  const contextMenuEntries: Array<ContextMenuEntry> = [
    {
      type: 'neutral',
      label: 'Rename',
      onClick: () => {
        alert('Rename spool');
      }
    },
    {
      type: 'danger',
      label: 'Leave',
      onClick: () => {
        isSpoolLeaveModalOpen = true;
      }
    }
  ];
</script>

<a
  class="spool-entry"
  href={resolve(`/spools/${id}`)}
  oncontextmenu={openContextMenuHandler(contextMenuEntries)}
>
  <img class="banner" src={banner_link} alt={name} />
  <p class="title">{name}</p>
</a>
<ModalSpoolLeave spoolProps={thisProps} bind:isOpen={isSpoolLeaveModalOpen} />

<style>
  .spool-entry {
    width: 3rem;
    height: 3rem;
    display: flex;
    flex-direction: row;
    align-items: center;
    text-decoration: none;
  }

  .banner {
    width: 100%;
    height: 100%;
    flex-shrink: 0;
    background-color: var(--active-secondary);
    border-radius: var(--border-radius-large);
    z-index: 2;
  }

  .title {
    margin-left: -1rem;
    padding: var(--m-2) var(--m-3);
    padding-left: calc(var(--m-3) + 1rem);
    flex-shrink: 0;
    background-color: var(--bg-primary);
    border-top-right-radius: var(--border-radius-small);
    border-bottom-right-radius: var(--border-radius-small);
    border: solid var(--border-width) var(--bg-primary-dark);
    visibility: hidden;
    pointer-events: none;
    z-index: 1;
  }

  .spool-entry:hover .title {
    visibility: visible;
    pointer-events: all;
  }
</style>
