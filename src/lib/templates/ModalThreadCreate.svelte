<script lang="ts">
  import type { ModalThreadCreateProps, ThreadType } from '$lib/types';
  import { getContext } from 'svelte';
  import { Button } from '$lib/components/ui/button/index.js';
  import { Label } from '$lib/components/ui/label/index.js';
  import * as Dialog from '$lib/components/ui/dialog/index.js';
  import * as Select from '$lib/components/ui/select/index.js';
  import InputField from './InputField.svelte';
  import { threadTitleGetError } from '$lib/validation';

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

  const onCancel = () => {
    isOpen = false;
  };

  $effect(() => {
    if (isOpen) {
      threadTitle = '';
      threadType = 'public';
      titleIsValid = false;
    }
  });

  const triggerContent = $derived(threadType === 'public' ? 'Public' : 'Private');
</script>

<Dialog.Root bind:open={isOpen}>
  <Dialog.Content class="sm:max-w-[425px]">
    <Dialog.Header>
      <Dialog.Title>New thread</Dialog.Title>
      <Dialog.Description>Create a new thread in this spool.</Dialog.Description>
    </Dialog.Header>
    <InputField
      type="text"
      getError={threadTitleGetError}
      bind:value={threadTitle}
      bind:isValid={titleIsValid}
      label="Title"
      placeholder="Enter thread title"
    />
    <div class="flex w-full max-w-sm flex-col gap-1.5">
      <Label for="thread-type" class="text-right">Type</Label>
      <Select.Root type="single" bind:value={threadType}>
        <Select.Trigger id="thread-type" class="w-full">
          {triggerContent}
        </Select.Trigger>
        <Select.Content>
          <Select.Item value="public" label="Public">Public</Select.Item>
          <Select.Item value="private" label="Private">Private</Select.Item>
        </Select.Content>
      </Select.Root>
    </div>
    <Dialog.Footer>
      <Button variant="outline" class="cursor-pointer" onclick={onCancel}>Cancel</Button>
      <Button class="cursor-pointer" onclick={onCreateClick} disabled={!titleIsValid}>Create</Button
      >
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
