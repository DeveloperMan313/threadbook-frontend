<script lang="ts">
  import type { ModalInviteUsersToThread } from '$lib/types';
  import { Button } from '$lib/components/ui/button/index.js';
  import * as Dialog from '$lib/components/ui/dialog/index.js';
  import InputField from './InputField.svelte';
  import { ThreadApi } from '$lib/api';
  import { inviteUsernamesGetError } from '$lib/validation';

  let { threadId, threadTitle, isOpen = $bindable() }: ModalInviteUsersToThread = $props();

  let usernames = $state('');
  let usernamesAreValid = $state(true);
  let isLoading = $state(false);

  const onInviteClick = () => {
    isOpen = false;
    const usernameList = usernames.split(' ');
    isLoading = true;
    try {
      // ThreadApi.inviteUsersToThread({ invitee_usernames: usernameList, thread_id: threadId });
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
      <Dialog.Title>Invite users</Dialog.Title>
      <Dialog.Description>
        Invite users to thread "{threadTitle}".
      </Dialog.Description>
    </Dialog.Header>
    <!-- TODO username hints and errors -->
    <InputField
      type="text"
      getError={inviteUsernamesGetError}
      bind:value={usernames}
      bind:isValid={usernamesAreValid}
      label="Usernames"
      placeholder="user1 user2 ..."
    />
    <Dialog.Footer>
      <Button variant="outline" class="cursor-pointer" onclick={onCancel}>Cancel</Button>
      <Button
        variant="default"
        class="cursor-pointer"
        onclick={onInviteClick}
        disabled={!usernamesAreValid || !usernames.trim() || isLoading}>Invite</Button
      >
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
