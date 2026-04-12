import type { AuthCredentials } from '../../model/types';

export interface RegisterFormProps {
  onSubmit: (credentials: AuthCredentials) => void;
  isLoading: boolean;
  buttonText?: string;
  error?: string | null;
}
