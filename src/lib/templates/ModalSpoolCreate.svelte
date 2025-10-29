<script lang="ts">
  import { Button } from '$lib/components/ui/button/index.js';
  import { Label } from '$lib/components/ui/label/index.js';
  import * as Dialog from '$lib/components/ui/dialog/index.js';
  import InputField from './InputField.svelte';
  import { SpoolApi } from '$lib/api/spool';
  import { spoolNameGetError } from '$lib/validation';
  import type { CreateSpoolRequest, ModalSpoolCreateProps } from '$lib/types';

  let { isOpen = $bindable(false) }: ModalSpoolCreateProps = $props();

  let spoolName = $state('');
  let bannerFile = $state<File | null>(null);
  let nameIsValid = $state(false);
  let isLoading = $state(false);

  const onCreateClick = async () => {
    if (!nameIsValid || !bannerFile) return;

    isLoading = true;
    try {
      const request: CreateSpoolRequest = {
        name: spoolName,
        banner: bannerFile
      };

      await SpoolApi.createSpool(request);
      isOpen = false;

      spoolName = '';
      bannerFile = null;
      nameIsValid = false;
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
      bannerFile = null;
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
      label="Spool Name"
      placeholder="Enter spool name"
    />
    <div class="flex w-full max-w-sm flex-col gap-1.5">
      <Label for="banner" class="text-right">Banner Image</Label>
      <input
        id="banner"
        type="file"
        accept="image/*"
        onchange={onFileChange}
        class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
      />
      {#if bannerFile}
        <p class="text-sm text-muted-foreground">Selected: {bannerFile.name}</p>
      {/if}
    </div>
    <Dialog.Footer>
      <Button variant="outline" class="cursor-pointer" onclick={onCancel} disabled={isLoading}>
        Cancel
      </Button>
      <Button
        class="cursor-pointer"
        onclick={onCreateClick}
        disabled={!nameIsValid || !bannerFile || isLoading}
      >
        {#if isLoading}
          Creating...
        {:else}
          Create
        {/if}
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
