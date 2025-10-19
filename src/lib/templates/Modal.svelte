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
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/20"
    onclick={handleBackdropClick}
  >
    <div
      class="flex w-[30rem] flex-col gap-3 rounded-2xl bg-white p-6"
      onclick={(event: MouseEvent) => {
        event.stopPropagation();
      }}
    >
      <div class="flex items-center justify-between">
        <h1 id="title" class="text-xl font-medium">{title}</h1>
        <Button type="subtle" label="✕" onClick={closeModal} thin />
      </div>
      <div class="body">
        {@render body()}
      </div>
      <div class="flex justify-end gap-3">
        {@render buttons()}
      </div>
    </div>
  </div>
{/if}
