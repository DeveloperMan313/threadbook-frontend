import type { SpoolProps, SpoolDockProps, ThreadEntryProps } from './components';

export interface ApiResponse {
  ok: boolean;
  error?: string;
}

export interface Credentials {
  username?: string;
  email: string;
  password: string;
}

export interface SpoolInfo extends ApiResponse, SpoolProps {}

export interface UserSpoolsInfo extends ApiResponse, SpoolDockProps {}

export interface ThreadInfo extends ApiResponse, ThreadEntryProps {}
