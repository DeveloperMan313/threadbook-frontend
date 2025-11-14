<script lang="ts">
  import type { ContextMenuEntry, ThreadProps } from '$lib/types';
  import ModalThreadClose from './ModalThreadClose.svelte';
  import ModalThreadRename from './ModalThreadRename.svelte';
  import * as ContextMenu from '$lib/components/ui/context-menu/index.js';
  import { getContext } from 'svelte';
  import Button from '$lib/components/ui/button/button.svelte';
  import { Phone, UserPlus } from '@lucide/svelte';
  import ModalInviteUsersToThread from './ModalInviteUsersToThread.svelte';
  import { voiceThreadId } from '$lib/writables';

  let { id, title, type, unreadCnt, mentionCnt }: ThreadProps = $props();

  const { setCurrentThreadId } = getContext('threads') as {
    setCurrentThreadId: { (id: number): void };
  };

  let isThreadRenameModalOpen = $state(false);
  let isThreadCloseModalOpen = $state(false);
  let isInviteUsersToThreadModalOpen = $state(false);

  const contextMenuEntries: Array<ContextMenuEntry> = [
    {
      type: 'neutral',
      label: 'Rename',
      onSelect: () => {
        isThreadRenameModalOpen = true;
      }
    },
    {
      type: 'danger',
      label: 'Close',
      onSelect: () => {
        isThreadCloseModalOpen = true;
      }
    }
  ];
</script>

<ContextMenu.Root>
  <ContextMenu.Trigger>
    <div
      class="group relative flex h-8 w-full cursor-pointer items-center justify-end overflow-visible rounded border-none p-0"
    >
      <Button
        variant="outline"
        class="absolute h-full w-full cursor-pointer p-0"
        onclick={() => setCurrentThreadId(id)}
        ><p class="w-full ps-3 text-start text-base">
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
        {#if type == 'private'}
          <Button
            variant="ghost"
            class="z-10 aspect-square h-full cursor-pointer opacity-0 group-hover:opacity-100"
            onclick={() => {
              isInviteUsersToThreadModalOpen = true;
            }}
          >
            <UserPlus />
          </Button>
        {/if}
        <Button
          variant="ghost"
          class="z-10 aspect-square h-full cursor-pointer opacity-0 group-hover:opacity-100"
          onclick={() => {
            $voiceThreadId = id;
          }}
        >
          <Phone />
        </Button>
      </div>
    </div>
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
<ModalThreadRename threadId={id} threadTitle={title} bind:isOpen={isThreadRenameModalOpen} />
<ModalThreadClose threadId={id} threadTitle={title} bind:isOpen={isThreadCloseModalOpen} />
<ModalInviteUsersToThread
  threadId={id}
  threadTitle={title}
  bind:isOpen={isInviteUsersToThreadModalOpen}
/>
