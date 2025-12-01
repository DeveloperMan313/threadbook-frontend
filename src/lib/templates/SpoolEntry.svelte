<script lang="ts">
  import { resolve } from '$app/paths';
  import type { SpoolProps } from '$lib/types';
  import ModalSpoolLeave from './ModalSpoolLeave.svelte';
  import * as ContextMenu from '$lib/components/ui/context-menu/index.js';
  import * as Avatar from '$lib/components/ui/avatar/index.js';
  import { ImageApi } from '$lib/api';
  import { page } from '$app/state';
  import ModalSpoolEdit from './ModalSpoolEdit.svelte';
  import ModalInviteUsersToSpool from './ModalInviteUsersToSpool.svelte';

  const { id, name, banner_link }: SpoolProps = $props();
  const currentSpoolId = $derived<number>(page.data.spoolId);

  let isInviteUsersToSpoolModalOpen = $state(false);
  let isSpoolLeaveModalOpen = $state(false);
  let isSpoolUpdateModalOpen = $state(false);
</script>

<ContextMenu.Root>
  <ContextMenu.Trigger>
    <a href={resolve(`/spools/${id}`, {})}>
      <Avatar.Root
        class={`size-12 rounded-2xl ring-muted-foreground transition-shadow ${id === currentSpoolId ? 'ring-4' : 'hover:ring-2'}`}
      >
        {#if banner_link}
          <Avatar.Image src={ImageApi.getSpoolBannerURL(banner_link)} alt={name} />
        {/if}
        <Avatar.Fallback class="rounded-2xl">{name[0].toUpperCase()}</Avatar.Fallback>
      </Avatar.Root>
    </a>
  </ContextMenu.Trigger>
  <ContextMenu.Content class="w-52">
    <ContextMenu.Item
      class="cursor-pointer"
      variant="default"
      onclick={() => {
        isInviteUsersToSpoolModalOpen = true;
      }}>Invite users</ContextMenu.Item
    >
    <ContextMenu.Item
      class="cursor-pointer"
      variant="default"
      onclick={() => {
        isSpoolUpdateModalOpen = true;
      }}>Edit</ContextMenu.Item
    >
    <ContextMenu.Item
      class="cursor-pointer"
      variant="destructive"
      onclick={() => {
        isSpoolLeaveModalOpen = true;
      }}>Leave</ContextMenu.Item
    >
  </ContextMenu.Content>
</ContextMenu.Root>
<ModalInviteUsersToSpool spoolId={id} bind:isOpen={isInviteUsersToSpoolModalOpen} />
<ModalSpoolEdit spoolId={id} bind:isOpen={isSpoolUpdateModalOpen} />
<ModalSpoolLeave spoolId={id} bind:isOpen={isSpoolLeaveModalOpen} />
