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
  import { ChevronLeft } from '@lucide/svelte';

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

  let errorMsg = $state('');

  const advanceStage = () => {
    registrationStage += 1;
  };

  const returnStage = () => {
    registrationStage -= 1;
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
      if (!(error instanceof Error)) return;
      if (error.message == 'user already exists') {
        errorMsg = 'User already exists'; // TODO more detailed errors
        return;
      }
      errorMsg = 'Could not sign you up, retry later';
    }
  };

  let currentValidationId = 0;

  let currentEmailError: string | null = null;
  let currentUsernameError: string | null = null;
</script>

<div class="flex h-full w-full items-center justify-center">
  <div class="relative w-72 overflow-hidden rounded-2xl bg-background py-5">
    <Button
      class="absolute left-5 rounded-full transition-opacity disabled:opacity-0"
      variant="ghost"
      onclick={returnStage}
      disabled={registrationStage == 0}
    >
      <ChevronLeft />
    </Button>
    <h2 class="w-full text-center text-3xl">Sign up</h2>
    <div class="flex w-full flex-row">
      <div
        class="flex w-full flex-shrink-0 flex-col gap-4 p-6 transition-all duration-500"
        style:margin-left={`${-100 * registrationStage}%`}
      >
        <InputField
          type="email"
          getError={async (value: string) => {
            isChecking = true;
            let validationId = ++currentValidationId;
            try {
              let error = await signupEmailGetError(value);
              if (validationId < currentValidationId) {
                return currentEmailError;
              }
              currentEmailError = error;
              isChecking = false;
              return currentEmailError;
            } catch {
              // old call that was debounced, so either we wait for fetch and don't need error, or we will get sync error instantly
              currentEmailError = null;
              return currentEmailError;
            }
          }}
          bind:value={emailValue}
          bind:isValid={emailIsValid}
          label="Email"
          placeholder="email@example.com"
          noSpaces={true}
          tabindex={-1}
        />
        <Button class="cursor-pointer" onclick={advanceStage} disabled={!emailIsValid || isChecking}
          >{#if isChecking}Checking...{:else}Next{/if}</Button
        >
      </div>
      <div class="flex w-full flex-shrink-0 flex-col gap-4 p-6">
        <InputField
          type="text"
          getError={async (value: string) => {
            isChecking = true;
            let validationId = ++currentValidationId;
            try {
              let error = await signupUsernameGetError(value);
              if (validationId < currentValidationId) {
                return currentUsernameError;
              }
              currentUsernameError = error;
              isChecking = false;
              return currentUsernameError;
            } catch {
              // old call that was debounced, so either we wait for fetch and don't need error, or we will get sync error instantly
              currentUsernameError = null;
              return currentUsernameError;
            }
          }}
          bind:value={usernameValue}
          bind:isValid={usernameIsValid}
          label="Username"
          placeholder="user123"
          noSpaces={true}
          tabindex={-1}
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
          type="password"
          getError={signupPasswordGetError}
          bind:value={passwordValue}
          bind:isValid={passwordIsValid}
          label="Password"
          placeholder="Enter password"
          noSpaces={true}
          tabindex={-1}
        />
        <Button class="cursor-pointer" onclick={advanceStage} disabled={!passwordIsValid}
          >Next</Button
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
          tabindex={-1}
        />
        <Button
          class="cursor-pointer"
          onclick={makeRequest}
          disabled={!passwordRepeatedIsValid || errorMsg != ''}>Sign up</Button
        >
      </div>
    </div>
    {#if errorMsg}<p class="mb-4 text-center text-sm text-destructive">{errorMsg}</p>{/if}
    <p class="mb-1 text-center text-sm">Already have an account?</p>
    <p class="text-center text-sm underline"><a href={resolve('/signin')}>sign in</a></p>
  </div>
</div>
