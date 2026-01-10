<script lang="ts">
  import type { InputFieldProps } from '$lib/types';
  import { Input } from '$lib/components/ui/input/index.js';
  import { Label } from '$lib/components/ui/label/index.js';

  let {
    type,
    getError,
    value = $bindable(),
    isValid = $bindable(),
    label,
    placeholder,
    disabled,
    noSpaces,
    class: className,
    tabindex
  }: InputFieldProps = $props();

  let errorMsg = $state('');
  let rawValue = $state(value);

  const filterSpaces = (e: KeyboardEvent) => {
    if (e.key == ' ') {
      e.preventDefault();
    }
  };

  const validate = async () => {
    value = rawValue.trim();
    const error = await getError(value);
    errorMsg = error || '';
    isValid = error === null;
  };
</script>

<div class={'flex w-full max-w-sm flex-col gap-1.5' + (className ? ' ' + className : '')}>
  {#if label}
    <Label for="input-{label}">{label}</Label>
  {/if}
  <Input
    id="input-{label}"
    {type}
    bind:value={rawValue}
    {placeholder}
    {disabled}
    oninput={validate}
    aria-invalid={errorMsg != ''}
    onkeydown={noSpaces ? filterSpaces : undefined}
    class={'w-full' + (errorMsg ? ' border-destructive focus-visible:ring-destructive/20' : '')}
    {tabindex}
  />
  {#if errorMsg}
    <p class="text-sm text-destructive">{errorMsg}</p>
  {/if}
</div>
