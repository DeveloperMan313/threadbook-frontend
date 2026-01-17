<script lang="ts">
  import type { ModalSpoolLeaveProps } from '$lib/types';
  import { Button } from '$lib/components/ui/button/index.js';
  import * as Dialog from '$lib/components/ui/dialog/index.js';
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { resolve } from '$app/paths';
  import { stateSpoolLeave, stateSpools } from '$lib/states';
  import * as m from '$lib/paraglide/messages';

  let { spoolId, isOpen = $bindable() }: ModalSpoolLeaveProps = $props();

  const spoolName = $derived(stateSpools.spools.find((s) => s.id === spoolId)!.name);

  const onLeaveClick = async () => {
    try {
      await stateSpoolLeave(spoolId);
      const currentPath = page.url.pathname;
      if (currentPath.startsWith('/spools/')) {
        const currentSpoolId = currentPath.split('/')[2];
        if (currentSpoolId && parseInt(currentSpoolId) == spoolId) {
          goto(resolve('/spools', {}));
        }
      }
    } catch (error) {
      console.error('Failed to leave spool:', error);
    }
  };

  const onCancel = () => {
    isOpen = false;
  };
</script>

<Dialog.Root bind:open={isOpen}>
  <Dialog.Content class="sm:max-w-[425px]">
    <Dialog.Header>
      <Dialog.Title>{m.leave_spool()}</Dialog.Title>
      <Dialog.Description>
        {m.are_you_sure_leave_spool({ spoolName })}
      </Dialog.Description>
    </Dialog.Header>
    <Dialog.Footer>
      <Button variant="outline" class="cursor-pointer" onclick={onCancel}>{m.cancel()}</Button>
      <Button variant="destructive" class="cursor-pointer" onclick={onLeaveClick}
        >{m.leave()}</Button
      >
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
