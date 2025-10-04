import type { SpoolCardProps, ThreadEntryProps } from './components';

/**
 * Base API response
 */
export interface ApiResponse {
  ok: boolean;
  error?: string;
}

/**
 * Auth credentials
 */
export interface Credentials {
  username?: string;
  email: string;
  password: string;
}

/**
 * Spool info
 */
export interface SpoolInfo extends ApiResponse, SpoolCardProps {}

/**
 * Thread info
 */
export interface ThreadInfo extends ApiResponse, ThreadEntryProps {}
