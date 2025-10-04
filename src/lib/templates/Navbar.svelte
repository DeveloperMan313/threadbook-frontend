<script lang="ts">
  import { resolve } from '$app/paths';
  import logo from '$lib/assets/icons/logo.svg';
</script>

<div class="navbar">
  <a class="logo-section" href={resolve('/spools')}>
    <img class="icon" src={logo} alt="logo" />
    <h1 class="website-title">ThreadBook</h1>
  </a>
  <a class="user-section" href={resolve('/signin')}>
    <div class="profile-picture"></div>
    <div class="info" title="profile">
      <p class="username">Username</p>
      <p class="tag">@user_tag</p>
    </div>
  </a>
</div>

<style>
  .navbar {
    position: fixed;
    width: 100%;
    height: 4rem;
    padding: 0 var(--m-4);
    background-color: var(--bg-secondary);
    border-bottom: var(--border-width) solid var(--border-color);
    display: flex;
    flex-direction: row;
    justify-content: space-between;
  }

  .logo-section,
  .user-section {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: var(--m-2);
    text-decoration: none;
  }

  .icon {
    width: 3rem;
    height: 3rem;
  }

  .website-title {
    font-size: 3rem;
  }

  .profile-picture {
    width: 3rem;
    height: 3rem;
    border-radius: var(--border-radius);
    background-color: var(--active-primary);
  }

  .username {
    font-size: var(--font-medium);
    margin-bottom: var(--m-2);
  }
</style>
