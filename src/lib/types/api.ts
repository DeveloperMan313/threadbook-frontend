import type { ThreadType } from './components';

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

export interface CheckEmailRequest {
  email: string;
}

export interface CheckEmailResponse {
  is_exist: boolean;
}

export interface CheckUsernameRequest {
  username: string;
}

export interface CheckUsernameResponse {
  is_exist: boolean;
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

export interface InviteUsersToSpoolRequest {
  spool_id: number;
  member_usernames: Array<string>;
}

export interface InviteUsersToThreadRequest {
  thread_id: number;
  invitee_usernames: Array<string>;
}

export interface CloseThreadRequest {
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
  type: ThreadType;
}

export interface GetThreadMessagesRequest {
  thread_id: number;
  cursor_id?: number;
  forward?: boolean;
  limit?: number;
}

export interface SendThreadMessagesRequest {
  thread_id: number;
  content: string;
}

export interface GetCentrifugeTokensRequest {
  spool_id?: number;
}

export interface GetCentrifugeTokensResponse {
  ConnectToken: string;
  ChannelTokens: Record<string, string>;
}

export interface GetSFUTokenRequest {
  thread_id: number;
}

export interface GetSFUTokenResponse {
  token: string;                  // JWT для подключения к LiveKit
  turn_urls?: string[];           // массив TURN серверов, напр. ["turn:threadbook.ru:3478?transport=udp"]
  turn_username?: string;         // username для TURN
  turn_credential?: string;       // credential (password) для TURN
  turn_ttl_seconds?: number;      // время жизни creds в секундах (TTL)
}

export interface CreateSpoolRequest {
  name: string;
  banner?: File;
}

export interface CreateSpoolResponse {
  spool_id: number;
  name: string;
  banner_link: string;
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