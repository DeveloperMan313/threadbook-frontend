<script lang="ts">
  import type { ModalMessageDeleteProps } from '$lib/types';
  import { Button } from '$lib/components/ui/button/index.js';
  import * as Dialog from '$lib/components/ui/dialog/index.js';
  import * as m from '$lib/paraglide/messages';
  import { MessageApi } from '$lib/api';
  import { stateThreadChats } from '$lib/states/threadChats.svelte';

  let { threadId, messageId, isOpen = $bindable() }: ModalMessageDeleteProps = $props();

  const onDeleteClick = async () => {
    isOpen = false;
    await MessageApi.deleteMessage({ thread_id: threadId, message_id: messageId });
    const chat = stateThreadChats.get(threadId)!;
    stateThreadChats.set(threadId, {
      ...chat,
      messages: chat.messages.filter((m) => m.id !== messageId)
    });
  };

  const onCancel = () => {
    isOpen = false;
  };
</script>

<Dialog.Root bind:open={isOpen}>
  <Dialog.Content class="sm:max-w-[425px]">
    <Dialog.Header>
      <Dialog.Title>{m.delete_message()}</Dialog.Title>
      <Dialog.Description>
        {m.are_you_sure_delete_message()}
      </Dialog.Description>
    </Dialog.Header>
    <Dialog.Footer>
      <Button variant="outline" class="cursor-pointer" onclick={onCancel}>{m.cancel()}</Button>
      <Button variant="destructive" class="cursor-pointer" onclick={onDeleteClick}
        >{m.delete()}</Button
      >
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
