<script lang="ts">
  import { Button } from '$lib/components/ui/button/index.js';
  import { Label } from '$lib/components/ui/label/index.js';
  import * as Dialog from '$lib/components/ui/dialog/index.js';
  import InputField from './InputField.svelte';
  import { SpoolApi } from '$lib/api';
  import { spoolNameGetError } from '$lib/validation';
  import type { CreateSpoolRequest, ModalSpoolCreateProps } from '$lib/types';
  import Input from '$lib/components/ui/input/input.svelte';
  import { invalidateAll } from '$app/navigation';

  let { isOpen = $bindable(false) }: ModalSpoolCreateProps = $props();

  let spoolName = $state('');
  let bannerFile = $state<File | undefined>(undefined);
  let nameIsValid = $state(false);
  let isLoading = $state(false);

  const onCreateClick = async () => {
    if (!nameIsValid) return;

    isLoading = true;
    try {
      const request: CreateSpoolRequest = {
        name: spoolName,
        banner: bannerFile
      };

      await SpoolApi.createSpool(request);
      isOpen = false;

      spoolName = '';
      bannerFile = undefined;
      nameIsValid = false;

      invalidateAll(); // maybe it's too much, but idc atm
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
      <Dialog.Title>New Spool</Dialog.Title>
      <Dialog.Description>Create a new spool.</Dialog.Description>
    </Dialog.Header>
    <InputField
      type="text"
      getError={spoolNameGetError}
      bind:value={spoolName}
      bind:isValid={nameIsValid}
      label="Spool name"
      placeholder="Enter spool name"
    />
    <div class="flex w-full max-w-sm flex-col gap-1.5">
      <Label for="banner" class="text-right">Banner image</Label>
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
        Cancel
      </Button>
      <Button class="cursor-pointer" onclick={onCreateClick} disabled={!nameIsValid || isLoading}>
        {#if isLoading}
          Creating...
        {:else}
          Create
        {/if}
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
