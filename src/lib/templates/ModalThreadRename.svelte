<script lang="ts">
  import type { ModalThreadRenameProps } from '$lib/types';
  import { getContext } from 'svelte';
  import Button from './Button.svelte';
  import InputField from './InputField.svelte';
  import Modal from './Modal.svelte';

  let { threadId, threadTitle, isOpen = $bindable() }: ModalThreadRenameProps = $props();

  let newThreadTitle = $state(threadTitle);
  let newTitleIsValid = $state(true);

  $effect(() => {
    if (isOpen) {
      newThreadTitle = threadTitle;
      newTitleIsValid = true;
    }
  });

  const { renameThread } = getContext('threads') as {
    renameThread: { (id: number, title: string): void };
  };

  const onRenameClick = () => {
    isOpen = false;
    renameThread(threadId, newThreadTitle);
  };
</script>

<Modal title="Rename thread" bind:isOpen>
  {#snippet body()}
    <div class="mt-6">
      <InputField
        type="text"
        getError={(value) => (value.trim() === '' ? 'Title cannot be empty' : null)}
        bind:value={newThreadTitle}
        bind:isValid={newTitleIsValid}
        label="New thread title"
        placeholder="Enter new title"
      />
    </div>
  {/snippet}

  {#snippet buttons()}
    <Button
      type="neutral"
      label="Cancel"
      onClick={() => {
        isOpen = false;
      }}
    ></Button>
    <Button type="primary" label="Rename" onClick={onRenameClick} disabled={!newTitleIsValid}
    ></Button>
  {/snippet}
</Modal>
