<script lang="ts">
  import { resolve } from '$app/paths';
  import type { ContextMenuEntry, SpoolProps } from '$lib/types';
  import ModalSpoolLeave from './ModalSpoolLeave.svelte';
  import * as ContextMenu from '$lib/components/ui/context-menu/index.js';
  import * as Avatar from '$lib/components/ui/avatar/index.js';
  import { ImageApi } from '$lib/api';

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
    <a href={resolve(`/spools/${id}`)}>
      <Avatar.Root class="size-12 rounded-2xl">
        {#if banner_link}
          <Avatar.Image src={ImageApi.getSpoolBannerURL(banner_link)} alt={name} />
        {/if}
        <Avatar.Fallback class="rounded-2xl">{name[0].toUpperCase()}</Avatar.Fallback>
      </Avatar.Root>
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
