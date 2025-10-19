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
  <div class="mb-2 flex items-center justify-between">
    <p class="text-[0.9rem] font-medium">{title}</p>
    <button class="contents cursor-pointer" onclick={toggleExpand}>
      <img class="h-5 w-5" src={caretDown} alt=">" />
    </button>
  </div>
  <div class="flex flex-col gap-2" class:hidden={!expanded}>
    {#each entries as entry (entry.id)}
      <ThreadEntry {...entry} />
    {/each}
  </div>
</div>
