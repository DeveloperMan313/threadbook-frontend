/**
 * Button click callback
 * @callback ButtonProps~clickCallback
 * @param {Event} event - mouse click event
 */
export type ClickCallback = (event: Event) => void;

export interface ButtonProps {
  type: 'primary' | 'neutral' | 'danger';
  label: string;
  onClick: ClickCallback;
  disabled?: boolean;
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
}

export interface SpoolCardProps {
  id: number;
  name: string;
  banner_link: string;
  description: string;
  members: number;
  threads: number;
}

export interface ThreadEntryProps {
  id: number;
  title: string;
  type: 'private' | 'public' | 'history';
  unreadCnt: number;
  mentionCnt: number;
}

export interface ThreadListSectionProps {
  title: string;
  entries: Array<ThreadEntryProps>;
  expanded: boolean;
}
