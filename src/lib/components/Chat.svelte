<script lang="ts">
  import { getContext, tick, untrack } from 'svelte';
  import { Button } from '$lib/components/ui/button/index.js';
  import Message from './Message.svelte';
  import type {
    ChatState,
    MessageProps,
    ThreadProps,
    WsMessageCreated,
    WsMessageDeleted,
    WsMessageUpdated
  } from '$lib/types';
  import { centrifugeClient, MessageApi } from '$lib/api';
  import { stateProfile } from '$lib/states';
  import Spinner from '$lib/components/ui/spinner/spinner.svelte';
  import { Paperclip, X } from '@lucide/svelte';
  import * as m from '$lib/paraglide/messages';
  import { stateThreadChats } from '$lib/states/threadChats.svelte';
  import { Textarea } from './ui/textarea';

  const { getCurrentThreadId, getThreads } = getContext('threads') as {
    getCurrentThreadId: () => number | null;
    getThreads: () => ThreadProps[];
  };

  const { cacheProfilesFromUsernames } = getContext('userProfiles') as {
    cacheProfilesFromUsernames: (usernames: string[]) => Promise<void>;
  };

  // Use captured threadId instead of currentThreadId to avoid race condition
  const renderMessage = (threadId: number, message: MessageProps, mine: boolean = false) => {
    lastMessageMine = mine;

    const chat = stateThreadChats.get(threadId) as ChatState;
    stateThreadChats.set(threadId, {
      ...chat,
      messages: [...chat.messages, message]
    });
  };

  $effect(() => {
    if (messages.length && (isAtBottom || lastMessageMine)) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  });

  const messageLoadLimit = 15; // TODO derived state based on client ui size

  // Use captured threadId instead of currentThreadId to avoid race condition
  const handleNotLoadedThread = (threadId: number) => {
    const thread = getThreads().find((t) => t.id === threadId)!;
    stateThreadChats.set(threadId, {
      thread: thread,
      messages: [],
      messageText: '',
      firstMessageLoaded: false,
      initialLoading: true
    });

    MessageApi.getThreadMessages({ thread_id: threadId, limit: messageLoadLimit }).then(
      async (messages) => {
        cacheProfilesFromUsernames(messages.map((m) => m.username));
        stateThreadChats.set(threadId, {
          thread: thread,
          messages: messages,
          messageText: '',
          firstMessageLoaded: messages.length < messageLoadLimit,
          initialLoading: false
        });
        await tick();
        handleScroll(); // might be at top after initial load
      }
    );

    if (thread.is_closed) return;

    centrifugeClient.subToThread(threadId);

    centrifugeClient.onThread(threadId, 'message.created', (payload: WsMessageCreated) => {
      const mine = payload.username == stateProfile.profile!.username;
      cacheProfilesFromUsernames([payload.username]);
      payload.created_at *= 1000; // convert s to ms
      renderMessage(threadId, payload, mine);
    });

    centrifugeClient.onThread(threadId, 'message.updated', (payload: WsMessageUpdated) => {
      const chat = stateThreadChats.get(threadId) as ChatState;
      stateThreadChats.set(threadId, {
        ...chat,
        messages: messages.map((m) => (m.id === payload.id ? { ...m, ...payload } : m))
      });
    });

    centrifugeClient.onThread(threadId, 'message.deleted', (payload: WsMessageDeleted) => {
      const chat = stateThreadChats.get(threadId) as ChatState;
      stateThreadChats.set(threadId, {
        ...chat,
        messages: messages.filter((m) => m.id !== payload.id)
      });
    });
  };

  // HOTFIX: never unsub from threads, stateThreadChats never clears
  // TODO think of WS unsubscribe strategy
  // onDestroy(() => {
  //   centrifugeClient.unsubFromThreads();
  // });

  const currentThreadId = $derived(getCurrentThreadId());

  const messages = $derived.by(() => {
    if (!currentThreadId) return [];
    const chat = stateThreadChats.get(currentThreadId);
    return chat ? chat.messages : [];
  });

  let messageText = $derived.by(() => {
    if (!currentThreadId) return '';
    const chat = stateThreadChats.get(currentThreadId);
    return chat ? chat.messageText : '';
  });

  const currentThreadIsClosed = $derived(
    Boolean(currentThreadId && getThreads().find((t) => t.id === currentThreadId)!.is_closed)
  );

  // thread switch
  $effect(() => {
    if (currentThreadId) {
      let threadId = currentThreadId;
      if (!stateThreadChats.has(threadId)) {
        handleNotLoadedThread(threadId);
      }
      handleScroll(); // might be at top after thread switch
    }
  });

  let messagesContainer: HTMLDivElement;
  let isAtTop = $state(false);
  let isAtBottom = $state(true);
  let lastMessageMine = false;

  const handleScroll = () => {
    const { scrollTop, scrollHeight, clientHeight } = messagesContainer;
    const threshold = 10;
    isAtTop = scrollTop <= threshold;
    isAtBottom = scrollHeight - scrollTop - clientHeight <= threshold;
  };

  // load older messages chunk on scroll
  $effect(() => {
    const threadId = currentThreadId; // capture threadId
    if (!threadId) return;
    const chat = stateThreadChats.get(threadId);
    const msgs = untrack(() => messages);
    // track only currentThread and isAtTop
    if (isAtTop && chat && !chat.firstMessageLoaded && msgs.length > 0) {
      MessageApi.getThreadMessages({
        thread_id: threadId,
        cursor_id: msgs[0].id,
        forward: false
      }).then((fetchedMessages) => {
        // save old scroll
        const scrollTopBefore = messagesContainer.scrollTop;
        const scrollHeightBefore = messagesContainer.scrollHeight;
        // cache and render new messages
        cacheProfilesFromUsernames(msgs.map((m) => m.username));
        stateThreadChats.set(threadId, {
          ...chat,
          messages: [...fetchedMessages, ...chat.messages],
          firstMessageLoaded: fetchedMessages.length < messageLoadLimit
        });
        untrack(() => {
          isAtTop = false;
        });
        // restore scroll after DOM update
        tick().then(() => {
          messagesContainer.scrollTop =
            messagesContainer.scrollHeight - scrollHeightBefore + scrollTopBefore;
        });
      });
    }
  });

  let fileInput: HTMLInputElement;
  let selectedFilesDT = new DataTransfer();
  let selectedFilenames = $state<string[]>([]);
  let isSendingMessage = $state(false);

  const onFileInputChange = () => {
    const newSelectedFilenames = selectedFilenames;
    if (fileInput.files === null) {
      return;
    }
    for (const file of fileInput.files) {
      selectedFilesDT.items.add(file);
      newSelectedFilenames.push(file.name);
    }
    selectedFilenames = newSelectedFilenames;
    tick().then(() => {
      if (isAtBottom) {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      }
    });
    fileInput.value = '';
  };

  const deleteSelectedFileByIdx = (idx: number) => {
    selectedFilesDT.items.remove(idx);
    selectedFilenames = selectedFilenames.filter((_, i) => i !== idx);
  };

  const sendMessage = async () => {
    if (!currentThreadId || isSendingMessage) return;

    if (messageText.trim() === '' && selectedFilenames.length === 0) return;

    const message: MessageProps = {
      id: 0,
      username: stateProfile.profile!.username,
      content: messageText.trim(),
      created_at: new Date().getTime(),
      updated_at: new Date().getTime(),
      thread_id: currentThreadId
    };

    isSendingMessage = true;

    MessageApi.sendMessage({
      thread_id: currentThreadId,
      content: message.content,
      files: selectedFilesDT.files
    }).finally(() => {
      isSendingMessage = false;
    });

    // WARNING: user will lose message data if request fails, but UI is more responsive that way
    const currentChat = stateThreadChats.get(currentThreadId)!;
    stateThreadChats.set(currentThreadId, {
      ...currentChat,
      messageText: ''
    });
    selectedFilesDT.items.clear();
    selectedFilenames = [];
  };

  // resize textarea to fit content
  const onInput = () => {
    textarea!.style.height = '0';
    textarea!.style.height = `calc(${textarea!.scrollHeight}px + 0.1rem)`;
  };

  const onKeydown = (event: KeyboardEvent) => {
    // avoid mutating stateThreadChats and causing an effect
    if (currentThreadId) {
      const chat = stateThreadChats.get(currentThreadId);
      if (chat) {
        chat.messageText = messageText;
      }
    }
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  // svelte-ignore non_reactive_update
  let textarea: HTMLElement | null = null;
</script>

<div class="flex h-full flex-col">
  <div class="flex-1 overflow-y-auto py-4" bind:this={messagesContainer} onscroll={handleScroll}>
    {#if currentThreadId && stateThreadChats.get(currentThreadId)?.initialLoading}
      <div class="flex h-full flex-col items-center justify-center gap-2">
        <Spinner class="size-10 text-muted-foreground" />
        <p class="text-center text-sm text-muted-foreground">{m.loading_messages()}</p>
      </div>
    {:else if messages.length === 0}
      <div class="flex h-full items-center justify-center text-gray-500">
        <div class="text-center">
          <p class="text-lg">{m.no_messages_yet()}</p>
          <p class="text-sm">{m.start_a_conversation()}</p>
        </div>
      </div>
    {:else}
      <div>
        <div class="flex h-10 w-full items-center justify-center">
          {#if currentThreadId && stateThreadChats.get(currentThreadId)?.firstMessageLoaded}
            <p class="text-lg text-muted-foreground">{m.thread_start()}</p>
          {:else}
            <Spinner
              class={`size-8 text-muted-foreground transition-opacity ${isAtTop ? '' : 'opacity-0'}`}
            />
          {/if}
        </div>
        {#each messages as message, i (message.id)}
          <Message {...message} index={i} />
        {/each}
      </div>
    {/if}
  </div>
  <div class="border-t border-gray-200 p-4 pt-2">
    {#if selectedFilenames.length > 0}
      <div class="flex w-full flex-row gap-2 overflow-x-scroll pb-3">
        {#each selectedFilenames as filename, i (i)}
          <!-- eslint-disable svelte/no-navigation-without-resolve -->
          <div
            class="flex w-32 flex-row items-center justify-between gap-1 rounded-md border-1 border-border bg-background"
          >
            <p class="w-full truncate pl-4">{filename}</p>
            <Button
              variant="ghost"
              size="icon-sm"
              class="cursor-pointer"
              onclick={() => {
                deleteSelectedFileByIdx(i);
              }}
            >
              <X />
            </Button>
          </div>
        {/each}
      </div>
    {/if}
    <div class="flex gap-2">
      <input
        type="file"
        id="fileInput"
        accept=".jpg,.jpeg,image/jpeg,.png,image/png,.webp,image/webp,.mp4,video/mp4"
        multiple
        hidden
        bind:this={fileInput}
        onchange={onFileInputChange}
      />
      <Button
        onclick={() => {
          fileInput.click();
        }}
        class="cursor-pointer"
        variant="ghost"
        size="icon"
        disabled={currentThreadIsClosed}
      >
        <Paperclip />
      </Button>
      <Textarea
        class="max-h-[50vh] min-h-9 w-[calc(100%-0.5rem)] resize-none bg-background text-sm"
        style="height: 2.35rem;"
        placeholder={m.type_a_message()}
        bind:value={messageText}
        bind:ref={textarea}
        oninput={onInput}
        onkeydown={onKeydown}
        disabled={currentThreadIsClosed}
      />
      <Button
        class="cursor-pointer"
        onclick={sendMessage}
        disabled={currentThreadIsClosed ||
          (messageText.trim() === '' && selectedFilenames.length === 0) ||
          isSendingMessage}
      >
        {m.send()}
      </Button>
    </div>
  </div>
</div>
