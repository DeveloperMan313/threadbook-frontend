<script lang="ts">
  import ThreadEntry from './ThreadEntry.svelte';
  import type { ThreadType, ThreadListProps } from '$lib/types';
  import Button from '$lib/components/ui/button/button.svelte';
  import { ChevronLeft, Plus } from '@lucide/svelte';
  import ModalThreadCreate from './ModalThreadCreate.svelte';
  import { stateSpoolsGetCurrentAccessLevel } from '$lib/states';
  import * as m from '$lib/paraglide/messages';

  let { threads }: ThreadListProps = $props();

  let privateExpanded = $state(true);
  let publicExpanded = $state(true);
  let closedExpanded = $state(false);

  const userAccessLevel = $derived(stateSpoolsGetCurrentAccessLevel());

  let isCreateThreadModalOpen = $state(false);
  let createThreadType = $state<ThreadType>('private');
</script>

<div class="space-y-2">
  <div>
    <div class="mb-2 flex items-center justify-between">
      <p class="text-sm font-medium text-muted-foreground">{m.private()}</p>
      <div class="flex items-center gap-1">
        {#if userAccessLevel > 0}
          <Button
            class="size-6 cursor-pointer rounded-full"
            size="icon"
            variant="ghost"
            onclick={() => {
              createThreadType = 'private';
              isCreateThreadModalOpen = true;
            }}
          >
            <Plus class="text-muted-foreground" />
          </Button>
        {/if}
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
    </div>
    <div class="flex flex-col" class:hidden={!privateExpanded}>
      {#each threads.filter((t) => !t.is_closed && t.type == 'private') as thread (thread.id)}
        <ThreadEntry {...thread} />
      {:else}
        <p class="text-sm text-muted-foreground/70 ms-3">{m.no_threads()}</p>
      {/each}
    </div>
  </div>

  <div>
    <div class="mb-2 flex items-center justify-between">
      <p class="text-sm font-medium text-muted-foreground">{m.public()}</p>
      <div class="flex items-center gap-1">
        {#if userAccessLevel > 0}
          <Button
            class="size-6 cursor-pointer rounded-full"
            size="icon"
            variant="ghost"
            onclick={() => {
              createThreadType = 'public';
              isCreateThreadModalOpen = true;
            }}
          >
            <Plus class="text-muted-foreground" />
          </Button>
        {/if}
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
    </div>
    <div class="flex flex-col" class:hidden={!publicExpanded}>
      {#each threads.filter((t) => !t.is_closed && t.type == 'public') as thread (thread.id)}
        <ThreadEntry {...thread} />
      {:else}
        <p class="text-sm text-muted-foreground/70 ms-3">{m.no_threads()}</p>
      {/each}
    </div>
  </div>

  <div>
    <div class="mb-2 flex items-center justify-between">
      <p class="text-sm font-medium text-muted-foreground">{m.closed()}</p>
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
      {:else}
        <p class="text-sm text-muted-foreground/70 ms-3">{m.no_threads()}</p>
      {/each}
    </div>
  </div>
</div>

<ModalThreadCreate bind:isOpen={isCreateThreadModalOpen} threadType={createThreadType} />
