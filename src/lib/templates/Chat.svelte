<script lang="ts">
  import { getContext, onDestroy, tick, untrack } from 'svelte';
  import { Button } from '$lib/components/ui/button/index.js';
  import { Input } from '$lib/components/ui/input/index.js';
  import Message from './Message.svelte';
  import type {
    ChatState,
    ChatProps,
    MessageProps,
    ThreadProps,
    WsMessageCreated,
    UserProfileFull
  } from '$lib/types';
  import type { SvelteMap } from 'svelte/reactivity';
  import { MessageApi } from '$lib/api';
  import { userProfile } from '$lib/writables';
  import Spinner from '$lib/components/ui/spinner/spinner.svelte';

  const { centrifugeClient }: ChatProps = $props();

  const { threadChats, getCurrentThreadId, getThreads } = getContext('threads') as {
    threadChats: SvelteMap<number, ChatState>;
    getCurrentThreadId: () => number | null;
    getThreads: () => ThreadProps[];
  };

  const { cacheProfilesFromMessages } = getContext('userProfiles') as {
    cacheProfilesFromMessages: (messages: Array<MessageProps>) => Promise<void>;
  };

  // Use captured threadId instead of currentThread.id to avoid race condition
  const renderMessage = (threadId: number, message: MessageProps, mine: boolean = false) => {
    lastMessageMine = mine;

    const chat = threadChats.get(threadId) as ChatState;
    threadChats.set(threadId, {
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

  // Use captured thread instead of currentThread to avoid race condition
  const handleEmptyThreadMessages = (thread: ThreadProps) => {
    if (threadChats.has(thread.id)) {
      return;
    }

    threadChats.set(thread.id, {
      thread: thread,
      messages: [],
      messageText: '',
      firstMessageLoaded: false
    });

    MessageApi.getThreadMessages({ thread_id: thread.id, limit: messageLoadLimit }).then(
      (messages) => {
        cacheProfilesFromMessages(messages);
        threadChats.set(thread.id, {
          thread: thread,
          messages: messages,
          messageText: '',
          firstMessageLoaded: messages.length < messageLoadLimit
        });
      }
    );

    const threadHandlers = {
      onMessageCreated: (payload: WsMessageCreated) => {
        console.log('ws msg');
        const mine = payload.username == profile.username;
        cacheProfilesFromMessages([payload]);
        renderMessage(thread.id, payload, mine);
      },
      onMessageUpdated: () => {}, // TODO
      onMessageDeleted: () => {} // TODO
    };

    centrifugeClient.subToThread(thread.id, threadHandlers);
  };

  onDestroy(() => {
    centrifugeClient.unsubFromThreads();
  });

  let currentThread = $derived.by(() => {
    if (!getCurrentThreadId()) return undefined;
    return getThreads().find((t) => t.id === getCurrentThreadId());
  });

  let messages = $derived.by(() => {
    if (!currentThread) return [];
    const chat = threadChats.get(currentThread.id);
    return chat ? chat.messages : [];
  });

  let messageText = $derived.by(() => {
    if (!currentThread) return '';
    const chat = threadChats.get(currentThread.id);
    return chat ? chat.messageText : '';
  });

  $effect(() => {
    if (currentThread) {
      let thread = currentThread;
      handleEmptyThreadMessages(thread);
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
    const thread = untrack(() => currentThread); // capture thread
    if (!thread) return;
    const chat = threadChats.get(thread.id);
    const msgs = untrack(() => messages);
    // track only isAtTop
    if (isAtTop && chat && !chat.firstMessageLoaded && msgs.length > 0) {
      MessageApi.getThreadMessages({
        thread_id: thread.id,
        cursor_id: msgs[0].id,
        forward: false
      }).then((fetchedMessages) => {
        // save old scroll
        const scrollTopBefore = messagesContainer.scrollTop;
        const scrollHeightBefore = messagesContainer.scrollHeight;
        // cache and render new messages
        cacheProfilesFromMessages(msgs);
        threadChats.set(thread.id, {
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

  const profile = $derived($userProfile as UserProfileFull);

  let isSendingMessage = $state(false);

  const sendMessage = async () => {
    if (!currentThread || isSendingMessage) return;

    if (messageText.trim() === '') return;

    const message: MessageProps = {
      id: 0,
      username: profile.username,
      content: messageText,
      created_at: new Date().getTime(),
      updated_at: new Date().getTime(),
      thread_id: currentThread.id
    };

    isSendingMessage = true;
    try {
      await MessageApi.sendThreadMessages({
        thread_id: currentThread.id,
        content: message.content
      });
      const currentChat = threadChats.get(currentThread.id) as ChatState;
      threadChats.set(currentThread.id, {
        ...currentChat,
        messageText: ''
      });
    } finally {
      isSendingMessage = false;
    }
  };

  const handleKeyPress = (event: KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };
</script>

<div class="flex h-full flex-col">
  <div class="flex-1 overflow-y-auto p-4" bind:this={messagesContainer} onscroll={handleScroll}>
    {#if messages.length === 0}
      <div class="flex h-full items-center justify-center text-gray-500">
        <div class="text-center">
          <p class="text-lg">No messages yet</p>
          <p class="text-sm">Start a conversation!</p>
        </div>
      </div>
    {:else}
      <div>
        <div class="flex h-10 w-full items-center justify-center">
          {#if currentThread && threadChats.get(currentThread.id)?.firstMessageLoaded}
            <p class="text-lg text-muted-foreground">Thread start</p>
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
  <div class="border-t border-gray-200 p-4">
    <div class="flex gap-2">
      <Input
        bind:value={messageText}
        oninput={() => {
          // avoid mutating threadChats and causing an effect
          if (currentThread) {
            const chat = threadChats.get(currentThread.id);
            if (chat) {
              chat.messageText = messageText;
            }
          }
        }}
        placeholder="Type a message..."
        class="flex-1"
        onkeydown={handleKeyPress}
      />
      <Button
        class="cursor-pointer"
        onclick={sendMessage}
        disabled={messageText.trim() === '' || isSendingMessage}
      >
        Send
      </Button>
    </div>
  </div>
</div>
