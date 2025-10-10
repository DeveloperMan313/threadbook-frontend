<script lang="ts">
  import type { InputFieldProps } from '$lib/types';

  let {
    type,
    getError,
    value = $bindable(),
    isValid = $bindable(),
    label,
    placeholder,
    disabled,
    noSpaces
  }: InputFieldProps = $props();

  let errorMsg = $state('');

  const filterSpaces = (e: KeyboardEvent) => {
    if (e.key == ' ') {
      e.preventDefault();
    }
  };

  const validate = () => {
    const error = getError(value);
    errorMsg = error || '';
    isValid = error === null;
  };
</script>

<div class="input-field" class:disabled>
  <p class="label">{label}</p>
  <input
    class="input {errorMsg ? 'error' : ''}"
    {type}
    bind:value
    {placeholder}
    {disabled}
    oninput={validate}
    onkeydown={noSpaces ? filterSpaces : undefined}
  />
  <p class="error-msg">{errorMsg}</p>
</div>

<style>
  .input-field {
    position: relative;
    height: var(--button-height);
    overflow: visible;
  }

  .label {
    position: absolute;
    top: calc(-1 * var(--font-small) - var(--m-1));
  }

  .input {
    width: 100%;
    height: 100%;
    background-color: var(--bg-primary);
    border: solid var(--border-width) var(--bg-primary-dark);
    border-radius: var(--border-radius-small);
    padding: 0 var(--m-2);
    outline: none;
    transition: box-shadow ease-in-out 0.2s;
  }

  .input.error {
    border-color: var(--active-secondary);
  }

  .input::placeholder {
    color: var(--text-secondary);
  }

  .input:focus {
    box-shadow: 0 0 0 var(--m-2) rgba(from var(--active-primary) r g b / 0.5);
  }

  .input.error:focus {
    box-shadow: 0 0 0 var(--m-2) rgba(from var(--active-secondary) r g b / 0.5);
  }

  .error-msg {
    position: absolute;
    top: calc(var(--button-height) + var(--m-1));
    color: var(--active-secondary);
  }
</style>
