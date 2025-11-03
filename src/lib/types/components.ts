import type { CentrifugeClient } from '$lib/api';

/**
 * Component properties interfaces
 */

export interface ChatState {
  thread: ThreadProps;
  messages: Array<MessageProps>;
  messageText: string;
}

export interface ChatProps {
  centrifugeClient: CentrifugeClient;
}

export interface ContextMenuEntry {
  type: 'neutral' | 'danger';
  label: string;
  onSelect: (event: Event) => void;
}

export interface InputFieldProps {
  type: 'text' | 'email' | 'password';
  getError: (value: string) => string | null;
  value: string; // bindable
  isValid: boolean; // bindable
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  noSpaces?: boolean;
  class?: string;
}

export interface MessageProps {
  message_id: number; // HOTFIX
  id: number;
  username: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface ModalSpoolLeaveProps {
  spoolId: number;
  spoolName: string;
  isOpen: boolean; // bindable
}

export interface ModalThreadArchiveProps {
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

export interface ModalThreadRenameProps {
  threadId: number;
  threadTitle: string;
  isOpen: boolean; // bindable
}

export interface SpoolProps {
  id: number;
  name: string;
  is_creator: boolean;
  banner_link: string;
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
  title: string;
  type: ThreadType;
  is_closed: boolean;
  unreadCnt: number;
  mentionCnt: number;
}

export interface ThreadListSectionProps {
  title: string;
  entries: Array<ThreadProps>;
  expanded: boolean;
}

export interface VoiceChatProps {
  thread_id: number;
}
