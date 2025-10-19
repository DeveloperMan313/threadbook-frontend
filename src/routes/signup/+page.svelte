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

<div class="page">
  <div class="main">
    <div class="slide" style:margin-left={`${-100 * registrationStage}%`}>
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
    <div class="slide">
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
    <div class="slide">
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
    <div class="slide">
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

<style>
  .page {
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .main {
    width: 18rem;
    display: flex;
    flex-direction: row;
    overflow: hidden;
    background-color: var(--bg-primary);
    border-radius: var(--border-radius-large);
  }

  .slide {
    padding: calc(var(--m-4) + var(--input-field-vert-margin)) var(--m-4) var(--m-4);
    width: 100%;
    flex-shrink: 0;
    transition: margin-left ease-in-out 0.5s;
    display: flex;
    flex-direction: column;
    gap: 2.5rem;
  }
</style>
