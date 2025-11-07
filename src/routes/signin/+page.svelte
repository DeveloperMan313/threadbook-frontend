<script lang="ts">
  import InputField from '$lib/templates/InputField.svelte';
  import { emailGetError, signinPasswordGetError } from '$lib/validation';
  import { AuthApi } from '$lib/api';
  import { Button } from '$lib/components/ui/button/index.js';
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';

  let emailValue = $state('');
  let emailIsValid = $state(false);

  let passwordValue = $state('');
  let passwordIsValid = $state(false);

  let registrationStage = $state(0);

  const advanceStage = () => {
    registrationStage += 1;
  };

  const makeRequest = async () => {
    try {
      await AuthApi.logIn({
        email: emailValue,
        password: passwordValue
      });

      goto(resolve('/spools'));
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Login failed');
    }
  };
</script>

<div class="flex h-full w-full items-center justify-center">
  <div class="w-72 overflow-hidden rounded-2xl bg-background py-5">
    <h2 class="w-full text-center text-3xl font-semibold">Sign in</h2>
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
        <Button class="cursor-pointer" onclick={makeRequest} disabled={!passwordIsValid}
          >Sign in</Button
        >
      </div>
    </div>
    <p class="mb-1 text-center text-sm">Don't have an account?</p>
    <p class="text-center text-sm underline"><a href={resolve('/signup')}>sign up</a></p>
  </div>
</div>
