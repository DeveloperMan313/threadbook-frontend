<script lang="ts">
  import { getContext } from 'svelte';
  import { Button } from '$lib/components/ui/button/index.js';
  import { Input } from '$lib/components/ui/input/index.js';
  import Message from './Message.svelte';
  import type { ChatProps, MessageProps, ThreadProps } from '$lib/types';
  import type { SvelteMap } from 'svelte/reactivity';
  import { MessageApi } from '$lib/api/message';

  const { threadChats, getCurrentThread } = getContext('threads') as {
    threadChats: SvelteMap<number, ChatProps>;
    getCurrentThread: () => ThreadProps;
  };

  let currMsgId = 0;

  const renderMessage = (message: MessageProps) => {
    const currentChat = threadChats.get(currentThread.id) as ChatProps;
    threadChats.set(currentThread.id, {
      ...currentChat,
      messages: [...currentChat.messages, message],
      messageText: ''
    });
  };

  const handleEmptyThreadMessages = () => {
    if (threadChats.has(currentThread.id)) {
      return;
    }

    threadChats.set(currentThread.id, {
      thread: currentThread,
      messages: [],
      messageText: ''
    });

    MessageApi.getThreadMessages({ thread_id: currentThread.id }).then((msgs) => {
      threadChats.set(currentThread.id, {
        thread: currentThread,
        messages: msgs,
        messageText: ''
      });
      currMsgId = msgs[msgs.length - 1].id + 1;
    });

    // TODO: probably for entire chat too lazy rn
    MessageApi.initThreadWebsocket({ thread_id: currentThread.id, token: 'hello' }, renderMessage);
  };

  let currentThread = getCurrentThread();
  handleEmptyThreadMessages();
  let messages = $derived((threadChats.get(currentThread.id) as ChatProps).messages);
  let messageText = $state((threadChats.get(currentThread.id) as ChatProps).messageText);

  $effect(() => {
    currentThread = getCurrentThread();
    handleEmptyThreadMessages();
    messages = (threadChats.get(currentThread.id) as ChatProps).messages;
    messageText = (threadChats.get(currentThread.id) as ChatProps).messageText;
  });

  const sendMessage = () => {
    if (messageText.trim() === '') return;

    const message: MessageProps = {
      id: currMsgId++,
      username: 'user',
      userPfp: 'pfpurl.com',
      text: messageText,
      createdAt: new Date()
    };

    MessageApi.sendThreadMessages({ thread_id: currentThread.id, message });

    renderMessage(message);
  };

  const handleKeyPress = (event: KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };
</script>

<div class="flex h-full flex-col">
  <div class="flex-1 overflow-y-auto p-4">
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
          (threadChats.get(currentThread.id) as ChatProps).messageText = messageText;
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
