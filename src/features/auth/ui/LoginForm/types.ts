import type { AuthCredentials } from '../../model/types';

export interface LoginFormProps {
  onSubmit: (credentials: AuthCredentials) => void;
  isLoading: boolean;
  buttonText?: string;
  error?: string | null;
}
