<script lang="ts">
  import InputField from '$lib/components/InputField.svelte';
  import { emailGetError, signinPasswordGetError } from '$lib/validation';
  import { AuthApi } from '$lib/api';
  import { Button } from '$lib/components/ui/button/index.js';
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { ChevronLeft } from '@lucide/svelte';
  import { untrack } from 'svelte';
  import * as m from '$lib/paraglide/messages';
  import LocaleSelector from '$lib/components/LocaleSelector.svelte';

  let emailValue = $state('');
  let emailIsValid = $state(false);

  let passwordValue = $state('');
  let passwordIsValid = $state(false);

  let registrationStage = $state(0);

  let errorMsg = $state('');

  // if inputs are changed, clear errorMsg
  $effect(() => {
    if (emailValue && passwordValue) {
      untrack(() => (errorMsg = ''));
    }
  });

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

      goto(resolve('/spools', {}));
    } catch (error) {
      if (!(error instanceof Error)) return;
      // don't ask why this error is here lol
      if (
        error.message === 'invalid credentials' ||
        error.message ===
          'password must contain uppercase, lowercase, numbers and be at least 8 characters long'
      ) {
        errorMsg = m.incorrect_email_or_password();
        return;
      }
      errorMsg = m.could_not_sign_you_in();
    }
  };
</script>

<LocaleSelector class="absolute top-4 right-4" />
<div class="flex h-full w-full items-center justify-center">
  <div class="w-72 overflow-hidden rounded-2xl bg-background py-5">
    <div class="relative select-none">
      <Button
        class="absolute left-5 cursor-pointer rounded-full text-muted-foreground transition-opacity disabled:opacity-0"
        size="icon"
        variant="ghost"
        onclick={returnStage}
        disabled={registrationStage == 0}
      >
        <ChevronLeft />
      </Button>
      <h2 class="m-auto w-fit px-16 text-center text-3xl select-text">{m.sign_in()}</h2>
    </div>
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
          label={m.email()}
          placeholder={m.enter_email()}
          noSpaces={true}
          tabindex={-1}
        />
        <Button class="cursor-pointer" onclick={advanceStage} disabled={!emailIsValid}
          >{m.next()}</Button
        >
      </div>
      <div class="flex w-full flex-shrink-0 flex-col gap-4 p-6">
        <InputField
          type="password"
          getError={signinPasswordGetError}
          bind:value={passwordValue}
          bind:isValid={passwordIsValid}
          label={m.password()}
          placeholder={m.enter_password()}
          noSpaces={true}
          tabindex={-1}
        />
        <Button
          class="cursor-pointer"
          onclick={makeRequest}
          disabled={!passwordIsValid || errorMsg != ''}>{m.sign_in()}</Button
        >
      </div>
    </div>
    {#if errorMsg}<p class="mb-4 text-center text-sm text-destructive">{errorMsg}</p>{/if}
    <p class="mb-1 text-center text-sm">{m.dont_have_an_account()}</p>
    <p class="text-center text-sm underline">
      <a href={resolve('/signup', {})}>{m.sign_up_suggestion()}</a>
    </p>
  </div>
</div>
