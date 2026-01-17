<script lang="ts">
  import type { ModalThreadInviteLinkCreateProps } from '$lib/types';
  import { Button } from '$lib/components/ui/button/index.js';
  import * as Dialog from '$lib/components/ui/dialog/index.js';
  import { ThreadApi } from '$lib/api';
  import Input from '$lib/components/ui/input/input.svelte';
  import * as m from '$lib/paraglide/messages';

  let { isOpen = $bindable(), threadId, threadTitle }: ModalThreadInviteLinkCreateProps = $props();

  const linkBase = location.origin + '/thread-invite/';

  let isLoading = $state(false);
  let linkId = $state('');
  let link = $derived(linkId ? linkBase + linkId : '');

  const onButtonClick = async () => {
    if (link) {
      await navigator.clipboard.writeText(link);
      isOpen = false;
      return;
    }

    isLoading = true;
    try {
      // eslint-disable-next-line svelte/prefer-svelte-reactivity
      const expires_at = new Date();
      expires_at.setDate(expires_at.getDate() + 5);
      const inviteLink = await ThreadApi.createInviteLink({
        thread_id: threadId,
        max_uses: 5,
        expires_at: new Date()
      });
      linkId = inviteLink.id;
    } catch (error) {
      console.error('Failed to create thread invite link:', error);
    } finally {
      isLoading = false;
    }
  };

  const onCancel = () => {
    isOpen = false;
  };

  $effect(() => {
    if (isOpen) {
      isLoading = false;
      linkId = '';
    }
  });
</script>

<Dialog.Root bind:open={isOpen}>
  <Dialog.Content class="sm:max-w-[425px]">
    <Dialog.Header>
      <Dialog.Title>{m.create_invite_link()}</Dialog.Title>
      <Dialog.Description>
        {m.create_invite_link_for_thread({ threadTitle })}
      </Dialog.Description>
    </Dialog.Header>
    <Input type="text" placeholder={linkBase + 'your-new-invite-link'} value={link} readonly />
    <Dialog.Footer>
      <Button variant="outline" class="cursor-pointer" onclick={onCancel}>{m.cancel()}</Button>
      <Button variant="default" class="cursor-pointer" onclick={onButtonClick} disabled={isLoading}
        >{link ? m.copy() : isLoading ? m.creating() : m.create()}</Button
      >
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
