<script lang="ts">
  import type { ButtonProps } from '$lib/types';

  let { type, label, onClick, thin, disabled }: ButtonProps = $props();
</script>

<button
  class="flex cursor-pointer items-center justify-center rounded border-2 border-transparent px-4 transition-colors duration-200 {type ===
  'primary'
    ? 'bg-emerald-400 text-white hover:bg-emerald-500 active:bg-emerald-600'
    : ''} {type === 'neutral'
    ? 'border-amber-200 bg-white hover:bg-amber-100 active:bg-amber-200'
    : ''} {type === 'subtle'
    ? 'bg-transparent hover:bg-amber-100 active:bg-amber-200'
    : ''} {type === 'danger'
    ? 'bg-orange-400 text-white hover:bg-orange-500 active:bg-orange-600'
    : ''} {thin ? 'h-auto py-1' : 'h-9'} {disabled ? 'cursor-not-allowed opacity-50' : ''}"
  onclick={onClick}
  {disabled}
>
  {label}
</button>
