<script lang="ts">
  import type { SpoolCardProps } from '$lib/types';
  import usersIcon from '$lib/assets/icons/users.svg';
  import threadsIcon from '$lib/assets/icons/threads.svg';
  import { resolve } from '$app/paths';

  const { id, name, description, members, threads }: SpoolCardProps = $props();
</script>

<a class="spool-card" href={resolve(`/spools/${id}`)}>
  <div class="image"></div>
  <div class="body">
    <p class="name">{name}</p>
    <div class="stats">
      <div class="stat">
        <img class="icon" src={usersIcon} alt="users:" />
        <p class="number">{members}</p>
      </div>
      <div class="stat">
        <img class="icon" src={threadsIcon} alt="users:" />
        <p class="number">{threads}</p>
      </div>
    </div>
    <p class="description">{description}</p>
  </div>
</a>

<style>
  .spool-card {
    width: 16rem;
    height: 26rem;
    border-radius: var(--border-radius);
    overflow: hidden;
    text-decoration: none;
  }

  .image {
    width: 16rem;
    height: 16rem;
    background-color: var(--active-secondary);
  }

  .body {
    width: 100%;
    height: 10rem;
    padding: var(--m-3);
    display: flex;
    flex-direction: column;
    gap: var(--m-3);
    background-color: var(--bg-primary);
  }

  .name {
    font-size: var(--font-medium);
  }

  .stats,
  .stat {
    display: flex;
    flex-direction: row;
    align-items: center;
  }

  .stats {
    gap: var(--m-3);
  }

  .stat {
    gap: var(--m-2);
  }

  .icon {
    width: var(--font-medium);
    height: var(--font-medium);
  }
</style>
