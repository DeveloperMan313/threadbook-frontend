<script lang="ts">
  import { ImageApi, ProfileApi } from '$lib/api';
  import Button from '$lib/components/ui/button/button.svelte';
  import Input from '$lib/components/ui/input/input.svelte';
  import Label from '$lib/components/ui/label/label.svelte';
  import * as Dialog from '$lib/components/ui/dialog/index.js';
  import InputField from '$lib/components/InputField.svelte';
  import ModalLogOut from '$lib/components/ModalLogOut.svelte';
  import UserAvatar from '$lib/components/UserAvatar.svelte';
  import type { ModalProfileSettingsProps, UserProfileFull } from '$lib/types';
  import { stateProfile } from '$lib/states';
  import { nicknameGetError } from '$lib/validation';
  import * as m from '$lib/paraglide/messages';

  let { isOpen = $bindable() }: ModalProfileSettingsProps = $props();

  const profile = $derived(stateProfile.profile as UserProfileFull);
  // svelte-ignore state_referenced_locally
  let nickname = $state(profile.nickname); // make a copy
  let avatarLocal = $state('');
  let avatar = $state<File | undefined>(undefined);

  let isLoading = $state(false);
  let nicknameIsValid = $state(true);

  const onFileChange = (event: Event) => {
    const target = event.target as HTMLInputElement;
    if (!target.files || !target.files[0]) return;

    avatar = target.files[0];
    var reader = new FileReader();

    reader.onload = function (event) {
      avatarLocal = event.target!.result as string;
    };

    reader.readAsDataURL(avatar);
  };

  const updateProfile = async () => {
    try {
      isLoading = true;
      const profileChanges = await ProfileApi.updateProfile({ nickname, avatar });
      stateProfile.profile = {
        ...profile,
        ...profileChanges
      };
      avatarLocal = '';
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Profile update failed');
    } finally {
      isLoading = false;
    }
  };

  let isLogOutModalOpen = $state(false);
</script>

<Dialog.Root bind:open={isOpen}>
  <Dialog.Content class="sm:max-w-[425px]">
    <Dialog.Header>
      <Dialog.Title>{m.profile_settings()}</Dialog.Title>
    </Dialog.Header>
    <Label class="contents cursor-pointer" for="avatar">
      <UserAvatar
        username={profile.username}
        {nickname}
        avatarSrc={avatarLocal || ImageApi.getUserAvatarURL(profile.avatar_link)}
        class="mx-auto size-48 text-8xl"
      />
    </Label>
    <div class="flex w-full max-w-sm flex-col gap-1.5">
      <Label for="avatar">{m.profile_picture()}</Label>
      <Input
        class="cursor-pointer"
        id="avatar"
        type="file"
        accept="image/*"
        onchange={onFileChange}
      />
    </div>
    <InputField
      type="text"
      getError={nicknameGetError}
      bind:value={nickname}
      bind:isValid={nicknameIsValid}
      label={m.nickname()}
    />
    <InputField
      type="text"
      getError={() => null}
      value={profile.username}
      isValid={true}
      label={m.username()}
      disabled={true}
    />
    <InputField
      type="email"
      getError={() => null}
      value={profile.email}
      isValid={true}
      label={m.email()}
      disabled={true}
    />
    <Dialog.Footer>
      <Button
        variant="destructive"
        class="cursor-pointer"
        onclick={() => {
          isLogOutModalOpen = true;
        }}
      >
        {m.log_out()}
      </Button>
      <Button
        class="cursor-pointer"
        onclick={updateProfile}
        disabled={(nickname == profile.nickname && !avatar) || isLoading}
      >
        {#if isLoading}
          {m.updating()}
        {:else}
          {m.update_profile()}
        {/if}
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>

<ModalLogOut bind:isOpen={isLogOutModalOpen} />
