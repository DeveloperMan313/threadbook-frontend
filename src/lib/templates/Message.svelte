<script lang="ts">
  import type { MessageProps } from '$lib/types';
  import * as Avatar from '$lib/components/ui/avatar/index.js';

  const { username, content, created_at }: MessageProps = $props();
</script>

<div class="flex w-full">
  <div class="w-[5rem] flex-none">
    <Avatar.Root class="size-[3rem]">
      <Avatar.Image alt="@{username}" />
      <Avatar.Fallback>{username.slice(0, 2).toUpperCase()}</Avatar.Fallback>
    </Avatar.Root>
  </div>
  <div class="flex-1">
    <div class="w-full">
      <h4 class="me-2 inline scroll-m-20 text-xl font-semibold tracking-tight">{username}</h4>
      <p class="inline text-sm text-muted-foreground">
        {new Date(created_at).toLocaleTimeString()}
      </p>
    </div>
    <p class="w-full">{content}</p>
  </div>
</div>
