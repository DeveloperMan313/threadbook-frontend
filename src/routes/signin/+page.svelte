<script lang="ts">
  import InputField from '$lib/templates/InputField.svelte';
  import { emailGetError, signinPasswordGetError } from '$lib/validation';
  import { AuthApi } from '$lib/api';
  import { Button } from '$lib/components/ui/button/index.js';
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { ChevronLeft } from '@lucide/svelte';

  let emailValue = $state('');
  let emailIsValid = $state(false);

  let passwordValue = $state('');
  let passwordIsValid = $state(false);

  let registrationStage = $state(0);

  let errorMsg = $state('');

  const advanceStage = () => {
    registrationStage += 1;
  };

  const returnStage = () => {
    registrationStage -= 1;
  };

  const makeRequest = async () => {
    try {
      await AuthApi.logIn({
        email: emailValue,
        password: passwordValue
      });

      goto(resolve('/spools'));
    } catch (error) {
      if (!(error instanceof Error)) return;
      if (error.message == 'invalid credentials') {
        errorMsg = 'Incorrect email or password';
        return;
      }
      errorMsg = 'Could not sign you in, retry later';
    }
  };
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
    <h2 class="w-full text-center text-3xl">Sign in</h2>
    <div class="flex w-full flex-row">
      <div
        class="flex w-full flex-shrink-0 flex-col gap-4 p-6 transition-all duration-500"
        style:margin-left={`${-100 * registrationStage}%`}
      >
        <InputField
          type="email"
          getError={emailGetError}
          bind:value={emailValue}
          bind:isValid={emailIsValid}
          label="Email"
          placeholder="Enter email"
          noSpaces={true}
          tabindex={-1}
        />
        <Button class="cursor-pointer" onclick={advanceStage} disabled={!emailIsValid}>Next</Button>
      </div>
      <div class="flex w-full flex-shrink-0 flex-col gap-4 p-6">
        <InputField
          type="password"
          getError={signinPasswordGetError}
          bind:value={passwordValue}
          bind:isValid={passwordIsValid}
          label="Password"
          placeholder="Enter password"
          noSpaces={true}
          tabindex={-1}
        />
        <Button
          class="cursor-pointer"
          onclick={makeRequest}
          disabled={!passwordIsValid || errorMsg != ''}>Sign in</Button
        >
      </div>
    </div>
    {#if errorMsg}<p class="mb-4 text-center text-sm text-destructive">{errorMsg}</p>{/if}
    <p class="mb-1 text-center text-sm">Don't have an account?</p>
    <p class="text-center text-sm underline"><a href={resolve('/signup')}>sign up</a></p>
  </div>
</div>
