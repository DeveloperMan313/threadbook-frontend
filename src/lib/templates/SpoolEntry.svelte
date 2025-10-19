<script lang="ts">
  import { resolve } from '$app/paths';
  import type { ContextMenuEntry, SpoolProps } from '$lib/types';
  import { openContextMenuHandler } from './ContextMenu.svelte';
  import ModalSpoolLeave from './ModalSpoolLeave.svelte';

  const { id, name, banner_link }: SpoolProps = $props();

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
  class="flex h-12 w-12 items-center no-underline"
  href={resolve(`/spools/${id}`)}
  oncontextmenu={openContextMenuHandler(contextMenuEntries)}
>
  <img class="h-12 w-12 flex-shrink-0 rounded-2xl bg-orange-400" src={banner_link} alt={name} />
  <p
    class="pointer-events-none invisible -ml-4 flex-shrink-0 rounded-r border-2 border-amber-200 bg-white px-3 py-2 pl-5 text-base font-normal transition-all hover:pointer-events-auto hover:visible"
  >
    {name}
  </p>
</a>
<ModalSpoolLeave spoolId={id} spoolName={name} bind:isOpen={isSpoolLeaveModalOpen} />
