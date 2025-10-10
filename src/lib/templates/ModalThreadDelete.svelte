<script lang="ts">
  import type { ModalThreadDeleteProps } from '$lib/types';
  import Button from './Button.svelte';
  import Modal from './Modal.svelte';

  let { threadEntryProps, isOpen = $bindable() }: ModalThreadDeleteProps = $props();
</script>

<Modal title="Delete thread" bind:isOpen>
  {#snippet body()}
    <p>Are you sure you want to delete "{threadEntryProps.title}"? This action cannot be undone.</p>
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
      label="Delete"
      onClick={() => {
        isOpen = false;
        alert(`Deleted thread "${threadEntryProps.title}"`);
      }}
    ></Button>
  {/snippet}
</Modal>
