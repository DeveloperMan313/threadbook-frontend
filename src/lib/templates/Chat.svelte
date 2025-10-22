<script lang="ts">
  import { getContext } from 'svelte';
  import { Button } from '$lib/components/ui/button/index.js';
  import { Input } from '$lib/components/ui/input/index.js';

  const currentThread = getContext('currentThread') as {
    spoolId: number;
    threadId: number | null;
  };

  let messageText = $state('');
  let messages = $state<Array<{ id: number; text: string; timestamp: Date }>>([]);

  const sendMessage = () => {
    if (messageText.trim() === '') return;

    const newMessage = {
      id: Date.now(),
      text: messageText,
      timestamp: new Date()
    };

    messages = [...messages, newMessage];
    messageText = '';
  };

  const handleKeyPress = (event: KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  $effect(() => {
    if (currentThread.threadId) {
      console.log(`Chat updated: Spool ${currentThread.spoolId}, Thread ${currentThread.threadId}`);
      // Here you would fetch messages for the current thread
      // For now, we'll just clear messages when thread changes
      messages = [];
    }
  });
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
          <div class="flex gap-3">
            <div class="h-8 w-8 flex-shrink-0 rounded-full bg-emerald-400"></div>
            <div class="flex-1">
              <div class="flex items-baseline gap-2">
                <span class="font-medium">User</span>
                <span class="text-xs text-gray-500">
                  {message.timestamp.toLocaleTimeString()}
                </span>
              </div>
              <p class="mt-1 text-gray-800">{message.text}</p>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>
  <div class="border-t border-gray-200 bg-white p-4">
    <div class="flex gap-2">
      <Input
        bind:value={messageText}
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
