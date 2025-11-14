import { writable } from 'svelte/store';
import type { UserProfileFull } from '$lib/types';

export const userProfile = writable<UserProfileFull | null>(null);
export const voiceThreadId = writable<number | null>(null);
