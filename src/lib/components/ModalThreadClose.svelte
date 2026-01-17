<script lang="ts">
  import type { ModalThreadCloseProps } from '$lib/types';
  import { getContext } from 'svelte';
  import { Button } from '$lib/components/ui/button/index.js';
  import * as Dialog from '$lib/components/ui/dialog/index.js';
  import * as m from '$lib/paraglide/messages';

  let { threadId, threadTitle, isOpen = $bindable() }: ModalThreadCloseProps = $props();

  const { closeThread } = getContext('threads') as {
    closeThread: { (id: number): void };
  };

  const onCloseClick = () => {
    isOpen = false;
    closeThread(threadId);
  };

  const onCancel = () => {
    isOpen = false;
  };
</script>

<Dialog.Root bind:open={isOpen}>
  <Dialog.Content class="sm:max-w-[425px]">
    <Dialog.Header>
      <Dialog.Title>{m.close_thread()}</Dialog.Title>
      <Dialog.Description>
        {m.are_you_sure_close_thread({ threadTitle })}
      </Dialog.Description>
    </Dialog.Header>
    <Dialog.Footer>
      <Button variant="outline" class="cursor-pointer" onclick={onCancel}>{m.cancel()}</Button>
      <Button variant="destructive" class="cursor-pointer" onclick={onCloseClick}
        >{m.close()}</Button
      >
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
