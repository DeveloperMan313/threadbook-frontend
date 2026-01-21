<script lang="ts">
  import type { MessageProps, UserProfilePublic } from '$lib/types';
  import { getContext, tick, untrack } from 'svelte';
  import { ImageApi, MessageApi } from '$lib/api';
  import UserAvatar from './UserAvatar.svelte';
  import { Button } from './ui/button';
  import { stateThreadChats } from '$lib/states/threadChats.svelte';
  import * as ContextMenu from '$lib/components/ui/context-menu/index.js';
  import * as m from '$lib/paraglide/messages';
  import { Textarea } from './ui/textarea';
  import ModalMessageDelete from './ModalMessageDelete.svelte';
  import { stateProfile } from '$lib/states';
  import { getLocale } from '$lib/paraglide/runtime';
  import { toast } from 'svelte-sonner';

  const {
    id,
    thread_id,
    username,
    content,
    payloads,
    created_at,
    index,
    scrolledParent
  }: MessageProps = $props();

  const { getProfile } = getContext('userProfiles') as {
    getProfile: (username: string) => UserProfilePublic | undefined;
  };

  const sessionUsername = stateProfile.profile!.username;

  const nickname = $derived(getProfile(username) ? getProfile(username)!.nickname : undefined);

  const avatarSrc = $derived(
    getProfile(username) ? ImageApi.getUserAvatarURL(getProfile(username)!.avatar_link) : undefined
  );

  const shouldRenderProfileInfo = $derived.by((): boolean => {
    if (!index || !thread_id) return true;

    if (index === 0) return true;

    const prevMsg = stateThreadChats.get(thread_id)!.messages[index - 1];
    const prevDT = new Date(prevMsg.created_at).getTime();
    const thisDT = new Date(created_at).getTime();
    const maxDelta = 60 * 1000; // 1 minute
    return prevMsg.username !== username || Math.abs(thisDT - prevDT) > maxDelta;
  });

  const shouldRenderDate = $derived.by((): boolean => {
    if (!index || !thread_id) return true;

    if (index === 0) return true;

    const prevMsg = stateThreadChats.get(thread_id)!.messages[index - 1];
    const prevDate = new Date(prevMsg.created_at).getDate();
    const thisDate = new Date(created_at).getDate();
    return prevDate !== thisDate;
  });

  let isBeingEdited = $state(false);
  let editedContent = $state('');

  // resize textarea to fit content
  const onInput = () => {
    textarea!.style.height = '0';
    textarea!.style.height = `calc(${textarea!.scrollHeight}px + 0.1rem)`;
  };

  const onKeydown = (event: KeyboardEvent) => {
    const editedTrimmed = editedContent.trim();
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (editedTrimmed === '' && payloads === undefined) {
        isMessageDeleteModalOpen = true;
        return;
      }
      isBeingEdited = false;
      if (editedTrimmed === content) {
        return;
      }
      MessageApi.editMessage({
        thread_id,
        message_id: id,
        content: editedTrimmed
      }).catch(() => {
        toast.error(m.error_editing_message());
      });
    }
    if (event.key === 'Escape') {
      isBeingEdited = false;
    }
  };

  // svelte-ignore non_reactive_update
  let textarea: HTMLElement | null = null;

  $effect(() => {
    if (!isBeingEdited) return;

    editedContent = untrack(() => content);

    // HACK: devious shit, idk why tf it unfocuses on animation end if cursor is out of context menu, i'm so sorry
    setTimeout(() => {
      textarea!.focus();
    }, 200);

    tick().then(onInput);
  });

  let isContextMenuOpen = $state(false);

  const onScroll = () => {
    isContextMenuOpen = false;
    scrolledParent!.removeEventListener('scroll', onScroll);
  };

  $effect(() => {
    if (isContextMenuOpen) {
      scrolledParent!.addEventListener('scroll', onScroll);
    }
  });

  let isMessageDeleteModalOpen = $state(false);
</script>

{#if shouldRenderDate}
  <p class="mt-4 text-center text-base text-muted-foreground">
    {new Date(created_at).toLocaleString(getLocale(), {
      month: 'long',
      day: 'numeric'
    })}
  </p>
{/if}
<ContextMenu.Root bind:open={isContextMenuOpen}>
  <ContextMenu.Trigger
    class="pointer-events-none"
    disabled={sessionUsername !== username || isBeingEdited}
  >
    <div
      class={`flex w-full px-4 pe-16 hover:bg-accent/50 ${isContextMenuOpen || isBeingEdited ? 'bg-accent/50' : ''}`}
      class:mt-4={shouldRenderProfileInfo}
    >
      <div class="w-[5rem] flex-none">
        {#if shouldRenderProfileInfo}
          <UserAvatar {username} {nickname} {avatarSrc} class="size-12" />
        {/if}
      </div>
      <div class="w-full flex-1 overflow-hidden">
        {#if shouldRenderProfileInfo}
          <div class="flex w-full flex-row items-end gap-1">
            <p class="text-sm font-semibold">{nickname || username}</p>
            <p
              class="text-sm text-muted-foreground"
              title={new Date(created_at).toLocaleString(getLocale(), {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: 'numeric',
                minute: 'numeric'
              })}
            >
              {new Date(created_at).toLocaleTimeString(getLocale(), {
                hour: 'numeric',
                minute: 'numeric'
              })}
            </p>
          </div>
        {/if}
        {#if isBeingEdited}
          <Textarea
            class="m-1 box-border max-h-[50vh] min-h-9 w-[calc(100%-0.5rem)] resize-none bg-background text-sm"
            style="height: 2.35rem;"
            bind:value={editedContent}
            bind:ref={textarea}
            oninput={onInput}
            onkeydown={onKeydown}
          />
        {:else if content.length > 0}
          <p class="w-full overflow-hidden text-sm wrap-break-word whitespace-pre-line">
            {content}
          </p>
        {/if}
        {#if payloads}
          <div class="mt-2 mb-2 max-w-96">
            {#each payloads as filename (filename)}
              <!-- eslint-disable svelte/no-navigation-without-resolve -->
              <Button
                variant="outline"
                class="w-full rounded-none shadow-none first:rounded-t-md last:rounded-b-md"
                href={ImageApi.getMessageAttachmentURL(filename)}
                download={filename}><p class="w-full truncate">{filename}</p></Button
              >
            {/each}
          </div>
        {/if}
      </div>
    </div>
  </ContextMenu.Trigger>
  <ContextMenu.Content class="w-52">
    <ContextMenu.Item
      class="cursor-pointer"
      variant="default"
      onclick={() => {
        isBeingEdited = true;
      }}>{m.edit()}</ContextMenu.Item
    >
    <ContextMenu.Item
      class="cursor-pointer"
      variant="destructive"
      onclick={() => {
        isMessageDeleteModalOpen = true;
      }}>{m.delete()}</ContextMenu.Item
    >
  </ContextMenu.Content>
</ContextMenu.Root>
<ModalMessageDelete threadId={thread_id} messageId={id} bind:isOpen={isMessageDeleteModalOpen} />
