<script lang="ts">
  import type { UserAvatarProps } from '$lib/types';
  import * as Avatar from '$lib/components/ui/avatar/index.js';

  const { username, nickname, avatarSrc, class: className }: UserAvatarProps = $props();

  const initials = $derived.by(() => {
    const nameWords = (nickname || username).split(' ');
    const firstLetters = nameWords[0][0] + (nameWords[1]?.[0] || '');
    return firstLetters.toUpperCase();
  });
</script>

<Avatar.Root class={className}>
  {#if avatarSrc}
    <Avatar.Image src={avatarSrc} alt="@{username}" />
  {/if}
  <Avatar.Fallback>{initials}</Avatar.Fallback>
</Avatar.Root>
