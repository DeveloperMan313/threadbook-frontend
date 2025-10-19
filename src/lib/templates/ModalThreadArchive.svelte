<script lang="ts">
  import type { ModalThreadArchiveProps } from '$lib/types';
  import { getContext } from 'svelte';
  import { Button } from '$lib/components/ui/button/index.js';
  import * as Dialog from '$lib/components/ui/dialog/index.js';

  let { threadId, threadTitle, isOpen = $bindable() }: ModalThreadArchiveProps = $props();

  const { archiveThread } = getContext('threads') as {
    archiveThread: { (id: number): void };
  };

  const onArchiveClick = () => {
    isOpen = false;
    archiveThread(threadId);
  };

  const onCancel = () => {
    isOpen = false;
  };
</script>

<Dialog.Root bind:open={isOpen}>
  <Dialog.Content class="sm:max-w-[425px]">
    <Dialog.Header>
      <Dialog.Title>Archive thread</Dialog.Title>
      <Dialog.Description>
        Are you sure you want to archive "{threadTitle}"? This action cannot be undone.
      </Dialog.Description>
    </Dialog.Header>
    <Dialog.Footer>
      <Button variant="outline" class="cursor-pointer" onclick={onCancel}>Cancel</Button>
      <Button variant="destructive" class="cursor-pointer" onclick={onArchiveClick}>Archive</Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
