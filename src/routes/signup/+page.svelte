<script lang="ts">
  import InputField from '$lib/templates/InputField.svelte';
  import {
    signupUsernameGetError,
    signupPasswordGetError,
    getPasswordRepeatGetError,
    signupEmailGetError
  } from '$lib/validation';
  import { AuthApi } from '$lib/api';
  import { Button } from '$lib/components/ui/button/index.js';
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';

  let usernameValue = $state('');
  let usernameIsValid = $state(false);

  let emailValue = $state('');
  let emailIsValid = $state(false);

  let passwordValue = $state('');
  let passwordIsValid = $state(false);

  let passwordRepeatedValue = $state('');
  let passwordRepeatedIsValid = $state(false);

  const passwordRepeatedGetError = $derived(getPasswordRepeatGetError(passwordValue));

  let registrationStage = $state(0);

  const advanceStage = () => {
    registrationStage += 1;
  };

  let isChecking = $state(false);

  const makeRequest = async () => {
    try {
      await AuthApi.register({
        username: usernameValue,
        email: emailValue,
        password: passwordValue
      });

      goto(resolve('/spools'));
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Registration failed');
    }
  };
</script>

<div class="flex h-full w-full items-center justify-center">
  <div class="flex w-72 flex-row overflow-hidden rounded-2xl bg-background">
    <div
      class="flex w-full flex-shrink-0 flex-col gap-4 p-6 transition-all duration-500"
      style:margin-left={`${-100 * registrationStage}%`}
    >
      <InputField
        type="text"
        getError={async (value: string) => {
          isChecking = true;
          try {
            let error = await signupUsernameGetError(value);
            isChecking = false;
            return error;
          } catch {
            return null;
          }
        }}
        bind:value={usernameValue}
        bind:isValid={usernameIsValid}
        label="Username"
        placeholder="Enter username"
        noSpaces={true}
      />
      <Button
        class="cursor-pointer"
        onclick={advanceStage}
        disabled={!usernameIsValid || isChecking}
        >{#if isChecking}Checking...{:else}Next{/if}</Button
      >
    </div>
    <div class="flex w-full flex-shrink-0 flex-col gap-4 p-6">
      <InputField
        type="email"
        getError={async (value: string) => {
          isChecking = true;
          try {
            let error = await signupEmailGetError(value);
            isChecking = false;
            return error;
          } catch {
            return null;
          }
        }}
        bind:value={emailValue}
        bind:isValid={emailIsValid}
        label="Email"
        placeholder="Enter email"
        noSpaces={true}
      />
      <Button class="cursor-pointer" onclick={advanceStage} disabled={!emailIsValid || isChecking}
        >{#if isChecking}Checking...{:else}Next{/if}</Button
      >
    </div>
    <div class="flex w-full flex-shrink-0 flex-col gap-4 p-6">
      <InputField
        type="password"
        getError={signupPasswordGetError}
        bind:value={passwordValue}
        bind:isValid={passwordIsValid}
        label="Password"
        placeholder="Enter password"
        noSpaces={true}
      />
      <Button class="cursor-pointer" onclick={advanceStage} disabled={!passwordIsValid}>Next</Button
      >
    </div>
    <div class="flex w-full flex-shrink-0 flex-col gap-4 p-6">
      <InputField
        type="password"
        getError={passwordRepeatedGetError}
        bind:value={passwordRepeatedValue}
        bind:isValid={passwordRepeatedIsValid}
        label="Repeat password"
        placeholder="Enter password"
        noSpaces={true}
      />
      <Button class="cursor-pointer" onclick={makeRequest} disabled={!passwordRepeatedIsValid}
        >Sign up</Button
      >
    </div>
  </div>
</div>
