<script lang="ts">
  import type { ModalThreadRenameProps } from '$lib/types';
  import { getContext } from 'svelte';
  import { Button } from '$lib/components/ui/button/index.js';
  import * as Dialog from '$lib/components/ui/dialog/index.js';
  import { threadTitleGetError } from '$lib/validation';
  import InputField from './InputField.svelte';

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

  const onSaveClick = () => {
    isOpen = false;
    renameThread(threadId, newThreadTitle);
  };

  const onCancel = () => {
    isOpen = false;
  };
</script>

<Dialog.Root bind:open={isOpen}>
  <Dialog.Content class="sm:max-w-[425px]">
    <Dialog.Header>
      <Dialog.Title>Rename thread</Dialog.Title>
      <Dialog.Description>Enter a new title for this thread.</Dialog.Description>
    </Dialog.Header>
    <InputField
      type="text"
      getError={threadTitleGetError}
      bind:value={newThreadTitle}
      bind:isValid={newTitleIsValid}
      placeholder="Enter new title"
    />
    <Dialog.Footer>
      <Button variant="outline" class="cursor-pointer" onclick={onCancel}>Cancel</Button>
      <Button class="cursor-pointer" onclick={onSaveClick} disabled={!newTitleIsValid}>Save</Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
