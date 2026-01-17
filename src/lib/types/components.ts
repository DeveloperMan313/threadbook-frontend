/**
 * Component properties interfaces
 */

import type { AccessLevel } from './api';

export interface ChatState {
  thread: ThreadProps;
  messages: Array<MessageProps>;
  messageText: string;
  firstMessageLoaded: boolean;
  initialLoading: boolean;
}

type InputFieldGetError =
  | ((value: string) => string | null)
  | ((value: string) => Promise<string | null>);

export interface InputFieldProps {
  type: 'text' | 'email' | 'password';
  getError: InputFieldGetError;
  value: string; // bindable
  isValid: boolean; // bindable
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  noSpaces?: boolean;
  class?: string;
  tabindex?: number;
}

export interface LocaleSelectorProps {
  class?: string;
}

export interface MessageProps {
  id: number;
  thread_id: number;
  username: string;
  content: string;
  payloads?: string[];
  created_at: number;
  updated_at?: number;
  index?: number;
}

export interface ModalInviteUsersToSpool {
  spoolId: number;
  isOpen: boolean; // bindable
}

export interface ModalInviteUsersToThread {
  threadId: number;
  threadTitle: string;
  isOpen: boolean; // bindable
}

export interface ModalSpoolLeaveProps {
  spoolId: number;
  isOpen: boolean; // bindable
}

export interface ModalThreadCloseProps {
  threadId: number;
  threadTitle: string;
  isOpen: boolean; // bindable
}

export interface ModalThreadCreateProps {
  isOpen: boolean; // bindable
  threadType: ThreadType;
}

export interface ModalThreadInviteLinkCreateProps {
  isOpen: boolean; // bindable
  threadId: number;
  threadTitle: string;
}

export interface ModalThreadInviteLinkJoinProps {
  isOpen: boolean; // bindable
  linkId: string;
}

export interface ModalSpoolCreateProps {
  isOpen: boolean; // bindable
}

export interface ModalSpoolEditProps {
  isOpen: boolean; // bindable
  spoolId: number;
}

export interface ModalLogOutProps {
  isOpen: boolean; // bindable
}

export interface ModalProfileSettingsProps {
  isOpen: boolean; // bindable
}

export interface ModalThreadRenameProps {
  threadId: number;
  threadTitle: string;
  isOpen: boolean; // bindable
}

export interface SpoolProps {
  id: number;
  name: string;
  is_creator: boolean;
  access_level: AccessLevel;
  banner_link?: string;
  description: string; // unimplemented
  members: number; // unimplemented
  threads: number; // unimplemented
}

export type ThreadType = 'private' | 'public';

export interface ThreadProps {
  id: number;
  spool_id: number;
  access_level: AccessLevel;
  title: string;
  type: ThreadType;
  is_closed: boolean;
  is_creator: boolean;
  created_at: string;
  updated_at: string;
  unreadCnt: number; // unimplemented
  mentionCnt: number; // unimplemented
}

export interface ThreadListProps {
  threads: Array<ThreadProps>;
}

export interface UserAvatarProps {
  username: string;
  nickname?: string;
  avatarSrc?: string;
  class?: string;
}

export interface UserBarProps {
  username: string;
}

export interface ThreadMemberListProps {
  spoolId: number;
}
