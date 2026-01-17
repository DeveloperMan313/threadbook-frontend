<script lang="ts">
  import { Button } from '$lib/components/ui/button/index.js';
  import { Label } from '$lib/components/ui/label/index.js';
  import * as Dialog from '$lib/components/ui/dialog/index.js';
  import InputField from './InputField.svelte';
  import { spoolNameGetError } from '$lib/validation';
  import type { ModalSpoolCreateProps } from '$lib/types';
  import Input from '$lib/components/ui/input/input.svelte';
  import { stateSpoolCreate } from '$lib/states';
  import * as m from '$lib/paraglide/messages';

  let { isOpen = $bindable(false) }: ModalSpoolCreateProps = $props();

  let spoolName = $state('');
  let bannerFile = $state<File | undefined>(undefined);
  let nameIsValid = $state(false);
  let isLoading = $state(false);

  const onCreateClick = async () => {
    if (!nameIsValid) return;
    isLoading = true;
    try {
      await stateSpoolCreate(spoolName, bannerFile);
      isOpen = false;
    } catch (error) {
      console.error('Failed to create spool:', error);
    } finally {
      isLoading = false;
    }
  };

  const onCancel = () => {
    isOpen = false;
  };

  const onFileChange = (event: Event) => {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files[0]) {
      bannerFile = target.files[0];
    }
  };

  $effect(() => {
    if (isOpen) {
      spoolName = '';
      bannerFile = undefined;
      nameIsValid = false;
      isLoading = false;
    }
  });
</script>

<Dialog.Root bind:open={isOpen}>
  <Dialog.Content class="sm:max-w-[425px]">
    <Dialog.Header>
      <Dialog.Title>{m.new_spool()}</Dialog.Title>
      <Dialog.Description>{m.create_a_new_spool()}</Dialog.Description>
    </Dialog.Header>
    <InputField
      type="text"
      getError={spoolNameGetError}
      bind:value={spoolName}
      bind:isValid={nameIsValid}
      label={m.spool_name()}
      placeholder={m.enter_spool_name()}
    />
    <div class="flex w-full max-w-sm flex-col gap-1.5">
      <Label for="banner" class="text-right">{m.banner_image()}</Label>
      <Input
        class="cursor-pointer"
        id="banner"
        type="file"
        accept="image/*"
        onchange={onFileChange}
      />
    </div>
    <Dialog.Footer>
      <Button variant="outline" class="cursor-pointer" onclick={onCancel} disabled={isLoading}>
        {m.cancel()}
      </Button>
      <Button class="cursor-pointer" onclick={onCreateClick} disabled={!nameIsValid || isLoading}>
        {#if isLoading}
          {m.creating()}
        {:else}
          {m.create()}
        {/if}
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
