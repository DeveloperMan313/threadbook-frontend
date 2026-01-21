<script lang="ts">
  import type { ModalLogOutProps } from '$lib/types';
  import { Button } from '$lib/components/ui/button/index.js';
  import * as Dialog from '$lib/components/ui/dialog/index.js';
  import { AuthApi } from '$lib/api';
  import { stateProfile } from '$lib/states';
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import * as m from '$lib/paraglide/messages';
  import { toast } from 'svelte-sonner';

  let { isOpen = $bindable() }: ModalLogOutProps = $props();

  const onLeaveClick = () => {
    isOpen = false;
    try {
      AuthApi.logOut();
      goto(resolve('/signin', {}));
    } catch {
      toast.error(m.error_logging_out());
    }
  };

  const onCancel = () => {
    isOpen = false;
  };
</script>

<Dialog.Root bind:open={isOpen}>
  <Dialog.Content class="sm:max-w-[425px]">
    <Dialog.Header>
      <Dialog.Title>{m.log_out()}</Dialog.Title>
      <Dialog.Description>
        {m.are_you_sure_log_out({ account: stateProfile.profile!.email })}
      </Dialog.Description>
    </Dialog.Header>
    <Dialog.Footer>
      <Button variant="outline" class="cursor-pointer" onclick={onCancel}>{m.cancel()}</Button>
      <Button variant="destructive" class="cursor-pointer" onclick={onLeaveClick}
        >{m.cancel()}</Button
      >
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
