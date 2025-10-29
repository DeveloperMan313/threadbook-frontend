<script lang="ts">
  import type { ModalSpoolLeaveProps } from '$lib/types';
  import { Button } from '$lib/components/ui/button/index.js';
  import * as Dialog from '$lib/components/ui/dialog/index.js';
  import { getContext } from 'svelte';

  let { spoolId, spoolName, isOpen = $bindable() }: ModalSpoolLeaveProps = $props();

  const { leave } = getContext('spools') as {
    leave: { (spool_id: number): Promise<void> };
  };

  const onLeaveClick = () => {
    isOpen = false;
    leave(spoolId);
  };

  const onCancel = () => {
    isOpen = false;
  };
</script>

<Dialog.Root bind:open={isOpen}>
  <Dialog.Content class="sm:max-w-[425px]">
    <Dialog.Header>
      <Dialog.Title>Leave spool</Dialog.Title>
      <Dialog.Description>
        Are you sure you want to leave from spool "{spoolName}"? You will not be able to return
        without an invite.
      </Dialog.Description>
    </Dialog.Header>
    <Dialog.Footer>
      <Button variant="outline" class="cursor-pointer" onclick={onCancel}>Cancel</Button>
      <Button variant="destructive" class="cursor-pointer" onclick={onLeaveClick}>Leave</Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
