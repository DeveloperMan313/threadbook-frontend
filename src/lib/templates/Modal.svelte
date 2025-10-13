<script lang="ts">
  import type { ModalProps } from '$lib/types';
  import Button from './Button.svelte';

  let { title, body, buttons, isOpen = $bindable(), onClose }: ModalProps = $props();

  const closeModal = () => {
    isOpen = false;
    if (onClose) {
      onClose();
    }
  };

  const handleBackdropClick = (event: MouseEvent) => {
    if (event.target == event.currentTarget) {
      closeModal();
    }
  };

  const handleKeydown = (event: KeyboardEvent) => {
    if (event.key == 'Escape') {
      closeModal();
    }
  };

  $effect(() => {
    if (isOpen) {
      window.addEventListener('keydown', handleKeydown);
    } else {
      window.removeEventListener('keydown', handleKeydown);
    }
  });
</script>

<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
{#if isOpen}
  <div class="backdrop" onclick={handleBackdropClick}>
    <div
      class="modal"
      onclick={(event: MouseEvent) => {
        event.stopPropagation();
      }}
    >
      <div class="header">
        <h1 id="title" class="title">{title}</h1>
        <Button type="subtle" label="✕" onClick={closeModal} thin />
      </div>
      <div class="body">
        {@render body()}
      </div>
      <div class="buttons">
        {@render buttons()}
      </div>
    </div>
  </div>
{/if}

<style>
  .backdrop {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 1000;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: rgba(0, 0, 0, 0.2);
  }

  .modal {
    width: 30rem;
    padding: var(--m-4);
    background-color: var(--bg-primary);
    border-radius: var(--border-radius-large);
    display: flex;
    flex-direction: column;
    gap: var(--m-3);
  }

  .header {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }

  .title {
    font-size: var(--font-medium);
  }

  :global(.modal .header .button) {
    font-size: var(--font-medium);
  }

  .buttons {
    display: flex;
    flex-direction: row;
    justify-content: end;
    gap: var(--m-3);
  }
</style>
