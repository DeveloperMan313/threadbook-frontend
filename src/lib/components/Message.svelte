<script lang="ts">
  import type { MessageProps, UserProfilePublic } from '$lib/types';
  import { getContext, untrack } from 'svelte';
  import { ImageApi, MessageApi } from '$lib/api';
  import UserAvatar from './UserAvatar.svelte';
  import { Button } from './ui/button';
  import { stateThreadChats } from '$lib/states/threadChats.svelte';
  import * as ContextMenu from '$lib/components/ui/context-menu/index.js';
  import * as m from '$lib/paraglide/messages';
  import { Textarea } from './ui/textarea';
  import ModalMessageDelete from './ModalMessageDelete.svelte';
  import { stateProfile } from '$lib/states';

  const { id, username, content, payloads, created_at, index, thread_id }: MessageProps = $props();

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

    if (index == 0) return true;

    const prevMsg = stateThreadChats.get(thread_id)!.messages[index - 1];
    const prevDT = new Date(prevMsg.created_at).getTime();
    const thisDT = new Date(created_at).getTime();
    const maxDelta = 60 * 1000; // 1 minute
    return prevMsg.username != username || Math.abs(thisDT - prevDT) > maxDelta;
  });

  let isBeingEdited = $state(false);
  let editedContent = $state('');

  const onInput = (event: KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (editedContent === content) {
        isBeingEdited = false;
        return;
      }
      MessageApi.editMessage({
        thread_id,
        message_id: id,
        content: editedContent
      }).finally(() => {
        // TODO handle errors
        const chat = stateThreadChats.get(thread_id)!;
        stateThreadChats.set(thread_id, {
          ...chat,
          messages: chat.messages.map((m) =>
            m.id === id ? ({ ...m, content: editedContent } as MessageProps) : m
          )
        });
        isBeingEdited = false;
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
  });

  let textareaMaxHeight = $state(window.innerHeight / 2);

  window.addEventListener('resize', () => {
    textareaMaxHeight = window.innerHeight / 2;
  });

  let isContextMenuOpen = $state(false);

  let isMessageDeleteModalOpen = $state(false);
</script>

<ContextMenu.Root>
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
            <p class="text-base font-semibold">{nickname || username}</p>
            <p class="text-sm text-muted-foreground">
              {new Date(created_at).toLocaleTimeString()}
            </p>
          </div>
        {/if}
        {#if isBeingEdited}
          <Textarea
            id="textarea"
            class="m-1 min-h-[2lh] w-[calc(100%-0.5rem)] resize-none bg-background text-sm"
            style={`height: ${editedContent.split('\n').length + 1}lh; max-height: ${textareaMaxHeight}px;`}
            bind:value={editedContent}
            bind:ref={textarea}
            onkeydown={onInput}
          />
        {:else if content.length > 0}
          <p class="w-full overflow-hidden text-sm wrap-break-word">{content}</p>
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
  <ContextMenu.Content
    class="w-52"
    onOpenAutoFocus={() => {
      isContextMenuOpen = true;
    }}
    onCloseAutoFocus={() => {
      isContextMenuOpen = false;
    }}
  >
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
