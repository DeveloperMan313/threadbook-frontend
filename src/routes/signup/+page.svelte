<script lang="ts">
  import InputField from '$lib/templates/InputField.svelte';
  import {
    usernameGetError,
    emailGetError,
    signupPasswordGetError,
    getPasswordRepeatGetError
  } from '$lib/validation';
  import { AuthApi } from '$lib/api';
  import Button from '$lib/templates/Button.svelte';
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
  <div class="flex w-72 flex-row overflow-hidden rounded-2xl bg-white">
    <div
      class="flex w-full flex-shrink-0 flex-col gap-10 p-6 transition-all duration-500"
      style:margin-left={`${-100 * registrationStage}%`}
    >
      <InputField
        type="text"
        getError={usernameGetError}
        bind:value={usernameValue}
        bind:isValid={usernameIsValid}
        label="Username"
        placeholder="Enter username"
        noSpaces={true}
      />
      <Button type="primary" label="Next" onClick={advanceStage} disabled={!usernameIsValid} />
    </div>
    <div class="flex w-full flex-shrink-0 flex-col gap-10 p-6">
      <InputField
        type="email"
        getError={emailGetError}
        bind:value={emailValue}
        bind:isValid={emailIsValid}
        label="Email"
        placeholder="Enter email"
        noSpaces={true}
      />
      <Button type="primary" label="Next" onClick={advanceStage} disabled={!emailIsValid} />
    </div>
    <div class="flex w-full flex-shrink-0 flex-col gap-10 p-6">
      <InputField
        type="password"
        getError={signupPasswordGetError}
        bind:value={passwordValue}
        bind:isValid={passwordIsValid}
        label="Password"
        placeholder="Enter password"
        noSpaces={true}
      />
      <Button type="primary" label="Next" onClick={advanceStage} disabled={!passwordIsValid} />
    </div>
    <div class="flex w-full flex-shrink-0 flex-col gap-10 p-6">
      <InputField
        type="password"
        getError={passwordRepeatedGetError}
        bind:value={passwordRepeatedValue}
        bind:isValid={passwordRepeatedIsValid}
        label="Repeat password"
        placeholder="Enter password"
        noSpaces={true}
      />
      <Button
        type="primary"
        label="Sign up"
        onClick={makeRequest}
        disabled={!passwordRepeatedIsValid}
      />
    </div>
  </div>
</div>
