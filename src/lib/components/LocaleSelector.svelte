<script lang="ts">
  import * as Select from '$lib/components/ui/select/index.js';
  import { getLocale, type Locale } from '$lib/paraglide/runtime';
  import { applyLocale } from '$lib/states';
  import type { LocaleSelectorProps } from '$lib/types';

  const { class: className }: LocaleSelectorProps = $props();

  const locales: { value: Locale; label: string }[] = [
    { value: 'en', label: 'English' },
    { value: 'ru', label: 'Русский' }
  ];

  let currLocale = $state(getLocale());

  const currLocaleLabel = $derived(locales.find((f) => f.value === currLocale)!.label);

  $effect(() => {
    applyLocale(currLocale);
  });
</script>

<Select.Root type="single" name="locale" bind:value={currLocale}>
  <Select.Trigger id="locale-input" class={`cursor-pointer ${className}`}>
    {currLocaleLabel}
  </Select.Trigger>
  <Select.Content>
    <Select.Group>
      {#each locales as locale (locale.value)}
        <Select.Item value={locale.value} label={locale.label} class="cursor-pointer">
          {locale.label}
        </Select.Item>
      {/each}
    </Select.Group>
  </Select.Content>
</Select.Root>
