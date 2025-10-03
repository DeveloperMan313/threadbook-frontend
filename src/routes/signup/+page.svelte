<script lang="ts">
  import InputField from '$lib/templates/InputField.svelte';
  import {
    usernameGetError,
    emailGetError,
    passwordGetError,
    getPasswordRepeatGetError
  } from '$lib/validation';

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
</script>

<div class="container">
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
      <button type="button" disabled={!usernameIsValid} onclick={advanceStage}>Next</button>
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
      <button type="button" disabled={!emailIsValid} onclick={advanceStage}>Next</button>
    </div>
    <div class="slide">
      <InputField
        type="password"
        getError={passwordGetError}
        bind:value={passwordValue}
        bind:isValid={passwordIsValid}
        label="Password"
        placeholder="Enter password"
        noSpaces={true}
      />
      <InputField
        type="password"
        getError={passwordRepeatedGetError}
        bind:value={passwordRepeatedValue}
        bind:isValid={passwordRepeatedIsValid}
        label="Repeat password"
        placeholder="Enter password"
        noSpaces={true}
      />
      <button
        type="button"
        disabled={!passwordIsValid || !passwordRepeatedIsValid}
        onclick={advanceStage}>Register</button
      >
    </div>
    <div class="slide">
      <p>Check your email</p>
    </div>
  </div>
</div>

<style>
  .container {
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .main {
    width: 16rem;
    height: 10rem;
    display: flex;
    flex-direction: row;
    overflow: hidden;
  }

  .slide {
    width: 16rem;
    height: 100%;
    flex-shrink: 0;
    transition: margin-left ease-in-out 0.5s;
  }
</style>
