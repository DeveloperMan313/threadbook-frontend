<script lang="ts">
  import type { ModalThreadInviteLinkJoinProps } from '$lib/types';
  import { Button } from '$lib/components/ui/button/index.js';
  import * as Dialog from '$lib/components/ui/dialog/index.js';
  import { ThreadApi } from '$lib/api';
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import * as m from '$lib/paraglide/messages';
  import { toast } from 'svelte-sonner';

  let { isOpen = $bindable(), linkId }: ModalThreadInviteLinkJoinProps = $props();

  let isLoading = $state(false);

  const onJoinClick = () => {
    isLoading = true;
    try {
      ThreadApi.joinInviteLink({ link_id: linkId });
      // TODO get spoolId+threadId from response and redirect to thread
      goto(resolve('/spools', {}));
    } catch {
      toast.error(m.error_joining_thread_by_link());
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
      <Dialog.Title>{m.join_invite_link()}</Dialog.Title>
      <Dialog.Description>{m.join_invite_link_for_thread()}</Dialog.Description>
    </Dialog.Header>
    <Dialog.Footer>
      <Button variant="outline" class="cursor-pointer" onclick={onCancel}>{m.cancel()}</Button>
      <Button variant="default" class="cursor-pointer" onclick={onJoinClick} disabled={isLoading}
        >{isLoading ? m.joining() : m.join()}</Button
      >
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
