<script lang="ts">
  import type { ModalThreadArchiveProps } from '$lib/types';
  import { getContext } from 'svelte';
  import Button from './Button.svelte';
  import Modal from './Modal.svelte';

  let { threadId, threadTitle, isOpen = $bindable() }: ModalThreadArchiveProps = $props();

  const { archiveThread } = getContext('threads') as {
    archiveThread: { (id: number): void };
  };

  const onArchiveClick = () => {
    isOpen = false;
    archiveThread(threadId);
  };
</script>

<Modal title="Archive thread" bind:isOpen>
  {#snippet body()}
    <p>Are you sure you want to archive "{threadTitle}"? This action cannot be undone.</p>
  {/snippet}

  {#snippet buttons()}
    <Button
      type="neutral"
      label="Cancel"
      onClick={() => {
        isOpen = false;
      }}
    ></Button>
    <Button type="danger" label="Archive" onClick={onArchiveClick}></Button>
  {/snippet}
</Modal>
