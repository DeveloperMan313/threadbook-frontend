import type { CentrifugeClient } from '$lib/api';

/**
 * Component properties interfaces
 */

export interface ChatState {
  thread: ThreadProps;
  messages: Array<MessageProps>;
  messageText: string;
  firstMessageLoaded: boolean;
}

export interface ChatProps {
  centrifugeClient: CentrifugeClient;
}

export interface ContextMenuEntry {
  type: 'neutral' | 'danger';
  label: string;
  onSelect: (event: Event) => void;
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

export interface MessageProps {
  id: number;
  thread_id: number;
  content: string;
  username: string;
  pauloads?: string;
  created_at: number;
  updated_at?: number;
  index?: number;
}

export interface ModalInviteUsersToSpool {
  spoolId: number;
  spoolName: string;
  isOpen: boolean; // bindable
}

export interface ModalInviteUsersToThread {
  threadId: number;
  threadTitle: string;
  isOpen: boolean; // bindable
}

export interface ModalSpoolLeaveProps {
  spoolId: number;
  spoolName: string;
  isOpen: boolean; // bindable
}

export interface ModalThreadCloseProps {
  threadId: number;
  threadTitle: string;
  isOpen: boolean; // bindable
}

export interface ModalThreadCreateProps {
  isOpen: boolean; // bindable
}

export interface ModalSpoolCreateProps {
  isOpen: boolean; // bindable
}

export interface ModalLogOutProps {
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
  banner_link?: string;
  description: string; // unimplemented
  members: number; // unimplemented
  threads: number; // unimplemented
}

export interface SpoolDockProps {
  spools: Array<SpoolProps>;
}

export type ThreadType = 'private' | 'public';

export interface ThreadProps {
  id: number;
  spool_id: number;
  title: string;
  type: ThreadType;
  is_closed: boolean;
  is_creator: boolean;
  created_at: string;
  updated_at: string;
  unreadCnt: number;
  mentionCnt: number;
}

export interface ThreadListSectionProps {
  title: string;
  entries: Array<ThreadProps>;
  expanded: boolean;
}

export interface UserAvatarProps {
  username: string;
  nickname?: string;
  avatarSrc?: string;
  class?: string;
}
