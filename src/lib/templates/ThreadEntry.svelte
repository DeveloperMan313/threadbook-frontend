<script lang="ts">
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
  import type { ThreadProps } from '$lib/types';
  import ModalThreadClose from './ModalThreadClose.svelte';
  import ModalThreadRename from './ModalThreadRename.svelte';
  import * as ContextMenu from '$lib/components/ui/context-menu/index.js';
  import { getContext } from 'svelte';
  import Button from '$lib/components/ui/button/button.svelte';
  import { EllipsisVertical, Phone } from '@lucide/svelte';
  import ModalInviteUsersToThread from './ModalInviteUsersToThread.svelte';
  import { stateSpoolsGetCurrentAccessLevel, stateVoiceThreadId } from '$lib/states';
  import ModalThreadInviteLinkCreate from './ModalThreadInviteLinkCreate.svelte';

  let { id, title, access_level, type, unreadCnt, mentionCnt }: ThreadProps = $props();

  const { setCurrentThreadId, getCurrentThreadId } = getContext('threads') as {
    setCurrentThreadId: { (id: number): void };
    getCurrentThreadId: () => number | null;
  };

  const userAccessLevel = $derived(stateSpoolsGetCurrentAccessLevel());

  let isThreadRenameModalOpen = $state(false);
  let isThreadCloseModalOpen = $state(false);
  let isInviteUsersToThreadModalOpen = $state(false);
  let isThreadInviteLinkCreateModalOpen = $state(false);
</script>

<ContextMenu.Root>
  <ContextMenu.Trigger>
    <div
      class="group relative flex h-8 w-full cursor-pointer items-center justify-end overflow-visible rounded border-none p-0"
    >
      <Button
        variant="outline"
        class={`absolute h-full w-full cursor-pointer p-0 ${id === getCurrentThreadId() ? 'bg-accent' : ''}`}
        onclick={() => setCurrentThreadId(id)}
        ><p
          class={`w-full truncate ps-3 text-start text-base ${type === 'private' ? 'group-hover:pe-16' : 'group-hover:pe-8'}`}
        >
          {title}
        </p></Button
      >
      <div class="flex h-full items-center justify-end">
        {#if mentionCnt > 0}
          <p
            class="flex h-4 w-4 items-center justify-center rounded bg-emerald-400 text-xs text-white"
          >
            {mentionCnt}
          </p>
        {/if}
        {#if unreadCnt > 0}
          <p class="text-sm text-gray-600">{unreadCnt}</p>
        {/if}
        {#if type === 'private' || userAccessLevel > access_level}
          <DropdownMenu.Root>
            <DropdownMenu.Trigger>
              {#snippet child({ props })}
                <Button
                  {...props}
                  variant="ghost"
                  class="z-10 aspect-square h-full cursor-pointer text-muted-foreground opacity-0 duration-[0] group-hover:opacity-100 group-hover:duration-200 [@media(hover:none)]:opacity-100"
                >
                  <EllipsisVertical />
                </Button>
              {/snippet}
            </DropdownMenu.Trigger>
            <DropdownMenu.Content class="w-52" align="start">
              {#if type === 'private'}
                <DropdownMenu.Item
                  class="cursor-pointer"
                  onclick={() => {
                    isInviteUsersToThreadModalOpen = true;
                  }}
                >
                  Invite users</DropdownMenu.Item
                >
                <DropdownMenu.Item
                  class="cursor-pointer"
                  onclick={() => {
                    isThreadInviteLinkCreateModalOpen = true;
                  }}
                >
                  Create invite link</DropdownMenu.Item
                >
              {/if}
              {#if userAccessLevel > access_level}
                <DropdownMenu.Item
                  class="cursor-pointer"
                  onclick={() => {
                    isThreadRenameModalOpen = true;
                  }}
                >
                  Rename</DropdownMenu.Item
                >
                <DropdownMenu.Item
                  class="cursor-pointer"
                  variant="destructive"
                  onclick={() => {
                    isThreadCloseModalOpen = true;
                  }}
                >
                  Close</DropdownMenu.Item
                >
              {/if}
            </DropdownMenu.Content>
          </DropdownMenu.Root>
        {/if}
        <Button
          variant="ghost"
          class="z-10 aspect-square h-full cursor-pointer text-muted-foreground opacity-0 duration-[0] group-hover:opacity-100 group-hover:duration-200 [@media(hover:none)]:opacity-100"
          onclick={() => {
            stateVoiceThreadId.id = id;
          }}
        >
          <Phone />
        </Button>
      </div>
    </div>
  </ContextMenu.Trigger>
  {#if type === 'private' || userAccessLevel > access_level}
    <ContextMenu.Content class="w-52">
      {#if type === 'private'}
        <ContextMenu.Item
          class="cursor-pointer"
          variant="default"
          onclick={() => {
            isInviteUsersToThreadModalOpen = true;
          }}>Invite users</ContextMenu.Item
        >
        <ContextMenu.Item
          class="cursor-pointer"
          variant="default"
          onclick={() => {
            isThreadInviteLinkCreateModalOpen = true;
          }}>Create invite link</ContextMenu.Item
        >
      {/if}
      {#if userAccessLevel > access_level}
        <ContextMenu.Item
          class="cursor-pointer"
          variant="default"
          onclick={() => {
            isThreadRenameModalOpen = true;
          }}>Rename</ContextMenu.Item
        >
        <ContextMenu.Item
          class="cursor-pointer"
          variant="destructive"
          onclick={() => {
            isThreadCloseModalOpen = true;
          }}>Close</ContextMenu.Item
        >
      {/if}
    </ContextMenu.Content>
  {/if}
</ContextMenu.Root>
<ModalInviteUsersToThread
  threadId={id}
  threadTitle={title}
  bind:isOpen={isInviteUsersToThreadModalOpen}
/>
<ModalThreadInviteLinkCreate
  threadId={id}
  threadTitle={title}
  bind:isOpen={isThreadInviteLinkCreateModalOpen}
/>
<ModalThreadRename threadId={id} threadTitle={title} bind:isOpen={isThreadRenameModalOpen} />
<ModalThreadClose threadId={id} threadTitle={title} bind:isOpen={isThreadCloseModalOpen} />
