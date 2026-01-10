<script lang="ts">
  import type { ModalLogOutProps } from '$lib/types';
  import { Button } from '$lib/components/ui/button/index.js';
  import * as Dialog from '$lib/components/ui/dialog/index.js';
  import { AuthApi } from '$lib/api';
  import { stateProfile } from '$lib/states';
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';

  let { isOpen = $bindable() }: ModalLogOutProps = $props();

  const onLeaveClick = () => {
    isOpen = false;
    try {
      AuthApi.logOut();
      goto(resolve('/signin', {}));
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  const onCancel = () => {
    isOpen = false;
  };
</script>

<Dialog.Root bind:open={isOpen}>
  <Dialog.Content class="sm:max-w-[425px]">
    <Dialog.Header>
      <Dialog.Title>Log out</Dialog.Title>
      <Dialog.Description>
        Are you sure you want to log out of your account "{stateProfile.profile!.email}"?
      </Dialog.Description>
    </Dialog.Header>
    <Dialog.Footer>
      <Button variant="outline" class="cursor-pointer" onclick={onCancel}>Cancel</Button>
      <Button variant="destructive" class="cursor-pointer" onclick={onLeaveClick}>Log out</Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
