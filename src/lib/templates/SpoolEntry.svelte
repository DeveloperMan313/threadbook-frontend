<script lang="ts">
  import { resolve } from '$app/paths';
  import type { ContextMenuEntry, SpoolProps } from '$lib/types';
  import ModalSpoolLeave from './ModalSpoolLeave.svelte';
  import * as ContextMenu from '$lib/components/ui/context-menu/index.js';

  const { id, name, banner_link }: SpoolProps = $props();

  let isSpoolLeaveModalOpen = $state(false);

  const contextMenuEntries: Array<ContextMenuEntry> = [
    {
      type: 'danger',
      label: 'Leave',
      onSelect: () => {
        isSpoolLeaveModalOpen = true;
      }
    }
  ];
</script>

<ContextMenu.Root>
  <ContextMenu.Trigger>
    <a class="flex h-12 w-12 items-center no-underline" href={resolve(`/spools/${id}`)}>
      <img class="h-12 w-12 flex-shrink-0 rounded-2xl bg-primary" src={banner_link} alt={name} />
    </a>
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
<ModalSpoolLeave spoolId={id} spoolName={name} bind:isOpen={isSpoolLeaveModalOpen} />
