<script lang="ts">
  import type { ThreadEntryProps } from '$lib/types';

  const { title, unreadCnt, mentionCnt }: ThreadEntryProps = $props();
</script>

<div class="thread-entry">
  <p class="title">{title}</p>
  <div class="info">
    {#if mentionCnt > 0}
      <p class="mention-cnt">{mentionCnt}</p>
    {/if}
    {#if unreadCnt > 0}
      <p class="unread-cnt">{unreadCnt}</p>
    {/if}
  </div>
</div>

<style>
  .thread-entry {
    height: var(--m-4);
    padding: var(--m-3);
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    background-color: var(--bg-primary);
    border-radius: var(--border-radius);
  }

  .info {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: var(--m-2);
  }

  .mention-cnt {
    width: var(--font-small);
    height: var(--font-small);
    color: var(--text-inverted);
    background-color: var(--active-primary);
    border-radius: var(--border-radius);
    text-align: center;
  }

  .unread-cnt {
    color: var(--text-secondary);
  }
</style>
