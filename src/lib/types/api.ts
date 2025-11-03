import type { MessageProps, ThreadType } from './components';

/**
 * API request and response interfaces
 */

export interface RegisterRequest {
  username?: string;
  email: string;
  password: string;
}

export interface LogInRequest {
  email: string;
  password: string;
}

export interface UserProfilePublic {
  username: string;
  nickname: string;
  avatar_link: string;
}

export interface UserProfileFull extends UserProfilePublic {
  email: string;
}

export interface GetSpoolInfoRequest {
  spool_id: number;
}

export interface GetSpoolThreadsRequest {
  spool_id: number;
}

export interface LeaveSpoolRequest {
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

export interface UpdateThreadRequest {
  id: number;
  title: string;
  type: string;
}

export interface GetThreadMessagesRequest {
  thread_id: number;
}

export interface SendThreadMessagesRequest {
  thread_id: number;
  content: string;
}

export interface InitThreadWebsocketRequest {
  thread_id: number;
  token: string;
}

export interface GetCentrifugeTokensResponse {
  ConnectToken: string;
  ChannelTokens: Record<string, string>;
}

export interface CreateSpoolRequest {
  name: string;
  banner: File;
}

export interface GetProfilesRequest {
  usernames: Array<string>;
}

export interface GetProfilesResponse {
  profiles: Array<UserProfilePublic>;
}

export interface UpdateProfileRequest {
  nickname?: string;
  avatar?: File;
}

export interface WsBase {
  type: string;
}

export interface WsMessageSent extends WsBase, MessageProps {
  thread_id: number;
}
