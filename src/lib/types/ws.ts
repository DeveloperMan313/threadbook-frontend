import type { ThreadType } from './components';

/**
 * Centrifuge WS message payload interfaces
 */

// message events

export interface WsMessageCreated {
  id: number;
  thread_id: number;
  content: string;
  username: string;
  pauloads?: string;
  created_at: number;
}

export interface WsMessageUpdated {
  id: number;
  thread_id: number;
  content: string;
  updated_at: number;
}

export interface WsMessageDeleted {
  id: number;
  thread_id: number;
  deleted_by?: string;
}

// thread events

export interface WsThreadCreated {
  id: number;
  spool_id: number;
  title: string;
  type: ThreadType;
  access_level: number;
  is_creator: boolean;
  created_at: number;
  channel: string;
  token: string;
}

export interface WsThreadUpdated {
  id: number;
  spool_id: number;
  title: string;
  updated_at: number;
}

export interface WsThreadClosed {
  id: number;
  spool_id: number;
}

export interface WsThreadInvited {
  id: number;
  spool_id: number;
  type: ThreadType;
  title: string;
  channel: string;
  token: string;
}

// spool events

export interface WsSpoolUpdated {
  id: number;
  banner_link?: string;
  name: string;
  updated_at: number;
}

export interface WsSpoolDeleted {
  id: number;
  deleted_by?: string;
}

export interface WsSpoolInvited {
  id: number;
  banner_link?: string;
  name: string;
}
