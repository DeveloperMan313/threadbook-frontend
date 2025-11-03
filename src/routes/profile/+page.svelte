<script lang="ts">
  import { page } from '$app/state';
  import { ProfileApi } from '$lib/api/profile';
  import * as Avatar from '$lib/components/ui/avatar/index.js';
  import Button from '$lib/components/ui/button/button.svelte';
  import Input from '$lib/components/ui/input/input.svelte';
  import Label from '$lib/components/ui/label/label.svelte';
  import InputField from '$lib/templates/InputField.svelte';
  import Navbar from '$lib/templates/Navbar.svelte';
  import type { UserProfileFull } from '$lib/types';
  import { nicknameGetError } from '$lib/validation';

  let profile = $derived(page.data.userProfile) as UserProfileFull;

  // svelte-ignore state_referenced_locally
  let nickname = $state(profile.nickname); // make a copy
  // svelte-ignore state_referenced_locally
  let avatarSrc = $state(profile.avatar_link); // make a copy
  let avatar = $state<File | undefined>(undefined);

  let isLoading = $state(false);
  let nicknameIsValid = $state(true);

  const onFileChange = (event: Event) => {
    const target = event.target as HTMLInputElement;
    if (!target.files || !target.files[0]) return;

    avatar = target.files[0];
    var reader = new FileReader();

    reader.onload = function (event) {
      avatarSrc = event.target!.result as string;
    };

    reader.readAsDataURL(avatar);
  };

  const updateProfile = async () => {
    try {
      isLoading = true;
      const profileChanges = await ProfileApi.updateProfile({ nickname, avatar });
      profile = {
        ...profile,
        ...profileChanges
      };
      localStorage.setItem('userProfile', JSON.stringify(profile));
      // TODO rework so profile updates reactively, probably context
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Profile update failed');
    } finally {
      isLoading = false;
    }
  };
</script>

<Navbar />
<div class="flex w-full flex-col items-center pt-32 pb-8">
  <div class="flex w-96 flex-col items-start gap-8 rounded-2xl bg-background p-8">
    <h2 class="w-full scroll-m-20 border-b pb-2 text-3xl font-semibold">Profile settings</h2>
    <Avatar.Root class="size-40 self-center">
      <Label class="contents cursor-pointer" for="avatar">
        <Avatar.Image id="avatar-preview" src={avatarSrc} alt={profile.nickname} />
        <Avatar.Fallback>{profile.nickname.slice(0, 2).toUpperCase()}</Avatar.Fallback>
      </Label>
    </Avatar.Root>
    <div class="flex w-full max-w-sm flex-col gap-1.5">
      <Label for="avatar">Profile picture</Label>
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
      label="Nickname"
    />
    <InputField
      type="text"
      getError={() => null}
      value={profile.username}
      isValid={true}
      label="Username"
      disabled={true}
    />
    <InputField
      type="email"
      getError={() => null}
      value={profile.email}
      isValid={true}
      label="Email"
      disabled={true}
    />
    <Button
      class="cursor-pointer"
      onclick={updateProfile}
      disabled={(nickname == profile.nickname && !avatar) || isLoading}
    >
      {#if isLoading}
        Updating...
      {:else}
        Update profile
      {/if}
    </Button>
  </div>
</div>
