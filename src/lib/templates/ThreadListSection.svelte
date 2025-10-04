<script lang="ts">
  import caretDown from '$lib/assets/icons/caret-down.svg';
  import ThreadEntry from './ThreadEntry.svelte';
  import type { ThreadListSectionProps } from '$lib/types';

  let { title, entries, expanded }: ThreadListSectionProps = $props();

  const toggleExpand = () => {
    expanded = !expanded;
  };
</script>

<div class="thread-list-section">
  <div class="header">
    <p class="title">{title}</p>
    <button class="expand-btn" onclick={toggleExpand}>
      <img class="icon expand-icon" src={caretDown} alt=">" />
    </button>
  </div>
  <div class="list" style={expanded ? '' : 'display: none;'}>
    {#each entries as entry (entry.id)}
      <ThreadEntry {...entry} />
    {/each}
  </div>
</div>

<style>
  .header {
    margin-bottom: var(--m-2);
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }

  .expand-btn {
    display: contents;
    cursor: pointer;
  }

  .expand-icon {
    width: var(--font-medium);
    height: var(--font-medium);
  }

  .list {
    display: flex;
    flex-direction: column;
    gap: var(--m-2);
  }
</style>
