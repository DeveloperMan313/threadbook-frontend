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
