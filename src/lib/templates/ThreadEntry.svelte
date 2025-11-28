<script lang="ts">
  import type { ThreadProps } from '$lib/types';
  import ModalThreadClose from './ModalThreadClose.svelte';
  import ModalThreadRename from './ModalThreadRename.svelte';
  import * as ContextMenu from '$lib/components/ui/context-menu/index.js';
  import { getContext } from 'svelte';
  import Button from '$lib/components/ui/button/button.svelte';
  import { Phone, UserPlus } from '@lucide/svelte';
  import ModalInviteUsersToThread from './ModalInviteUsersToThread.svelte';
  import { stateVoiceThreadId } from '$lib/states';

  let { id, title, type, unreadCnt, mentionCnt }: ThreadProps = $props();

  const { setCurrentThreadId, getCurrentThreadId } = getContext('threads') as {
    setCurrentThreadId: { (id: number): void };
    getCurrentThreadId: () => number | null;
  };

  let isThreadRenameModalOpen = $state(false);
  let isThreadCloseModalOpen = $state(false);
  let isInviteUsersToThreadModalOpen = $state(false);
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
        {#if type === 'private'}
          <Button
            variant="ghost"
            class="z-10 aspect-square h-full cursor-pointer text-muted-foreground opacity-0 duration-[0] group-hover:opacity-100 group-hover:duration-200"
            onclick={() => {
              isInviteUsersToThreadModalOpen = true;
            }}
          >
            <UserPlus />
          </Button>
        {/if}
        <Button
          variant="ghost"
          class="z-10 aspect-square h-full cursor-pointer text-muted-foreground opacity-0 duration-[0] group-hover:opacity-100 group-hover:duration-200"
          onclick={() => {
            stateVoiceThreadId.id = id;
          }}
        >
          <Phone />
        </Button>
      </div>
    </div>
  </ContextMenu.Trigger>
  <ContextMenu.Content class="w-52">
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
  </ContextMenu.Content>
</ContextMenu.Root>
<ModalThreadRename threadId={id} threadTitle={title} bind:isOpen={isThreadRenameModalOpen} />
<ModalThreadClose threadId={id} threadTitle={title} bind:isOpen={isThreadCloseModalOpen} />
<ModalInviteUsersToThread
  threadId={id}
  threadTitle={title}
  bind:isOpen={isInviteUsersToThreadModalOpen}
/>
