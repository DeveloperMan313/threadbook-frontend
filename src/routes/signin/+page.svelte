<script lang="ts">
  import InputField from '$lib/templates/InputField.svelte';
  import { emailGetError, signinPasswordGetError } from '$lib/validation';
  import { AuthApi } from '$lib/api';
  // import { goto } from '$app/navigation';

  let emailValue = $state('');
  let emailIsValid = $state(false);

  let passwordValue = $state('');
  let passwordIsValid = $state(false);

  let registrationStage = $state(0);

  const advanceStage = () => {
    registrationStage += 1;
  };

  const makeRequest = async () => {
    const response = await AuthApi.logIn({
      email: emailValue,
      password: passwordValue
    });

    if (!response.ok) {
      alert(response.json.error);
      return;
    }

    // goto('/spools');
  };
</script>

<div class="container">
  <div class="main">
    <div class="slide" style:margin-left={`${-100 * registrationStage}%`}>
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
        getError={signinPasswordGetError}
        bind:value={passwordValue}
        bind:isValid={passwordIsValid}
        label="Password"
        placeholder="Enter password"
        noSpaces={true}
      />
      <button type="button" disabled={!passwordIsValid} onclick={makeRequest}>Sign in</button>
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
