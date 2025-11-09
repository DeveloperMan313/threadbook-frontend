<script lang="ts">
  import { getContext } from 'svelte';
  import { Button } from '$lib/components/ui/button/index.js';
  import { Input } from '$lib/components/ui/input/index.js';
  import Message from './Message.svelte';
  import type {
    ChatState,
    ChatProps,
    MessageProps,
    ThreadProps,
    WsMessageSent,
    UserProfileFull
  } from '$lib/types';
  import type { SvelteMap } from 'svelte/reactivity';
  import { MessageApi } from '$lib/api';
  import { userProfile } from '$lib/userProfile';

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

    const currentChat = threadChats.get(threadId) as ChatState;
    threadChats.set(threadId, {
      ...currentChat,
      messages: [...currentChat.messages, message]
    });
  };

  $effect(() => {
    if (messages.length && (isAtBottom || lastMessageMine)) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  });

  // Use captured thread instead of currentThread to avoid race condition
  const handleEmptyThreadMessages = (thread: ThreadProps) => {
    if (threadChats.has(thread.id)) {
      return;
    }

    threadChats.set(thread.id, {
      thread: thread,
      messages: [],
      messageText: ''
    });

    MessageApi.getThreadMessages({ thread_id: thread.id }).then((messages) => {
      messages ||= [];
      cacheProfilesFromMessages(messages);
      threadChats.set(thread.id, {
        thread: thread,
        messages: messages,
        messageText: ''
      });
    });

    centrifugeClient.subToThread(thread.id, (msg: WsMessageSent) => {
      const mine = msg.payload.username == profile.username;
      cacheProfilesFromMessages([msg.payload]);
      renderMessage(thread.id, msg.payload, mine);
    });
  };

  let currentThread = $derived(
    (() => {
      if (!getCurrentThreadId()) return null;
      return getThreads().find((t) => t.id === getCurrentThreadId());
    })()
  );

  let messages = $derived(
    (() => {
      if (!currentThread) return [];
      const chat = threadChats.get(currentThread.id);
      return chat ? chat.messages : [];
    })()
  );

  let messageText = $derived(
    (() => {
      if (!currentThread) return '';
      const chat = threadChats.get(currentThread.id);
      return chat ? chat.messageText : '';
    })()
  );

  $effect(() => {
    if (currentThread) {
      let thread = currentThread;
      handleEmptyThreadMessages(thread);
    }
  });

  let messagesContainer: HTMLDivElement;
  let isAtBottom = $state(true);
  let lastMessageMine = false;

  const handleScroll = () => {
    if (messagesContainer) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainer;
      const threshold = 10;
      isAtBottom = scrollHeight - scrollTop - clientHeight <= threshold;
    }
  };

  const profile = $derived($userProfile as UserProfileFull);

  let isSendingMessage = $state(false);

  const sendMessage = async () => {
    if (!currentThread || isSendingMessage) return;

    if (messageText.trim() === '') return;

    const message: MessageProps = {
      id: 0,
      username: profile.username,
      content: messageText,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
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
      <div class="space-y-4">
        {#each messages as message (message.id)}
          <Message {...message} />
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
