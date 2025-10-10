<script lang="ts">
  import type { ButtonProps } from '$lib/types';

  let { type, label, onClick, disabled }: ButtonProps = $props();
</script>

<button class="button {type}" onclick={onClick} class:disabled {disabled}>{label}</button>

<style>
  .button {
    height: var(--button-height);
    border-style: solid;
    border-width: var(--border-width);
    border-radius: var(--border-radius-small);
    cursor: pointer;

    background-color: var(--bg-default);
    border-color: var(--bg-dark);
  }

  .button:hover {
    background-color: color-mix(in srgb, var(--bg-default), var(--bg-dark));
  }

  .button:active {
    background-color: var(--bg-dark);
  }

  .button.primary {
    --bg-default: var(--active-primary);
    --bg-dark: var(--active-primary-dark);
    color: var(--text-inverted);
  }

  .button.neutral {
    --bg-default: var(--bg-primary);
    --bg-dark: var(--bg-primary-dark);
  }

  .button.danger {
    --bg-default: var(--active-secondary);
    --bg-dark: var(--active-secondary-dark);
    color: var(--text-inverted);
  }
</style>
