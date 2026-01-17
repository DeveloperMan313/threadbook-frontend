<script lang="ts">
  import type { ModalInviteUsersToSpool } from '$lib/types';
  import { Button } from '$lib/components/ui/button/index.js';
  import * as Dialog from '$lib/components/ui/dialog/index.js';
  import InputField from './InputField.svelte';
  import { SpoolApi } from '$lib/api';
  import { inviteUsernamesGetError } from '$lib/validation';
  import { stateSpools } from '$lib/states';
  import * as m from '$lib/paraglide/messages';

  let { spoolId, isOpen = $bindable() }: ModalInviteUsersToSpool = $props();

  const spoolName = $derived(stateSpools.spools.find((s) => s.id === spoolId)!.name);

  let usernames = $state('');
  let usernamesAreValid = $state(true);
  let isLoading = $state(false);

  const onInviteClick = () => {
    isOpen = false;
    const usernameList = usernames.split(' ');
    isLoading = true;
    try {
      SpoolApi.inviteUsersToSpool({ member_usernames: usernameList, spool_id: spoolId });
    } catch (error) {
      console.error('Failed to invite users to spool:', error);
    } finally {
      isLoading = false;
    }
  };

  const onCancel = () => {
    isOpen = false;
  };
</script>

<Dialog.Root bind:open={isOpen}>
  <Dialog.Content class="sm:max-w-[425px]">
    <Dialog.Header>
      <Dialog.Title>{m.invite_users()}</Dialog.Title>
      <Dialog.Description>
        {m.invite_users_to_spool({ spoolName })}
      </Dialog.Description>
    </Dialog.Header>
    <!-- TODO username hints and errors -->
    <InputField
      type="text"
      getError={inviteUsernamesGetError}
      bind:value={usernames}
      bind:isValid={usernamesAreValid}
      label={m.usernames()}
      placeholder="user1 user2 ..."
    />
    <Dialog.Footer>
      <Button variant="outline" class="cursor-pointer" onclick={onCancel}>{m.cancel()}</Button>
      <Button
        variant="default"
        class="cursor-pointer"
        onclick={onInviteClick}
        disabled={!usernamesAreValid || !usernames.trim() || isLoading}>{m.invite()}</Button
      >
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
