<script lang="ts">
  import { getContext } from 'svelte';
  import { Button } from '$lib/components/ui/button/index.js';
  import { Input } from '$lib/components/ui/input/index.js';
  import Message from './Message.svelte';
  import type { ChatProps, MessageProps, ThreadProps } from '$lib/types';
  import type { SvelteMap } from 'svelte/reactivity';
  import { MessageApi } from '$lib/api/message';

  const { threadChats, getCurrentThreadId, getThreads } = getContext('threads') as {
    threadChats: SvelteMap<number, ChatProps>;
    getCurrentThreadId: () => number | null;
    getThreads: () => ThreadProps[];
  };

  const renderMessage = (message: MessageProps, mine: boolean = false) => {
    if (!currentThread) return;

    lastMessageMine = mine;

    const currentChat = threadChats.get(currentThread.id) as ChatProps;
    threadChats.set(currentThread.id, {
      ...currentChat,
      messages: [...currentChat.messages, message],
      messageText: ''
    });
  };

  $effect(() => {
    if (messages.length && (isAtBottom || lastMessageMine)) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  });

  const handleEmptyThreadMessages = () => {
    if (!currentThread) return;

    const threadId = currentThread.id;

    if (threadChats.has(threadId)) {
      return;
    }

    threadChats.set(threadId, {
      thread: currentThread,
      messages: [],
      messageText: ''
    });

    MessageApi.getThreadMessages({ thread_id: threadId }).then((msgs) => {
      msgs ||= [];
      // Use captured threadId instead of currentThread.id to avoid race condition
      threadChats.set(threadId, {
        thread: currentThread,
        messages: msgs,
        messageText: ''
      });
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
      handleEmptyThreadMessages();
    }
  });

  let tempMsgId = 0;
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

  const sendMessage = () => {
    if (!currentThread) return;

    if (messageText.trim() === '') return;

    const message: MessageProps = {
      id: -tempMsgId++, // use negative ids as temporary before WS message comes
      username: 'user', // TODO get from context
      content: messageText,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    MessageApi.sendThreadMessages({ thread_id: currentThread.id, content: message.content });
    renderMessage(message, true);
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
  <div class="border-t border-gray-200 bg-white p-4">
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
      <Button class="cursor-pointer" onclick={sendMessage} disabled={messageText.trim() === ''}>
        Send
      </Button>
    </div>
  </div>
</div>
