<script lang="ts">
  import type { ModalSpoolLeaveProps } from '$lib/types';
  import Button from './Button.svelte';
  import Modal from './Modal.svelte';

  let { spoolProps, isOpen = $bindable() }: ModalSpoolLeaveProps = $props();
</script>

<Modal title="Leave spool" bind:isOpen>
  {#snippet body()}
    <p>
      Are you sure you want to leave from spool "{spoolProps.name}"? You will not be able to return
      without an invite.
    </p>
  {/snippet}

  {#snippet buttons()}
    <Button
      type="neutral"
      label="Cancel"
      onClick={() => {
        isOpen = false;
      }}
    ></Button>
    <Button
      type="danger"
      label="Leave"
      onClick={() => {
        isOpen = false;
        alert(`Leave from spool "${spoolProps.name}"`);
      }}
    ></Button>
  {/snippet}
</Modal>
