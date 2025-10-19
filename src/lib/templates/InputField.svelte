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

<div class="relative h-9 overflow-visible">
  <p class="absolute -top-6 text-sm">{label}</p>
  <input
    class="h-full w-full rounded border-2 border-amber-200 bg-white px-2 transition-shadow duration-200 outline-none placeholder:text-gray-600 focus:shadow-[0_0_0_8px_rgba(129,178,154,0.5)] {errorMsg
      ? 'border-orange-400 focus:shadow-[0_0_0_8px_rgba(224,122,95,0.5)]'
      : ''}"
    {type}
    bind:value
    {placeholder}
    {disabled}
    oninput={validate}
    onkeydown={noSpaces ? filterSpaces : undefined}
  />
  <p class="absolute top-9 text-sm text-orange-400">{errorMsg}</p>
</div>
