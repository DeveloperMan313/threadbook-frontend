<script lang="ts">
  import type { ButtonProps } from '$lib/types';

  let { type, label, onClick, thin, disabled }: ButtonProps = $props();
</script>

<button class="button {type}" onclick={onClick} class:thin class:disabled {disabled}>{label}</button
>

<style>
  .button {
    height: var(--button-height);
    padding: 0 var(--m-3);
    border-style: solid;
    border-width: var(--border-width);
    border-radius: var(--border-radius-small);
    cursor: pointer;

    background-color: var(--bg-default);
    border-color: var(--bg-dark);
  }

  .button.thin {
    height: auto;
    padding: var(--m-1);
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

  .button.subtle {
    --bg-default: transparent;
    --bg-dark: var(--bg-primary-dark);
    border-color: transparent;
  }

  .button.danger {
    --bg-default: var(--active-secondary);
    --bg-dark: var(--active-secondary-dark);
    color: var(--text-inverted);
  }
</style>
