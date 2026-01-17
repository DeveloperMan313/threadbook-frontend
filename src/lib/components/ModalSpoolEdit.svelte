<script lang="ts">
  import { Button } from '$lib/components/ui/button/index.js';
  import { Label } from '$lib/components/ui/label/index.js';
  import * as Dialog from '$lib/components/ui/dialog/index.js';
  import InputField from './InputField.svelte';
  import { spoolNameGetError } from '$lib/validation';
  import type { ModalSpoolEditProps } from '$lib/types';
  import Input from '$lib/components/ui/input/input.svelte';
  import { stateSpools, stateSpoolUpdate } from '$lib/states';
  import * as m from '$lib/paraglide/messages';

  let { isOpen = $bindable(false), spoolId }: ModalSpoolEditProps = $props();

  const oldSpoolName = $derived(stateSpools.spools.find((s) => s.id === spoolId)!.name);

  // svelte-ignore state_referenced_locally
  let spoolName = $state(oldSpoolName); // capture
  let bannerFile = $state<File | undefined>(undefined);
  let nameIsValid = $state(true);
  let isLoading = $state(false);

  const onEditClick = async () => {
    if (!nameIsValid) return;
    isLoading = true;
    try {
      await stateSpoolUpdate(spoolId, spoolName, bannerFile);
      isOpen = false;
    } catch (error) {
      console.error('Failed to edit spool:', error);
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
      spoolName = oldSpoolName;
      bannerFile = undefined;
      nameIsValid = true;
      isLoading = false;
    }
  });
</script>

<Dialog.Root bind:open={isOpen}>
  <Dialog.Content class="sm:max-w-[425px]">
    <Dialog.Header>
      <Dialog.Title>{m.edit_spool()}</Dialog.Title>
      <Dialog.Description>{m.change_name_or_banner({ spoolName: oldSpoolName })}</Dialog.Description
      >
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
      <Button class="cursor-pointer" onclick={onEditClick} disabled={!nameIsValid || isLoading}>
        {#if isLoading}
          {m.saving()}
        {:else}
          {m.save()}
        {/if}
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
