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
    class="input"
    {type}
    bind:value
    {placeholder}
    {disabled}
    oninput={validate}
    onkeydown={noSpaces ? filterSpaces : undefined}
  />
  <p class="error-msg">{errorMsg}</p>
</div>
