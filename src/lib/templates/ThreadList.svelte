<script lang="ts">
  import ThreadEntry from './ThreadEntry.svelte';
  import type { ThreadListProps } from '$lib/types';
  import Button from '$lib/components/ui/button/button.svelte';
  import { ChevronLeft } from '@lucide/svelte';

  let { threads }: ThreadListProps = $props();

  let privateExpanded = $state(true);
  let publicExpanded = $state(true);
  let closedExpanded = $state(false);
</script>

<div class="space-y-2">
  <div>
    <div class="mb-2 flex items-center justify-between">
      <p class="text-sm font-medium text-muted-foreground">Private</p>
      <Button
        class="size-6 cursor-pointer rounded-full"
        size="icon"
        variant="ghost"
        onclick={() => {
          privateExpanded = !privateExpanded;
        }}
      >
        <ChevronLeft
          class="text-muted-foreground transition-transform {privateExpanded
            ? '-rotate-90'
            : 'rotate-0'}"
        />
      </Button>
    </div>
    <div class="flex flex-col" class:hidden={!privateExpanded}>
      {#each threads.filter((t) => !t.is_closed && t.type == 'private') as thread (thread.id)}
        <ThreadEntry {...thread} />
      {/each}
    </div>
  </div>

  <div>
    <div class="mb-2 flex items-center justify-between">
      <p class="text-sm font-medium text-muted-foreground">Public</p>
      <Button
        class="size-6 cursor-pointer rounded-full"
        size="icon"
        variant="ghost"
        onclick={() => {
          publicExpanded = !publicExpanded;
        }}
      >
        <ChevronLeft
          class="text-muted-foreground transition-transform {publicExpanded
            ? '-rotate-90'
            : 'rotate-0'}"
        />
      </Button>
    </div>
    <div class="flex flex-col" class:hidden={!publicExpanded}>
      {#each threads.filter((t) => !t.is_closed && t.type == 'public') as thread (thread.id)}
        <ThreadEntry {...thread} />
      {/each}
    </div>
  </div>

  <div>
    <div class="mb-2 flex items-center justify-between">
      <p class="text-sm font-medium text-muted-foreground">Closed</p>
      <Button
        class="size-6 cursor-pointer rounded-full"
        size="icon"
        variant="ghost"
        onclick={() => {
          closedExpanded = !closedExpanded;
        }}
      >
        <ChevronLeft
          class="text-muted-foreground transition-transform {closedExpanded
            ? '-rotate-90'
            : 'rotate-0'}"
        />
      </Button>
    </div>
    <div class="flex flex-col" class:hidden={!closedExpanded}>
      {#each threads.filter((t) => t.is_closed) as thread (thread.id)}
        <ThreadEntry {...thread} />
      {/each}
    </div>
  </div>
</div>
