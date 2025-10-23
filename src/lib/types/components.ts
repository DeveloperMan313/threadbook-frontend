/**
 * Component properties interfaces
 */

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
  id: number;
  username: string;
  userPfp: string;
  text: string;
  createdAt: Date;
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

export interface ModalThreadRenameProps {
  threadId: number;
  threadTitle: string;
  isOpen: boolean; // bindable
}

export interface SpoolProps {
  id: number;
  name: string;
  banner_link: string;
  description: string;
  members: number;
  threads: number;
}

export interface SpoolDockProps {
  spools: Array<SpoolProps>;
}

export type ThreadType = 'private' | 'public';

export interface ThreadEntryProps {
  id: number;
  title: string;
  type: ThreadType;
  is_closed: boolean;
  unreadCnt: number;
  mentionCnt: number;
}

export interface ThreadListSectionProps {
  title: string;
  entries: Array<ThreadEntryProps>;
  expanded: boolean;
}

export interface VoiceChatProps {
  thread_id: number;
}
