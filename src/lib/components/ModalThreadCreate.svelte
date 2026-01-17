<script lang="ts">
  import type { ModalThreadCreateProps, ThreadType } from '$lib/types';
  import { getContext } from 'svelte';
  import { Button } from '$lib/components/ui/button/index.js';
  import * as Dialog from '$lib/components/ui/dialog/index.js';
  import InputField from './InputField.svelte';
  import { threadTitleGetError } from '$lib/validation';
  import * as m from '$lib/paraglide/messages';

  let { isOpen = $bindable(), threadType }: ModalThreadCreateProps = $props();

  let threadTitle = $state('');
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
      titleIsValid = false;
    }
  });
</script>

<Dialog.Root bind:open={isOpen}>
  <Dialog.Content class="sm:max-w-[425px]">
    <Dialog.Header>
      <Dialog.Title>{m.new_thread({ threadType })}</Dialog.Title>
      <Dialog.Description>{m.create_a_new_thread({ threadType })}</Dialog.Description>
    </Dialog.Header>
    <InputField
      type="text"
      getError={threadTitleGetError}
      bind:value={threadTitle}
      bind:isValid={titleIsValid}
      label={m.thread_title()}
      placeholder={m.enter_thread_title()}
    />
    <Dialog.Footer>
      <Button variant="outline" class="cursor-pointer" onclick={onCancel}>{m.cancel()}</Button>
      <Button class="cursor-pointer" onclick={onCreateClick} disabled={!titleIsValid}
        >{m.create()}</Button
      >
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
