import { useLocation, NavLink } from 'react-router-dom';
import { Text } from '@chakra-ui/react';
import { useLogin } from '../model/hooks/useLogin';
import { AuthLayout } from './AuthLayout/AuthLayout';
import { AuthBranding } from './AuthBranding/AuthBranding';
import { LoginForm } from './LoginForm/LoginForm';
import { AppAlert } from '@shared/ui/AppAlert';
import { isAuthNavigationState } from '../lib/guards';

export const LoginPageContainer = () => {
  const { submitLogin, isLoading, error } = useLogin();
  const location = useLocation();
  const sessionExpired = isAuthNavigationState(location.state)
    ? location.state.sessionExpired
    : false;

  return (
    <AuthLayout>
      <AuthBranding title="Welcome back" description="to continue to your notes" />

      {sessionExpired && (
        <AppAlert status="info">Your session has expired. Please log in again.</AppAlert>
      )}

      {error && <AppAlert status="error">{error}</AppAlert>}

      <LoginForm onSubmit={submitLogin} isLoading={isLoading} buttonText="Login" />

      <Text color="gray.600" _dark={{ color: 'gray.400' }} textAlign="center">
        New to us?{' '}
        <NavLink to="/register" style={{ color: '#319795', fontWeight: 'medium' }}>
          Sign Up
        </NavLink>
      </Text>
    </AuthLayout>
  );
};
