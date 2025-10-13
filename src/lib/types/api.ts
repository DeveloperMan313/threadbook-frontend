import type { ThreadType } from './components';

/**
 * API request and response interfaces
 */

export interface RegisterRequest {
  username?: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface GetSpoolInfoRequest {
  spool_id: number;
}

export interface GetSpoolThreadsRequest {
  spool_id: number;
}

export interface ArchiveThreadRequest {
  id: number;
}

export interface CreateThreadRequest {
  title: string;
  type: ThreadType;
  spool_id: number;
}

export interface RenameThreadRequest {
  id: number;
  title: string;
}

export interface Credentials {
  username?: string;
  email: string;
  password: string;
}
