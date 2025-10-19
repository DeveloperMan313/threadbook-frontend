<script lang="ts">
  import type { ModalThreadCreateProps, ThreadType } from '$lib/types';
  import { getContext } from 'svelte';
  import Button from './Button.svelte';
  import InputField from './InputField.svelte';
  import Modal from './Modal.svelte';

  let { isOpen = $bindable() }: ModalThreadCreateProps = $props();

  let threadTitle = $state('');
  let threadType: ThreadType = $state('public');
  let titleIsValid = $state(false);

  const { createThread } = getContext('threads') as {
    createThread: { (title: string, type: ThreadType): void };
  };

  const onCreateClick = () => {
    isOpen = false;
    createThread(threadTitle, threadType);
  };
</script>

<Modal title="New thread" bind:isOpen>
  {#snippet body()}
    <div class="mt-6 flex gap-3">
      <InputField
        type="text"
        getError={(value) => (value.trim() === '' ? 'Title cannot be empty' : null)}
        bind:value={threadTitle}
        bind:isValid={titleIsValid}
        label="Thread title"
        placeholder="Enter title"
      />
      <InputField
        type="text"
        getError={(value) => (value.trim() === '' ? 'Type cannot be empty' : null)}
        bind:value={threadType}
        bind:isValid={titleIsValid}
        label="Thread type"
        placeholder="Choose type"
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
    <Button type="primary" label="Create" onClick={onCreateClick} disabled={!titleIsValid}></Button>
  {/snippet}
</Modal>
