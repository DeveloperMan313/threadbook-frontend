import type { ChatState } from '$lib/types';
import { SvelteMap } from 'svelte/reactivity';

export const stateThreadChats = new SvelteMap<number, ChatState>();

// TODO add all write functions
